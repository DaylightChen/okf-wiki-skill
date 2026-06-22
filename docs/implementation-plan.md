# okf-wiki Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a portable Claude Code skill (`okf-wiki`) that manages an Open Knowledge Format wiki via a standalone TypeScript `okf` CLI plus an orchestrating `SKILL.md`.

**Architecture:** A single Node/TypeScript toolkit with shared `core/` modules (document, paths, bundle, links) and one function per `commands/` subcommand. The CLI (`cli.ts`) is a thin dispatcher bundled by esbuild into a committed, zero-install `dist/okf.mjs`. `SKILL.md` drives the CLI for mechanics and reserves prose-authoring for Claude. Tests (vitest) run against TypeScript source.

**Tech Stack:** TypeScript, Node ≥ 20, `js-yaml` (only runtime dep), esbuild (bundle), vitest (test).

## Global Constraints

- **Runtime:** Node ≥ 20. Single runtime dependency: `js-yaml`. No Google/ADK/BigQuery deps.
- **Distribution:** committed bundled `dist/okf.mjs` (zero-install); regenerate with `npm run build` after any toolkit change. Never hand-edit `dist/`.
- **Conformance profile (two-tier):** `type` missing/empty is the ONLY hard error among frontmatter fields; missing `title`/`description`/`timestamp` are warnings. Broken links and orphans are warnings. Spec §9 MUST-rules are errors; everything else is a warning.
- **Link policy:** authoring emits RELATIVE links. The reader resolves BOTH relative and absolute forms.
- **YAML:** load with `js-yaml` `JSON_SCHEMA` (scalars stay strings — no YAML-1.1 auto-Date/boolean surprises); dump with `sortKeys: false` (preserve key order).
- **Skill install home:** `~/.claude/skills/okf-wiki/`. All toolkit paths below are relative to that home.
- **Every command** takes `--bundle <path>` (default `$OKF_BUNDLE`, else cwd). Read commands take `--json`.

---

### Task 1: Toolkit scaffold + zero-install build pipeline

**Files:**
- Create: `toolkit/package.json`
- Create: `toolkit/tsconfig.json`
- Create: `toolkit/vitest.config.ts`
- Create: `toolkit/src/cli.ts`
- Create: `toolkit/.gitignore`
- Test: `toolkit/tests/cli_version.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `dist/okf.mjs` runnable via `node dist/okf.mjs --version`; `src/cli.ts` exporting `async function main(argv: string[]): Promise<number>`.

- [ ] **Step 1: Create `toolkit/package.json`**

```json
{
  "name": "okf",
  "version": "0.1.0",
  "type": "module",
  "bin": { "okf": "dist/okf.mjs" },
  "scripts": {
    "build": "esbuild src/main.ts --bundle --platform=node --target=node20 --format=esm --outfile=dist/okf.mjs",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": { "js-yaml": "^4.1.0" },
  "devDependencies": {
    "@types/js-yaml": "^4.0.9",
    "@types/node": "^20.11.0",
    "esbuild": "^0.20.0",
    "typescript": "^5.4.0",
    "vitest": "^1.4.0"
  }
}
```

- [ ] **Step 2: Create `toolkit/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "es2022",
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 3: Create `toolkit/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['tests/**/*.test.ts'] },
});
```

- [ ] **Step 4: Create `toolkit/.gitignore`**

```
node_modules/
```

(Note: `dist/` is intentionally NOT ignored — the bundle is committed.)

- [ ] **Step 5: Write the failing test `toolkit/tests/cli_version.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { main } from '../src/cli';

describe('cli', () => {
  it('prints version and returns 0 for --version', async () => {
    const logs: string[] = [];
    const orig = console.log;
    console.log = (...a: unknown[]) => { logs.push(a.join(' ')); };
    try {
      const code = await main(['--version']);
      expect(code).toBe(0);
      expect(logs.join('\n')).toMatch(/okf 0\.1\.0/);
    } finally {
      console.log = orig;
    }
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `cd toolkit && npm install && npx vitest run tests/cli_version.test.ts`
Expected: FAIL (`main` is not exported / file missing).

- [ ] **Step 7: Write `toolkit/src/cli.ts` (library) and `toolkit/src/main.ts` (entry)**

`src/cli.ts` exports `main` with NO side effects, so tests can import it without triggering a process exit:

```ts
export async function main(argv: string[]): Promise<number> {
  if (argv.includes('--version') || argv[0] === 'version') {
    console.log('okf 0.1.0');
    return 0;
  }
  console.error('usage: okf <command> [--bundle <path>] [options]');
  return 1;
}
```

`src/main.ts` is the bundled entry point — it runs `main` and exits. esbuild bundles THIS file (not `cli.ts`):

```ts
import { main } from './cli';

main(process.argv.slice(2)).then((code) => { process.exit(code); });
```

- [ ] **Step 8: Run test to verify it passes**

Run: `cd toolkit && npx vitest run tests/cli_version.test.ts`
Expected: PASS.

- [ ] **Step 9: Build the bundle and verify zero-install run**

Run: `cd toolkit && npm run build && node dist/okf.mjs --version`
Expected: prints `okf 0.1.0`.

- [ ] **Step 10: Commit**

```bash
git add toolkit/package.json toolkit/tsconfig.json toolkit/vitest.config.ts toolkit/.gitignore toolkit/src/cli.ts toolkit/src/main.ts toolkit/tests/cli_version.test.ts toolkit/dist/okf.mjs toolkit/package-lock.json
git commit -m "feat(okf): scaffold toolkit + zero-install build pipeline"
```

---

### Task 2: core/document — parse, serialize, validateConcept

**Files:**
- Create: `toolkit/src/core/document.ts`
- Test: `toolkit/tests/document.test.ts`

**Interfaces:**
- Consumes: `js-yaml`.
- Produces:
  - `interface OKFDocument { frontmatter: Record<string, unknown>; body: string }`
  - `interface Finding { level: 'error' | 'warning'; code: string; message: string }`
  - `class OKFDocumentError extends Error`
  - `function parseDocument(text: string): OKFDocument` (throws `OKFDocumentError` on unterminated/invalid/non-mapping frontmatter)
  - `function serializeDocument(doc: OKFDocument): string`
  - `function validateConcept(doc: OKFDocument): Finding[]`

- [ ] **Step 1: Write the failing test `toolkit/tests/document.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { parseDocument, serializeDocument, validateConcept, OKFDocumentError } from '../src/core/document';

describe('parseDocument', () => {
  it('splits frontmatter and body', () => {
    const doc = parseDocument('---\ntype: Reference\ntitle: X\n---\n\n# Body\ntext\n');
    expect(doc.frontmatter.type).toBe('Reference');
    expect(doc.frontmatter.title).toBe('X');
    expect(doc.body).toBe('# Body\ntext\n');
  });

  it('treats a file without frontmatter as all-body', () => {
    const doc = parseDocument('no frontmatter here');
    expect(doc.frontmatter).toEqual({});
    expect(doc.body).toBe('no frontmatter here');
  });

  it('throws on unterminated frontmatter', () => {
    expect(() => parseDocument('---\ntype: X\n')).toThrow(OKFDocumentError);
  });

  it('keeps timestamp as a string (JSON_SCHEMA)', () => {
    const doc = parseDocument('---\ntype: X\ntimestamp: 2026-05-28T14:30:00Z\n---\n');
    expect(typeof doc.frontmatter.timestamp).toBe('string');
  });
});

describe('serializeDocument', () => {
  it('round-trips preserving key order', () => {
    const text = '---\ntype: BigQuery Table\ntitle: Orders\ndescription: One row per order.\n---\n\n# Schema\n';
    const out = serializeDocument(parseDocument(text));
    expect(out).toBe(text);
  });
});

describe('validateConcept', () => {
  it('errors on missing type, warns on missing recommended fields', () => {
    const findings = validateConcept(parseDocument('---\ntitle: X\n---\n'));
    expect(findings.some(f => f.code === 'E-TYPE-MISSING' && f.level === 'error')).toBe(true);
    expect(findings.some(f => f.code === 'W-FIELD-MISSING' && f.message.includes('description'))).toBe(true);
  });

  it('warns on non-ISO timestamp', () => {
    const findings = validateConcept(parseDocument('---\ntype: X\ntitle: T\ndescription: D\ntimestamp: last tuesday\n---\n'));
    expect(findings.some(f => f.code === 'W-TIMESTAMP-FORMAT')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd toolkit && npx vitest run tests/document.test.ts`
Expected: FAIL (module missing).

- [ ] **Step 3: Write `toolkit/src/core/document.ts`**

```ts
import yaml from 'js-yaml';

export interface OKFDocument {
  frontmatter: Record<string, unknown>;
  body: string;
}

export interface Finding {
  level: 'error' | 'warning';
  code: string;
  message: string;
}

export class OKFDocumentError extends Error {}

const DELIM = '---';
const ISO = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;

export function parseDocument(text: string): OKFDocument {
  const lines = text.split('\n');
  if (lines.length === 0 || lines[0].trim() !== DELIM) {
    return { frontmatter: {}, body: text };
  }
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === DELIM) { end = i; break; }
  }
  if (end === -1) throw new OKFDocumentError('Unterminated YAML frontmatter block');

  let fm: unknown;
  try {
    fm = yaml.load(lines.slice(1, end).join('\n'), { schema: yaml.JSON_SCHEMA }) ?? {};
  } catch (e) {
    throw new OKFDocumentError(`Invalid YAML in frontmatter: ${(e as Error).message}`);
  }
  if (typeof fm !== 'object' || fm === null || Array.isArray(fm)) {
    throw new OKFDocumentError('Frontmatter must be a YAML mapping');
  }

  let body = lines.slice(end + 1).join('\n');
  if (body.startsWith('\n')) body = body.slice(1);
  return { frontmatter: fm as Record<string, unknown>, body };
}

export function serializeDocument(doc: OKFDocument): string {
  const fmText = yaml.dump(doc.frontmatter, { sortKeys: false, lineWidth: -1 }).trimEnd();
  const body = doc.body.endsWith('\n') ? doc.body : doc.body + '\n';
  return `${DELIM}\n${fmText}\n${DELIM}\n\n${body}`;
}

export function validateConcept(doc: OKFDocument): Finding[] {
  const out: Finding[] = [];
  const fm = doc.frontmatter;
  const type = fm['type'];
  if (typeof type !== 'string' || type.trim() === '') {
    out.push({ level: 'error', code: 'E-TYPE-MISSING', message: 'Missing or empty required field: type' });
  }
  for (const key of ['title', 'description', 'timestamp']) {
    const v = fm[key];
    const empty = v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
    if (empty) out.push({ level: 'warning', code: 'W-FIELD-MISSING', message: `Missing recommended field: ${key}` });
  }
  const ts = fm['timestamp'];
  if (typeof ts === 'string' && ts.trim() !== '' && !ISO.test(ts.trim())) {
    out.push({ level: 'warning', code: 'W-TIMESTAMP-FORMAT', message: `timestamp is not valid ISO 8601: ${ts}` });
  }
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd toolkit && npx vitest run tests/document.test.ts`
Expected: PASS (all 7 assertions).

- [ ] **Step 5: Commit**

```bash
git add toolkit/src/core/document.ts toolkit/tests/document.test.ts
git commit -m "feat(okf): core/document parse, serialize, validateConcept"
```

---

### Task 3: core/paths — concept-id ↔ path

**Files:**
- Create: `toolkit/src/core/paths.ts`
- Test: `toolkit/tests/paths.test.ts`

**Interfaces:**
- Produces:
  - `const RESERVED: Set<string>` (`'index.md'`, `'log.md'`)
  - `function parseConceptId(s: string): string[]` (throws on empty/invalid segment)
  - `function conceptIdToRelPath(id: string): string` (e.g. `tables/users` → `tables/users.md`)
  - `function relPathToConceptId(relPath: string): string` (posix; strips `.md`)
  - `function isReserved(filename: string): boolean`

- [ ] **Step 1: Write the failing test `toolkit/tests/paths.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { parseConceptId, conceptIdToRelPath, relPathToConceptId, isReserved } from '../src/core/paths';

describe('paths', () => {
  it('round-trips id and rel path', () => {
    expect(conceptIdToRelPath('tables/users')).toBe('tables/users.md');
    expect(relPathToConceptId('tables/users.md')).toBe('tables/users');
  });
  it('rejects invalid segments', () => {
    expect(() => parseConceptId('tables//x')).not.toThrow(); // empty segments filtered
    expect(() => parseConceptId('tables/.hidden')).toThrow();
    expect(() => parseConceptId('')).toThrow();
  });
  it('knows reserved filenames', () => {
    expect(isReserved('index.md')).toBe(true);
    expect(isReserved('log.md')).toBe(true);
    expect(isReserved('users.md')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd toolkit && npx vitest run tests/paths.test.ts`
Expected: FAIL (module missing).

- [ ] **Step 3: Write `toolkit/src/core/paths.ts`**

```ts
const SEGMENT = /^[A-Za-z0-9_][A-Za-z0-9_.\-]*$/;

export const RESERVED = new Set(['index.md', 'log.md']);

export function parseConceptId(s: string): string[] {
  const parts = s.split('/').filter(Boolean);
  if (parts.length === 0) throw new Error(`Empty concept id: ${s}`);
  for (const p of parts) {
    if (!SEGMENT.test(p)) throw new Error(`Invalid concept id segment: ${p}`);
  }
  return parts;
}

export function conceptIdToRelPath(id: string): string {
  return parseConceptId(id).join('/') + '.md';
}

export function relPathToConceptId(relPath: string): string {
  return relPath.replace(/\.md$/, '');
}

export function isReserved(filename: string): boolean {
  return RESERVED.has(filename);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd toolkit && npx vitest run tests/paths.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add toolkit/src/core/paths.ts toolkit/tests/paths.test.ts
git commit -m "feat(okf): core/paths concept-id <-> path"
```

---

### Task 4: core/bundle + the test fixture wiki

**Files:**
- Create: `toolkit/src/core/bundle.ts`
- Create: fixture files under `toolkit/tests/fixtures/sample-wiki/` (listed below)
- Test: `toolkit/tests/bundle.test.ts`

**Interfaces:**
- Consumes: `parseDocument`, `OKFDocument` (Task 2); `relPathToConceptId` (Task 3).
- Produces:
  - `interface ConceptEntry { id: string; relPath: string; absPath: string; doc: OKFDocument }`
  - `interface ParseError { relPath: string; message: string }`
  - `interface BundleModel { root: string; concepts: Map<string, ConceptEntry>; indexFiles: string[]; logFiles: string[]; dirs: string[]; parseErrors: ParseError[] }`
  - `async function loadBundle(root: string): Promise<BundleModel>`

- [ ] **Step 1: Create the fixture wiki.** Create these files exactly:

`toolkit/tests/fixtures/sample-wiki/datasets/sales.md`:
```markdown
---
type: BigQuery Dataset
title: Sales
description: All sales tables.
timestamp: 2026-05-28T00:00:00Z
---

Contains [orders](../tables/orders.md) and [customers](../tables/customers.md).
```

`toolkit/tests/fixtures/sample-wiki/tables/orders.md`:
```markdown
---
type: BigQuery Table
title: Orders
description: One row per order.
timestamp: 2026-05-28T00:00:00Z
---

# Schema

FK to [customers](customers.md). Part of [sales](../datasets/sales.md).
```

`toolkit/tests/fixtures/sample-wiki/tables/customers.md`:
```markdown
---
type: BigQuery Table
title: Customers
description: One row per customer.
timestamp: 2026-05-28T00:00:00Z
---

# Schema

Referenced by [orders](orders.md).
```

`toolkit/tests/fixtures/sample-wiki/tables/broken.md`:
```markdown
---
type: BigQuery Table
title: Broken
description: Links to a missing concept.
timestamp: 2026-05-28T00:00:00Z
---

See [missing](/tables/missing.md).
```

`toolkit/tests/fixtures/sample-wiki/tables/no_type.md`:
```markdown
---
title: No Type
description: Has no type field.
timestamp: 2026-05-28T00:00:00Z
---

Body.
```

`toolkit/tests/fixtures/sample-wiki/tables/thin.md`:
```markdown
---
type: BigQuery Table
---

Orphan with missing recommended fields.
```

`toolkit/tests/fixtures/sample-wiki/references/glossary.md`:
```markdown
---
type: Reference
title: Glossary
description: Shared terms.
timestamp: 2026-05-28T00:00:00Z
---

# Definition

Terms used across [orders](/tables/orders.md).
```

- [ ] **Step 2: Write the failing test `toolkit/tests/bundle.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadBundle } from '../src/core/bundle';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'sample-wiki');

describe('loadBundle', () => {
  it('loads concepts keyed by id and skips reserved files', async () => {
    const b = await loadBundle(ROOT);
    expect(b.concepts.has('tables/orders')).toBe(true);
    expect(b.concepts.has('references/glossary')).toBe(true);
    expect(b.concepts.get('tables/orders')!.doc.frontmatter.title).toBe('Orders');
  });

  it('records dirs in posix form including root', async () => {
    const b = await loadBundle(ROOT);
    expect(b.dirs).toContain('');
    expect(b.dirs).toContain('tables');
    expect(b.dirs).toContain('references');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd toolkit && npx vitest run tests/bundle.test.ts`
Expected: FAIL (module missing).

- [ ] **Step 4: Write `toolkit/src/core/bundle.ts`**

```ts
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parseDocument, OKFDocument } from './document';
import { relPathToConceptId } from './paths';

export interface ConceptEntry {
  id: string;
  relPath: string;
  absPath: string;
  doc: OKFDocument;
}

export interface ParseError {
  relPath: string;
  message: string;
}

export interface BundleModel {
  root: string;
  concepts: Map<string, ConceptEntry>;
  indexFiles: string[];
  logFiles: string[];
  dirs: string[];
  parseErrors: ParseError[];
}

const SKIP_DIRS = new Set(['.git', 'node_modules']);

function toPosix(p: string): string {
  return p.split(path.sep).join('/');
}

async function collectDirs(dir: string, acc: string[]): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory() && !SKIP_DIRS.has(e.name)) {
      const abs = path.join(dir, e.name);
      acc.push(abs);
      await collectDirs(abs, acc);
    }
  }
}

export async function loadBundle(root: string): Promise<BundleModel> {
  root = path.resolve(root);
  const concepts = new Map<string, ConceptEntry>();
  const indexFiles: string[] = [];
  const logFiles: string[] = [];
  const parseErrors: ParseError[] = [];

  const subDirs: string[] = [];
  await collectDirs(root, subDirs);
  const allDirs = [root, ...subDirs];
  const dirs = allDirs.map((d) => toPosix(path.relative(root, d))).sort();

  for (const d of allDirs) {
    const entries = await fs.readdir(d, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isFile() || !e.name.endsWith('.md')) continue;
      const abs = path.join(d, e.name);
      const relPath = toPosix(path.relative(root, abs));
      if (e.name === 'index.md') { indexFiles.push(relPath); continue; }
      if (e.name === 'log.md') { logFiles.push(relPath); continue; }
      const text = await fs.readFile(abs, 'utf8');
      try {
        const doc = parseDocument(text);
        const id = relPathToConceptId(relPath);
        concepts.set(id, { id, relPath, absPath: abs, doc });
      } catch (err) {
        parseErrors.push({ relPath, message: (err as Error).message });
      }
    }
  }

  return { root, concepts, indexFiles, logFiles, dirs, parseErrors };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd toolkit && npx vitest run tests/bundle.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add toolkit/src/core/bundle.ts toolkit/tests/bundle.test.ts toolkit/tests/fixtures
git commit -m "feat(okf): core/bundle loader + fixture wiki"
```

---

### Task 5: core/links — resolve relative+absolute, build graph

**Files:**
- Create: `toolkit/src/core/links.ts`
- Test: `toolkit/tests/links.test.ts`

**Interfaces:**
- Consumes: `BundleModel` (Task 4).
- Produces:
  - `interface RawLink { target: string; isAbsolute: boolean }`
  - `interface Edge { from: string; to: string; absolute: boolean }`
  - `interface LinkGraph { edges: Edge[]; backlinks: Map<string, string[]>; broken: { from: string; rawTarget: string }[]; orphans: string[] }`
  - `function extractLinks(body: string): RawLink[]`
  - `function resolveTarget(rawTarget: string, fromRelPath: string): string | null` (returns concept id, or `null` if it escapes the bundle root)
  - `function buildGraph(bundle: BundleModel): LinkGraph`

- [ ] **Step 1: Write the failing test `toolkit/tests/links.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { extractLinks, resolveTarget, buildGraph } from '../src/core/links';
import { loadBundle } from '../src/core/bundle';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'sample-wiki');

describe('resolveTarget', () => {
  it('resolves relative links against the source dir', () => {
    expect(resolveTarget('customers.md', 'tables/orders.md')).toBe('tables/customers');
    expect(resolveTarget('../datasets/sales.md', 'tables/orders.md')).toBe('datasets/sales');
  });
  it('resolves absolute (bundle-root) links', () => {
    expect(resolveTarget('/tables/orders.md', 'references/glossary.md')).toBe('tables/orders');
  });
  it('returns null when escaping the bundle', () => {
    expect(resolveTarget('../../etc/passwd.md', 'tables/orders.md')).toBeNull();
  });
});

describe('extractLinks', () => {
  it('extracts .md links and flags absolute', () => {
    const links = extractLinks('a [x](foo.md) b [y](/bar.md#h)');
    expect(links).toEqual([
      { target: 'foo.md', isAbsolute: false },
      { target: '/bar.md', isAbsolute: true },
    ]);
  });
});

describe('buildGraph', () => {
  it('builds edges from both link forms, finds broken + orphans', async () => {
    const g = buildGraph(await loadBundle(ROOT));
    // glossary uses an ABSOLUTE link to orders -> must still produce an edge
    expect(g.edges.some(e => e.from === 'references/glossary' && e.to === 'tables/orders')).toBe(true);
    // orders <-> customers relative links
    expect(g.backlinks.get('tables/customers')).toContain('tables/orders');
    // broken.md -> /tables/missing
    expect(g.broken.some(b => b.from === 'tables/broken')).toBe(true);
    // thin.md has no links in or out
    expect(g.orphans).toContain('tables/thin');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd toolkit && npx vitest run tests/links.test.ts`
Expected: FAIL (module missing).

- [ ] **Step 3: Write `toolkit/src/core/links.ts`**

```ts
import path from 'node:path';
import type { BundleModel } from './bundle';

const LINK_RE = /\]\(([^)\s]+\.md)(?:#[A-Za-z0-9_\-]*)?\)/g;

export interface RawLink { target: string; isAbsolute: boolean; }
export interface Edge { from: string; to: string; absolute: boolean; }
export interface LinkGraph {
  edges: Edge[];
  backlinks: Map<string, string[]>;
  broken: { from: string; rawTarget: string }[];
  orphans: string[];
}

export function extractLinks(body: string): RawLink[] {
  const out: RawLink[] = [];
  for (const m of body.matchAll(LINK_RE)) {
    const target = m[1];
    out.push({ target, isAbsolute: target.startsWith('/') });
  }
  return out;
}

export function resolveTarget(rawTarget: string, fromRelPath: string): string | null {
  let rel: string;
  if (rawTarget.startsWith('/')) {
    rel = rawTarget.slice(1);
  } else {
    const fromDir = path.posix.dirname(fromRelPath);
    rel = path.posix.normalize(path.posix.join(fromDir, rawTarget));
  }
  if (rel.startsWith('..') || rel.startsWith('/')) return null;
  return rel.replace(/\.md$/, '');
}

export function buildGraph(bundle: BundleModel): LinkGraph {
  const edges: Edge[] = [];
  const backlinks = new Map<string, string[]>();
  const broken: { from: string; rawTarget: string }[] = [];
  const outDeg = new Map<string, number>();
  const inDeg = new Map<string, number>();

  for (const [id, entry] of bundle.concepts) {
    const seen = new Set<string>();
    for (const link of extractLinks(entry.doc.body)) {
      const to = resolveTarget(link.target, entry.relPath);
      if (to === null || !bundle.concepts.has(to)) {
        broken.push({ from: id, rawTarget: link.target });
        continue;
      }
      if (to === id || seen.has(to)) continue;
      seen.add(to);
      edges.push({ from: id, to, absolute: link.isAbsolute });
      outDeg.set(id, (outDeg.get(id) ?? 0) + 1);
      inDeg.set(to, (inDeg.get(to) ?? 0) + 1);
      const bl = backlinks.get(to) ?? [];
      bl.push(id);
      backlinks.set(to, bl);
    }
  }

  const orphans: string[] = [];
  for (const id of bundle.concepts.keys()) {
    if ((outDeg.get(id) ?? 0) === 0 && (inDeg.get(id) ?? 0) === 0) orphans.push(id);
  }
  return { edges, backlinks, broken, orphans };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd toolkit && npx vitest run tests/links.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add toolkit/src/core/links.ts toolkit/tests/links.test.ts
git commit -m "feat(okf): core/links resolve both forms + graph/backlinks/orphans"
```

---

### Task 6: index command — generate, write, drift check

**Files:**
- Create: `toolkit/src/commands/index.ts`
- Test: `toolkit/tests/index.test.ts`

**Interfaces:**
- Consumes: `BundleModel`, `ConceptEntry` (Task 4).
- Produces:
  - `function expectedIndexes(bundle: BundleModel): Map<string, string>` (key = index.md relPath, value = content)
  - `async function writeIndexes(bundle: BundleModel): Promise<string[]>` (writes changed files, returns their relPaths)
  - `async function checkIndexes(bundle: BundleModel): Promise<string[]>` (relPaths whose on-disk content differs or is missing — backs `index --check`)

- [ ] **Step 1: Write the failing test `toolkit/tests/index.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { expectedIndexes, checkIndexes } from '../src/commands/index';
import { loadBundle } from '../src/core/bundle';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'sample-wiki');

describe('expectedIndexes', () => {
  it('generates a grouped index for the tables dir', async () => {
    const idx = expectedIndexes(await loadBundle(ROOT));
    const tables = idx.get('tables/index.md')!;
    expect(tables).toContain('# BigQuery Table');
    expect(tables).toContain('* [Orders](orders.md) - One row per order.');
    expect(tables).not.toMatch(/^---/); // no frontmatter
  });

  it('generates a root index listing subdirectories', async () => {
    const idx = expectedIndexes(await loadBundle(ROOT));
    const root = idx.get('index.md')!;
    expect(root).toContain('# Subdirectories');
    expect(root).toContain('* [tables](tables/index.md)');
  });

  it('checkIndexes flags missing/stale indexes', async () => {
    const drift = await checkIndexes(await loadBundle(ROOT));
    expect(drift).toContain('tables/index.md');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd toolkit && npx vitest run tests/index.test.ts`
Expected: FAIL (module missing).

- [ ] **Step 3: Write `toolkit/src/commands/index.ts`**

```ts
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { BundleModel } from '../core/bundle';

interface Entry { type: string; title: string; link: string; desc: string; }

function buildIndexText(entries: Entry[]): string {
  const grouped = new Map<string, Entry[]>();
  for (const e of entries) {
    const g = grouped.get(e.type) ?? [];
    g.push(e);
    grouped.set(e.type, g);
  }
  const sections: string[] = [];
  for (const type of [...grouped.keys()].sort()) {
    const lines = [`# ${type}`, ''];
    const items = grouped.get(type)!.sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
    for (const it of items) {
      lines.push(`* [${it.title}](${it.link})${it.desc ? ` - ${it.desc}` : ''}`);
    }
    sections.push(lines.join('\n'));
  }
  return sections.join('\n\n') + '\n';
}

export function expectedIndexes(bundle: BundleModel): Map<string, string> {
  const result = new Map<string, string>();
  // Map dir relPath ('' = root) -> child concept entries + child dirs.
  for (const dir of bundle.dirs) {
    const entries: Entry[] = [];
    const prefix = dir === '' ? '' : dir + '/';

    // direct child concepts
    for (const c of bundle.concepts.values()) {
      const cdir = c.relPath.includes('/') ? c.relPath.slice(0, c.relPath.lastIndexOf('/')) : '';
      if (cdir !== dir) continue;
      const fm = c.doc.frontmatter;
      entries.push({
        type: String(fm.type ?? 'Other'),
        title: String(fm.title ?? path.basename(c.relPath, '.md')),
        link: path.posix.basename(c.relPath),
        desc: String(fm.description ?? ''),
      });
    }

    // direct child subdirectories
    for (const d of bundle.dirs) {
      if (d === '' || d === dir) continue;
      const ddir = d.includes('/') ? d.slice(0, d.lastIndexOf('/')) : '';
      if (ddir !== dir) continue;
      const name = path.posix.basename(d);
      const childTitles = [...bundle.concepts.values()]
        .filter((c) => c.relPath.startsWith(d + '/'))
        .map((c) => String(c.doc.frontmatter.title ?? path.basename(c.relPath, '.md')));
      const desc = childTitles.length ? `Contains: ${childTitles.slice(0, 6).join(', ')}.` : '';
      entries.push({ type: 'Subdirectories', title: name, link: `${name}/index.md`, desc });
    }

    if (entries.length === 0) continue;
    result.set(`${prefix}index.md`, buildIndexText(entries));
  }
  return result;
}

export async function checkIndexes(bundle: BundleModel): Promise<string[]> {
  const expected = expectedIndexes(bundle);
  const drift: string[] = [];
  for (const [rel, content] of expected) {
    const abs = path.join(bundle.root, rel);
    let current: string | null = null;
    try { current = await fs.readFile(abs, 'utf8'); } catch { current = null; }
    if (current !== content) drift.push(rel);
  }
  return drift;
}

export async function writeIndexes(bundle: BundleModel): Promise<string[]> {
  const expected = expectedIndexes(bundle);
  const changed: string[] = [];
  for (const [rel, content] of expected) {
    const abs = path.join(bundle.root, rel);
    let current: string | null = null;
    try { current = await fs.readFile(abs, 'utf8'); } catch { current = null; }
    if (current !== content) {
      await fs.writeFile(abs, content, 'utf8');
      changed.push(rel);
    }
  }
  return changed;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd toolkit && npx vitest run tests/index.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add toolkit/src/commands/index.ts toolkit/tests/index.test.ts
git commit -m "feat(okf): index command (generate/write/drift)"
```

---

### Task 7: validate command — the two-tier conformance profile

**Files:**
- Create: `toolkit/src/commands/validate.ts`
- Modify: add fixture files `toolkit/tests/fixtures/sample-wiki/log.md` and `toolkit/tests/fixtures/sample-wiki/tables/index.md`
- Test: `toolkit/tests/validate.test.ts`

**Interfaces:**
- Consumes: `BundleModel` (Task 4), `Finding`/`validateConcept` (Task 2), `buildGraph` (Task 5), `expectedIndexes` (Task 6).
- Produces:
  - `interface ScopedFinding extends Finding { where: string }` (`where` = relPath or concept id)
  - `function runValidate(bundle: BundleModel): ScopedFinding[]`
  - `function formatFindings(findings: ScopedFinding[]): string`

- [ ] **Step 1: Add two edge-case fixture files.**

`toolkit/tests/fixtures/sample-wiki/log.md` (bad date heading → `E-LOG-DATE`):
```markdown
# Update Log

## May 1, 2026
* **Creation**: started.
```

`toolkit/tests/fixtures/sample-wiki/tables/index.md` (non-root index with frontmatter → `E-INDEX-FRONTMATTER`):
```markdown
---
note: indexes should not have frontmatter
---

# BigQuery Table

* [Orders](orders.md) - One row per order.
```

- [ ] **Step 2: Write the failing test `toolkit/tests/validate.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { runValidate } from '../src/commands/validate';
import { loadBundle } from '../src/core/bundle';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'sample-wiki');

describe('runValidate', () => {
  it('flags the spec MUST-rules as errors', async () => {
    const f = await runValidate(await loadBundle(ROOT));
    const codes = (lvl: string) => f.filter(x => x.level === lvl).map(x => x.code);
    expect(codes('error')).toContain('E-TYPE-MISSING');      // no_type.md
    expect(codes('error')).toContain('E-LOG-DATE');          // log.md bad date
    expect(codes('error')).toContain('E-INDEX-FRONTMATTER'); // tables/index.md
  });

  it('reports recommended/link issues as warnings, never errors', async () => {
    const f = await runValidate(await loadBundle(ROOT));
    const wcodes = f.filter(x => x.level === 'warning').map(x => x.code);
    expect(wcodes).toContain('W-FIELD-MISSING');  // thin.md
    expect(wcodes).toContain('W-LINK-BROKEN');    // broken.md
    expect(wcodes).toContain('W-ORPHAN');         // thin.md
    expect(wcodes).toContain('W-LINK-ABSOLUTE');  // glossary.md uses /tables/orders.md
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd toolkit && npx vitest run tests/validate.test.ts`
Expected: FAIL (module missing).

- [ ] **Step 4: Write `toolkit/src/commands/validate.ts`**

```ts
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { BundleModel } from '../core/bundle';
import { validateConcept, Finding } from '../core/document';
import { buildGraph, extractLinks } from '../core/links';
import { expectedIndexes } from './index';

export interface ScopedFinding extends Finding { where: string; }

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function runValidate(bundle: BundleModel): Promise<ScopedFinding[]> {
  const out: ScopedFinding[] = [];

  // Parse failures from the loader.
  for (const pe of bundle.parseErrors) {
    out.push({ level: 'error', code: 'E-FRONTMATTER-PARSE', message: pe.message, where: pe.relPath });
  }

  // Per-concept field rules + absolute-link style warning.
  for (const c of bundle.concepts.values()) {
    for (const f of validateConcept(c.doc)) out.push({ ...f, where: c.id });
    for (const l of extractLinks(c.doc.body)) {
      if (l.isAbsolute) {
        out.push({ level: 'warning', code: 'W-LINK-ABSOLUTE', message: `Absolute link ${l.target} (profile prefers relative)`, where: c.id });
      }
    }
  }

  // Graph-derived warnings.
  const g = buildGraph(bundle);
  for (const b of g.broken) out.push({ level: 'warning', code: 'W-LINK-BROKEN', message: `Broken link to ${b.rawTarget}`, where: b.from });
  for (const o of g.orphans) out.push({ level: 'warning', code: 'W-ORPHAN', message: 'Concept has no inbound or outbound links', where: o });

  // Reserved-file rules.
  for (const rel of bundle.indexFiles) {
    const text = await fs.readFile(path.join(bundle.root, rel), 'utf8');
    if (text.trimStart().startsWith('---') && rel !== 'index.md') {
      out.push({ level: 'error', code: 'E-INDEX-FRONTMATTER', message: 'Non-root index.md must not contain frontmatter', where: rel });
    }
  }
  for (const rel of bundle.logFiles) {
    const text = await fs.readFile(path.join(bundle.root, rel), 'utf8');
    for (const line of text.split('\n')) {
      const m = /^##\s+(.+?)\s*$/.exec(line);
      if (m && !ISO_DATE.test(m[1])) {
        out.push({ level: 'error', code: 'E-LOG-DATE', message: `Log date heading not ISO YYYY-MM-DD: ${m[1]}`, where: rel });
      }
    }
  }

  // Index freshness.
  const expected = expectedIndexes(bundle);
  const present = new Set(bundle.indexFiles);
  for (const [rel] of expected) {
    if (!present.has(rel)) {
      out.push({ level: 'warning', code: 'W-INDEX-MISSING', message: 'Directory has no index.md', where: rel });
    }
  }

  return out;
}

export function formatFindings(findings: ScopedFinding[]): string {
  if (findings.length === 0) return 'OK: no findings.';
  const errs = findings.filter(f => f.level === 'error');
  const warns = findings.filter(f => f.level === 'warning');
  const lines: string[] = [];
  for (const f of [...errs, ...warns]) {
    lines.push(`${f.level === 'error' ? 'ERROR' : 'warn '} [${f.code}] ${f.where}: ${f.message}`);
  }
  lines.push('');
  lines.push(`${errs.length} error(s), ${warns.length} warning(s).`);
  return lines.join('\n');
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd toolkit && npx vitest run tests/validate.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add toolkit/src/commands/validate.ts toolkit/tests/validate.test.ts toolkit/tests/fixtures/sample-wiki/log.md toolkit/tests/fixtures/sample-wiki/tables/index.md
git commit -m "feat(okf): validate command + two-tier conformance profile"
```

---

### Task 8: new command + concept templates

**Files:**
- Create: `toolkit/src/commands/templates.ts`
- Create: `toolkit/src/commands/new.ts`
- Test: `toolkit/tests/new.test.ts`

**Interfaces:**
- Consumes: `OKFDocument`/`serializeDocument` (Task 2), `conceptIdToRelPath` (Task 3).
- Produces:
  - `function bodyTemplate(type: string): string`
  - `interface NewOptions { type: string; id: string; title?: string; description?: string; resource?: string; tags?: string[]; force?: boolean; now?: string }`
  - `function scaffold(opts: NewOptions): OKFDocument`
  - `async function runNew(root: string, opts: NewOptions): Promise<string>` (returns relPath; throws if file exists and `!force`)

- [ ] **Step 1: Write the failing test `toolkit/tests/new.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { scaffold, runNew } from '../src/commands/new';
import { parseDocument } from '../src/core/document';

describe('scaffold', () => {
  it('produces conformant frontmatter and a type-appropriate body', () => {
    const doc = scaffold({ type: 'Reference', id: 'references/x', title: 'X', description: 'D', now: '2026-06-22T00:00:00Z' });
    expect(doc.frontmatter.type).toBe('Reference');
    expect(doc.frontmatter.timestamp).toBe('2026-06-22T00:00:00Z');
    expect(doc.body).toContain('# Definition');
    expect(doc.body).toContain('# Citations');
  });

  it('uses # Schema for table-like types', () => {
    const doc = scaffold({ type: 'BigQuery Table', id: 'tables/y', now: '2026-06-22T00:00:00Z' });
    expect(doc.body).toContain('# Schema');
  });
});

describe('runNew', () => {
  it('writes a file and refuses to overwrite without force', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'okf-'));
    const rel = await runNew(dir, { type: 'Reference', id: 'references/x', title: 'X', description: 'D', now: '2026-06-22T00:00:00Z' });
    expect(rel).toBe('references/x.md');
    const written = parseDocument(await fs.readFile(path.join(dir, rel), 'utf8'));
    expect(written.frontmatter.title).toBe('X');
    await expect(runNew(dir, { type: 'Reference', id: 'references/x', now: '2026-06-22T00:00:00Z' })).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd toolkit && npx vitest run tests/new.test.ts`
Expected: FAIL (modules missing).

- [ ] **Step 3: Write `toolkit/src/commands/templates.ts`**

```ts
export function bodyTemplate(type: string): string {
  const t = type.toLowerCase();
  if (t === 'reference') {
    return '# Definition\n\nDescribe the concept here.\n\n# Citations\n';
  }
  if (t.includes('table')) {
    return '# Schema\n\n| Column | Type | Description |\n|--------|------|-------------|\n\n# Citations\n';
  }
  if (t === 'playbook') {
    return '# Trigger\n\nWhen this applies.\n\n# Steps\n\n1. First step.\n\n# Citations\n';
  }
  return 'Describe the concept here.\n\n# Citations\n';
}
```

- [ ] **Step 4: Write `toolkit/src/commands/new.ts`**

```ts
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { OKFDocument, serializeDocument } from '../core/document';
import { conceptIdToRelPath } from '../core/paths';
import { bodyTemplate } from './templates';

export interface NewOptions {
  type: string;
  id: string;
  title?: string;
  description?: string;
  resource?: string;
  tags?: string[];
  force?: boolean;
  now?: string;
}

export function scaffold(opts: NewOptions): OKFDocument {
  const fm: Record<string, unknown> = { type: opts.type };
  if (opts.resource) fm.resource = opts.resource;
  fm.title = opts.title ?? opts.id.split('/').pop();
  fm.description = opts.description ?? '';
  if (opts.tags && opts.tags.length) fm.tags = opts.tags;
  fm.timestamp = opts.now ?? new Date().toISOString();
  return { frontmatter: fm, body: bodyTemplate(opts.type) };
}

export async function runNew(root: string, opts: NewOptions): Promise<string> {
  const rel = conceptIdToRelPath(opts.id);
  const abs = path.join(root, rel);
  let exists = false;
  try { await fs.access(abs); exists = true; } catch { exists = false; }
  if (exists && !opts.force) throw new Error(`Concept already exists: ${rel} (use --force to overwrite)`);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, serializeDocument(scaffold(opts)), 'utf8');
  return rel;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd toolkit && npx vitest run tests/new.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add toolkit/src/commands/templates.ts toolkit/src/commands/new.ts toolkit/tests/new.test.ts
git commit -m "feat(okf): new command + concept templates"
```

---

### Task 9: move command — relocate + rewrite inbound links

**Files:**
- Create: `toolkit/src/commands/move.ts`
- Test: `toolkit/tests/move.test.ts`

**Interfaces:**
- Consumes: `BundleModel`/`loadBundle` (Task 4), `resolveTarget`/`extractLinks` (Task 5), `conceptIdToRelPath` (Task 3).
- Produces:
  - `interface Edit { relPath: string; before: string; after: string }`
  - `interface MovePlan { fromId: string; toId: string; fileFrom: string; fileTo: string; edits: Edit[] }`
  - `function planMove(bundle: BundleModel, fromId: string, toId: string): MovePlan`
  - `async function runMove(root: string, fromId: string, toId: string, opts?: { dryRun?: boolean }): Promise<MovePlan>`

- [ ] **Step 1: Write the failing test `toolkit/tests/move.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runMove } from '../src/commands/move';

async function makeWiki(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'okf-mv-'));
  await fs.mkdir(path.join(dir, 'tables'), { recursive: true });
  await fs.writeFile(path.join(dir, 'tables', 'orders.md'),
    '---\ntype: T\ntitle: Orders\ndescription: d\ntimestamp: 2026-01-01T00:00:00Z\n---\n\nFK to [customers](customers.md).\n');
  await fs.writeFile(path.join(dir, 'tables', 'customers.md'),
    '---\ntype: T\ntitle: Customers\ndescription: d\ntimestamp: 2026-01-01T00:00:00Z\n---\n\nseen by [orders](orders.md)\n');
  return dir;
}

describe('runMove', () => {
  it('moves the file and rewrites inbound relative links', async () => {
    const dir = await makeWiki();
    const plan = await runMove(dir, 'tables/customers', 'reference/people');
    // file moved
    await expect(fs.access(path.join(dir, 'reference', 'people.md'))).resolves.toBeUndefined();
    // orders.md inbound link rewritten to the new relative path
    const orders = await fs.readFile(path.join(dir, 'tables', 'orders.md'), 'utf8');
    expect(orders).toContain('[customers](../reference/people.md)');
    expect(plan.edits.some(e => e.relPath === 'tables/orders.md')).toBe(true);
    // the moved doc's OWN outbound link is recomputed for its new location
    const people = await fs.readFile(path.join(dir, 'reference', 'people.md'), 'utf8');
    expect(people).toContain('[orders](../tables/orders.md)');
  });

  it('dry-run makes no changes', async () => {
    const dir = await makeWiki();
    await runMove(dir, 'tables/customers', 'reference/people', { dryRun: true });
    await expect(fs.access(path.join(dir, 'reference', 'people.md'))).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd toolkit && npx vitest run tests/move.test.ts`
Expected: FAIL (module missing).

- [ ] **Step 3: Write `toolkit/src/commands/move.ts`**

```ts
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { loadBundle, BundleModel } from '../core/bundle';
import { extractLinks, resolveTarget } from '../core/links';
import { conceptIdToRelPath } from '../core/paths';

export interface Edit { relPath: string; before: string; after: string; }
export interface MovePlan { fromId: string; toId: string; fileFrom: string; fileTo: string; edits: Edit[]; }

function relLink(fromRelPath: string, toRelPath: string): string {
  return path.posix.relative(path.posix.dirname(fromRelPath), toRelPath) || path.posix.basename(toRelPath);
}

export function planMove(bundle: BundleModel, fromId: string, toId: string): MovePlan {
  const fileFrom = conceptIdToRelPath(fromId);
  const fileTo = conceptIdToRelPath(toId);
  const edits: Edit[] = [];

  // 1. Rewrite INBOUND links in other docs (target resolves to fromId) -> new relative path.
  for (const c of bundle.concepts.values()) {
    if (c.id === fromId) continue;
    let body = c.doc.body;
    let changed = false;
    for (const link of extractLinks(body)) {
      if (resolveTarget(link.target, c.relPath) !== fromId) continue;
      body = body.split(`](${link.target})`).join(`](${relLink(c.relPath, fileTo)})`);
      changed = true;
    }
    if (changed) edits.push({ relPath: c.relPath, before: c.doc.body, after: body });
  }

  // 2. Rewrite the MOVED doc's OWN outbound RELATIVE links for its new location (absolute left as-is).
  const moved = bundle.concepts.get(fromId);
  if (moved) {
    let body = moved.doc.body;
    let changed = false;
    for (const link of extractLinks(body)) {
      if (link.isAbsolute) continue;
      const tgt = resolveTarget(link.target, moved.relPath);
      if (tgt === null) continue;
      const newRel = relLink(fileTo, conceptIdToRelPath(tgt));
      if (newRel !== link.target) {
        body = body.split(`](${link.target})`).join(`](${newRel})`);
        changed = true;
      }
    }
    if (changed) edits.push({ relPath: fileFrom, before: moved.doc.body, after: body });
  }

  return { fromId, toId, fileFrom, fileTo, edits };
}

export async function runMove(root: string, fromId: string, toId: string, opts: { dryRun?: boolean } = {}): Promise<MovePlan> {
  const bundle = await loadBundle(root);
  if (!bundle.concepts.has(fromId)) throw new Error(`Concept not found: ${fromId}`);
  const plan = planMove(bundle, fromId, toId);
  const absFrom = path.join(root, plan.fileFrom);
  const absTo = path.join(root, plan.fileTo);

  let targetExists = false;
  try { await fs.access(absTo); targetExists = true; } catch { targetExists = false; }
  if (targetExists) throw new Error(`Target already exists: ${plan.fileTo}`);
  if (opts.dryRun) return plan;

  // Apply inbound edits to OTHER docs (skip the moved doc's self-edit).
  for (const edit of plan.edits) {
    if (edit.relPath === plan.fileFrom) continue;
    const abs = path.join(root, edit.relPath);
    const text = await fs.readFile(abs, 'utf8');
    await fs.writeFile(abs, text.replace(edit.before, edit.after), 'utf8');
  }

  // Write the moved doc at its new path (applying its self-edit if any), then remove the old file.
  const selfEdit = plan.edits.find((e) => e.relPath === plan.fileFrom);
  let content = await fs.readFile(absFrom, 'utf8');
  if (selfEdit) content = content.replace(selfEdit.before, selfEdit.after);
  await fs.mkdir(path.dirname(absTo), { recursive: true });
  await fs.writeFile(absTo, content, 'utf8');
  await fs.rm(absFrom);
  return plan;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd toolkit && npx vitest run tests/move.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add toolkit/src/commands/move.ts toolkit/tests/move.test.ts
git commit -m "feat(okf): move command rewrites inbound relative links"
```

---

### Task 10: log command — prepend dated entries

**Files:**
- Create: `toolkit/src/commands/log.ts`
- Test: `toolkit/tests/log.test.ts`

**Interfaces:**
- Produces:
  - `function prependLogEntry(existing: string | null, dateISO: string, kind: string, message: string): string`
  - `async function runLog(root: string, scope: string, kind: string, message: string, dateISO?: string): Promise<string>` (returns relPath of the log.md)

- [ ] **Step 1: Write the failing test `toolkit/tests/log.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { prependLogEntry } from '../src/commands/log';

describe('prependLogEntry', () => {
  it('creates a fresh log with an ISO date heading', () => {
    const out = prependLogEntry(null, '2026-06-22', 'Creation', 'Added orders.');
    expect(out).toContain('## 2026-06-22');
    expect(out).toContain('* **Creation**: Added orders.');
  });

  it('prepends a new entry under an existing same-day heading, newest content first', () => {
    const existing = '# Update Log\n\n## 2026-06-22\n* **Creation**: first.\n';
    const out = prependLogEntry(existing, '2026-06-22', 'Update', 'second.');
    const firstIdx = out.indexOf('second.');
    const secondIdx = out.indexOf('first.');
    expect(firstIdx).toBeGreaterThan(-1);
    expect(firstIdx).toBeLessThan(secondIdx);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd toolkit && npx vitest run tests/log.test.ts`
Expected: FAIL (module missing).

- [ ] **Step 3: Write `toolkit/src/commands/log.ts`**

```ts
import { promises as fs } from 'node:fs';
import path from 'node:path';

const HEADER = '# Update Log';

export function prependLogEntry(existing: string | null, dateISO: string, kind: string, message: string): string {
  const entry = `* **${kind}**: ${message}`;
  const heading = `## ${dateISO}`;
  if (!existing || existing.trim() === '') {
    return `${HEADER}\n\n${heading}\n${entry}\n`;
  }
  const lines = existing.replace(/\n+$/, '').split('\n');
  const idx = lines.findIndex((l) => l.trim() === heading);
  if (idx === -1) {
    // Insert a new date section right after the header (newest date first).
    const headerIdx = lines.findIndex((l) => l.trim() === HEADER);
    const at = headerIdx === -1 ? 0 : headerIdx + 1;
    lines.splice(at, 0, '', heading, entry);
  } else {
    lines.splice(idx + 1, 0, entry);
  }
  return lines.join('\n') + '\n';
}

export async function runLog(root: string, scope: string, kind: string, message: string, dateISO?: string): Promise<string> {
  const date = dateISO ?? new Date().toISOString().slice(0, 10);
  const rel = scope === '.' || scope === '' ? 'log.md' : path.posix.join(scope, 'log.md');
  const abs = path.join(root, rel);
  let existing: string | null = null;
  try { existing = await fs.readFile(abs, 'utf8'); } catch { existing = null; }
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, prependLogEntry(existing, date, kind, message), 'utf8');
  return rel;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd toolkit && npx vitest run tests/log.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add toolkit/src/commands/log.ts toolkit/tests/log.test.ts
git commit -m "feat(okf): log command prepends dated entries"
```

---

### Task 11: search + backlinks commands

**Files:**
- Create: `toolkit/src/commands/search.ts`
- Test: `toolkit/tests/search.test.ts`

**Interfaces:**
- Consumes: `BundleModel` (Task 4), `buildGraph` (Task 5).
- Produces:
  - `interface SearchResult { id: string; title: string; description: string; type: string }`
  - `interface SearchFilters { type?: string; tag?: string; text?: string }`
  - `function runSearch(bundle: BundleModel, filters: SearchFilters): SearchResult[]`
  - `function runBacklinks(bundle: BundleModel, id: string): string[]`

- [ ] **Step 1: Write the failing test `toolkit/tests/search.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { runSearch, runBacklinks } from '../src/commands/search';
import { loadBundle } from '../src/core/bundle';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'sample-wiki');

describe('runSearch', () => {
  it('filters by type', async () => {
    const r = runSearch(await loadBundle(ROOT), { type: 'Reference' });
    expect(r.map(x => x.id)).toContain('references/glossary');
    expect(r.every(x => x.type === 'Reference')).toBe(true);
  });
  it('filters by free text across title/description/body', async () => {
    const r = runSearch(await loadBundle(ROOT), { text: 'one row per order' });
    expect(r.map(x => x.id)).toContain('tables/orders');
  });
});

describe('runBacklinks', () => {
  it('lists concepts linking to a target', async () => {
    const r = runBacklinks(await loadBundle(ROOT), 'tables/customers');
    expect(r).toContain('tables/orders');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd toolkit && npx vitest run tests/search.test.ts`
Expected: FAIL (module missing).

- [ ] **Step 3: Write `toolkit/src/commands/search.ts`**

```ts
import type { BundleModel } from '../core/bundle';
import { buildGraph } from '../core/links';

export interface SearchResult { id: string; title: string; description: string; type: string; }
export interface SearchFilters { type?: string; tag?: string; text?: string; }

export function runSearch(bundle: BundleModel, filters: SearchFilters): SearchResult[] {
  const out: SearchResult[] = [];
  const text = filters.text?.toLowerCase();
  for (const c of bundle.concepts.values()) {
    const fm = c.doc.frontmatter;
    const type = String(fm.type ?? '');
    if (filters.type && type !== filters.type) continue;
    if (filters.tag) {
      const tags = Array.isArray(fm.tags) ? (fm.tags as unknown[]).map(String) : [];
      if (!tags.includes(filters.tag)) continue;
    }
    if (text) {
      const hay = `${fm.title ?? ''}\n${fm.description ?? ''}\n${c.doc.body}`.toLowerCase();
      if (!hay.includes(text)) continue;
    }
    out.push({ id: c.id, title: String(fm.title ?? c.id), description: String(fm.description ?? ''), type });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

export function runBacklinks(bundle: BundleModel, id: string): string[] {
  return (buildGraph(bundle).backlinks.get(id) ?? []).slice().sort();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd toolkit && npx vitest run tests/search.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add toolkit/src/commands/search.ts toolkit/tests/search.test.ts
git commit -m "feat(okf): search + backlinks commands"
```

---

### Task 12: viz command — self-contained HTML graph (shared link resolution)

**Files:**
- Create: `toolkit/src/commands/viz.ts`
- Test: `toolkit/tests/viz.test.ts`

**Interfaces:**
- Consumes: `BundleModel`/`loadBundle` (Task 4), `buildGraph`/`extractLinks`/`resolveTarget` (Task 5).
- Produces:
  - `interface VizNode { id: string; label: string; type: string; description: string; resource: string; tags: string[]; color: string; body: string; linkMap: Record<string, string | null> }`
  - `function generateViz(bundle: BundleModel, name: string): string` (returns full HTML)
  - `async function runViz(root: string, outPath: string, name: string): Promise<string>` (writes HTML, returns outPath)

The viewer shares resolution by precomputing `linkMap` (rawHref → concept id or null) per node with `resolveTarget`, so the browser never re-derives link targets. This structurally prevents the relative/absolute disagreement found in the reference viewer.

- [ ] **Step 1: Write the failing test `toolkit/tests/viz.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { generateViz } from '../src/commands/viz';
import { loadBundle } from '../src/core/bundle';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'sample-wiki');

describe('generateViz', () => {
  it('embeds a JSON graph with edges from both link forms and a precomputed linkMap', async () => {
    const html = generateViz(await loadBundle(ROOT), 'Sample');
    expect(html).toContain('<title>Sample');
    expect(html).toContain('cytoscape');
    const m = /const BUNDLE = (\{[\s\S]*?\});\n/.exec(html);
    expect(m).toBeTruthy();
    const data = JSON.parse(m![1]);
    // glossary -> orders edge comes from an ABSOLUTE link; must be present
    expect(data.edges.some((e: any) => e.source === 'references/glossary' && e.target === 'tables/orders')).toBe(true);
    // linkMap resolves the absolute href to the concept id
    const glossary = data.nodes.find((n: any) => n.id === 'references/glossary');
    expect(glossary.linkMap['/tables/orders.md']).toBe('tables/orders');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd toolkit && npx vitest run tests/viz.test.ts`
Expected: FAIL (module missing).

- [ ] **Step 3: Write `toolkit/src/commands/viz.ts`**

```ts
import { promises as fs } from 'node:fs';
import type { BundleModel } from '../core/bundle';
import { buildGraph, extractLinks, resolveTarget } from '../core/links';

export interface VizNode {
  id: string; label: string; type: string; description: string;
  resource: string; tags: string[]; color: string; body: string;
  linkMap: Record<string, string | null>;
}

const PALETTE: Record<string, string> = {
  'BigQuery Dataset': '#8b5cf6',
  'BigQuery Table': '#3b82f6',
  'Reference': '#10b981',
};

function colorFor(type: string): string { return PALETTE[type] ?? '#94a3b8'; }

export function generateViz(bundle: BundleModel, name: string): string {
  const graph = buildGraph(bundle);
  const nodes: VizNode[] = [];
  for (const c of bundle.concepts.values()) {
    const fm = c.doc.frontmatter;
    const linkMap: Record<string, string | null> = {};
    for (const l of extractLinks(c.doc.body)) {
      const to = resolveTarget(l.target, c.relPath);
      linkMap[l.target] = to && bundle.concepts.has(to) ? to : null;
    }
    nodes.push({
      id: c.id,
      label: String(fm.title ?? c.id),
      type: String(fm.type ?? 'Other'),
      description: String(fm.description ?? ''),
      resource: String(fm.resource ?? ''),
      tags: Array.isArray(fm.tags) ? (fm.tags as unknown[]).map(String) : [],
      color: colorFor(String(fm.type ?? 'Other')),
      body: c.doc.body,
      linkMap,
    });
  }
  const edges = graph.edges.map((e) => ({ source: e.from, target: e.to }));
  const data = JSON.stringify({ name, nodes, edges });
  return HTML.replace('__NAME__', escapeHtml(name)).replace('__BUNDLE__', data);
}

export async function runViz(root: string, outPath: string, name: string): Promise<string> {
  const { loadBundle } = await import('../core/bundle');
  await fs.writeFile(outPath, generateViz(await loadBundle(root), name), 'utf8');
  return outPath;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
}

const HTML = `<!doctype html><html><head><meta charset="utf-8"><title>__NAME__ — OKF</title>
<script src="https://cdn.jsdelivr.net/npm/cytoscape@3.28.1/dist/cytoscape.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/marked@12.0.0/marked.min.js"></script>
<style>body{margin:0;font-family:system-ui;display:flex;height:100vh}#cy{flex:2;height:100%}#panel{flex:1;padding:1rem;overflow:auto;border-left:1px solid #ddd}a{cursor:pointer}</style>
</head><body>
<div id="cy"></div><div id="panel"><em>Click a node.</em></div>
<script>
const BUNDLE = __BUNDLE__;
const byId = Object.fromEntries(BUNDLE.nodes.map(n => [n.id, n]));
const cy = cytoscape({
  container: document.getElementById('cy'),
  elements: [
    ...BUNDLE.nodes.map(n => ({ data: { id: n.id, label: n.label, color: n.color } })),
    ...BUNDLE.edges.map(e => ({ data: { id: e.source + '__' + e.target, source: e.source, target: e.target } })),
  ],
  style: [
    { selector: 'node', style: { 'background-color': 'data(color)', label: 'data(label)', 'font-size': 8 } },
    { selector: 'edge', style: { 'width': 1, 'line-color': '#ccc', 'target-arrow-shape': 'triangle', 'target-arrow-color': '#ccc', 'curve-style': 'bezier' } },
  ],
  layout: { name: 'cose' },
});
function show(id) {
  const n = byId[id]; if (!n) return;
  const p = document.getElementById('panel');
  p.innerHTML = '<h2>' + n.label + '</h2><p><code>' + n.id + '</code> · ' + n.type + '</p>' +
    (n.resource ? '<p><a href="' + n.resource + '" target="_blank" rel="noopener">resource</a></p>' : '') +
    '<div id="body"></div>';
  const body = document.getElementById('body');
  body.innerHTML = marked.parse(n.body);
  body.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href');
    const target = n.linkMap[href];
    if (target) { a.onclick = (e) => { e.preventDefault(); show(target); }; }
    else { a.target = '_blank'; a.rel = 'noopener'; }
  });
}
cy.on('tap', 'node', (e) => show(e.target.id()));
</script></body></html>`;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd toolkit && npx vitest run tests/viz.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add toolkit/src/commands/viz.ts toolkit/tests/viz.test.ts
git commit -m "feat(okf): viz command with shared link resolution"
```

---

### Task 13: CLI wiring + rebuild bundle + end-to-end integration

**Files:**
- Modify: `toolkit/src/cli.ts` (replace the stub with full dispatch)
- Test: `toolkit/tests/cli_e2e.test.ts`

**Interfaces:**
- Consumes: every command function (Tasks 6–12).
- Produces: `main(argv)` dispatching `validate | index | new | move | search | backlinks | log | viz`, honoring `--bundle`/`--json`, exit `1` when `validate` finds errors.

- [ ] **Step 1: Write the failing test `toolkit/tests/cli_e2e.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { main } from '../src/cli';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'sample-wiki');

function capture() {
  const logs: string[] = [];
  const orig = console.log;
  console.log = (...a: unknown[]) => { logs.push(a.join(' ')); };
  return { logs, restore: () => { console.log = orig; } };
}

describe('cli e2e', () => {
  it('validate exits 1 on the fixture (it has errors) and prints findings', async () => {
    const c = capture();
    try {
      const code = await main(['validate', '--bundle', ROOT]);
      expect(code).toBe(1);
      expect(c.logs.join('\n')).toMatch(/E-TYPE-MISSING/);
    } finally { c.restore(); }
  });

  it('search --json prints a JSON array', async () => {
    const c = capture();
    try {
      const code = await main(['search', '--bundle', ROOT, '--type', 'Reference', '--json']);
      expect(code).toBe(0);
      const parsed = JSON.parse(c.logs.join('\n'));
      expect(parsed.some((r: any) => r.id === 'references/glossary')).toBe(true);
    } finally { c.restore(); }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd toolkit && npx vitest run tests/cli_e2e.test.ts`
Expected: FAIL (stub `main` returns usage error).

- [ ] **Step 3: Replace `toolkit/src/cli.ts` with full dispatch**

```ts
import { loadBundle } from './core/bundle';
import { runValidate, formatFindings } from './commands/validate';
import { writeIndexes, checkIndexes } from './commands/index';
import { runNew } from './commands/new';
import { runMove } from './commands/move';
import { runSearch, runBacklinks } from './commands/search';
import { runLog } from './commands/log';
import { runViz } from './commands/viz';

function flag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}
function has(argv: string[], name: string): boolean { return argv.includes(name); }
function bundleRoot(argv: string[]): string {
  return flag(argv, '--bundle') ?? process.env.OKF_BUNDLE ?? process.cwd();
}

export async function main(argv: string[]): Promise<number> {
  if (argv.includes('--version') || argv[0] === 'version') { console.log('okf 0.1.0'); return 0; }
  const cmd = argv[0];
  const rest = argv.slice(1);
  const root = bundleRoot(rest);

  switch (cmd) {
    case 'validate': {
      const findings = await runValidate(await loadBundle(root));
      const errs = findings.filter(f => f.level === 'error').length;
      console.log(has(rest, '--json') ? JSON.stringify(findings) : formatFindings(findings));
      return errs > 0 || (has(rest, '--strict') && findings.length > 0) ? 1 : 0;
    }
    case 'index': {
      const bundle = await loadBundle(root);
      if (has(rest, '--check')) {
        const drift = await checkIndexes(bundle);
        console.log(drift.length ? `Out-of-date indexes:\n${drift.join('\n')}` : 'Indexes up to date.');
        return drift.length ? 1 : 0;
      }
      const changed = await writeIndexes(bundle);
      console.log(`Wrote ${changed.length} index file(s).`);
      return 0;
    }
    case 'new': {
      const tags = flag(rest, '--tags');
      const rel = await runNew(root, {
        type: flag(rest, '--type') ?? 'Reference',
        id: flag(rest, '--id') ?? '',
        title: flag(rest, '--title'),
        description: flag(rest, '--description'),
        resource: flag(rest, '--resource'),
        tags: tags ? tags.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        force: has(rest, '--force'),
      });
      console.log(`Created ${rel}`);
      return 0;
    }
    case 'move': {
      const plan = await runMove(root, flag(rest, '--from') ?? '', flag(rest, '--to') ?? '', { dryRun: has(rest, '--dry-run') });
      console.log(`${has(rest, '--dry-run') ? '[dry-run] ' : ''}moved ${plan.fromId} -> ${plan.toId}; ${plan.edits.length} doc(s) relinked.`);
      return 0;
    }
    case 'search': {
      const results = runSearch(await loadBundle(root), { type: flag(rest, '--type'), tag: flag(rest, '--tag'), text: flag(rest, '--text') });
      console.log(has(rest, '--json') ? JSON.stringify(results) : results.map(r => `${r.id}  [${r.type}]  ${r.description}`).join('\n'));
      return 0;
    }
    case 'backlinks': {
      const id = rest.find(a => !a.startsWith('--') && a !== flag(rest, '--bundle')) ?? '';
      const r = runBacklinks(await loadBundle(root), id);
      console.log(has(rest, '--json') ? JSON.stringify(r) : r.join('\n'));
      return 0;
    }
    case 'log': {
      const rel = await runLog(root, flag(rest, '--scope') ?? '.', flag(rest, '--kind') ?? 'Update', flag(rest, '--message') ?? '');
      console.log(`Logged to ${rel}`);
      return 0;
    }
    case 'viz': {
      const out = flag(rest, '--out') ?? `${root.replace(/\/$/, '')}/viz.html`;
      await runViz(root, out, flag(rest, '--name') ?? 'OKF Wiki');
      console.log(`Wrote ${out}`);
      return 0;
    }
    default:
      console.error('usage: okf <validate|index|new|move|search|backlinks|log|viz> [--bundle <path>] [options]');
      return 1;
  }
}
```

(No auto-run line here — `src/main.ts` from Task 1 remains the entry point and already invokes `main`. `cli.ts` stays import-safe.)

- [ ] **Step 4: Run test to verify it passes**

Run: `cd toolkit && npx vitest run tests/cli_e2e.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the FULL suite + typecheck + rebuild the bundle**

Run: `cd toolkit && npx vitest run && npm run typecheck && npm run build`
Expected: all tests PASS, no type errors, `dist/okf.mjs` regenerated.

- [ ] **Step 6: Verify zero-install end-to-end**

Run: `cd toolkit && node dist/okf.mjs validate --bundle tests/fixtures/sample-wiki; echo "exit=$?"`
Expected: prints findings including `E-TYPE-MISSING`; `exit=1`.

- [ ] **Step 7: Commit**

```bash
git add toolkit/src/cli.ts toolkit/tests/cli_e2e.test.ts toolkit/dist/okf.mjs
git commit -m "feat(okf): wire CLI dispatch + e2e + rebuild bundle"
```

---

### Task 14: SKILL.md + reference docs + manual end-to-end

**Files:**
- Create: `SKILL.md`
- Create: `references/OKF-PROFILE.md`
- Create: `references/okf-spec-quickref.md`
- Create: `README.md` (one-paragraph install/use note)

**Interfaces:**
- Consumes: the built `dist/okf.mjs` (Task 13).
- Produces: a discoverable skill that drives the toolkit.

- [ ] **Step 1: Create `SKILL.md`**

```markdown
---
name: okf-wiki
description: Manage an Open Knowledge Format (OKF) wiki — author concepts, validate conformance, regenerate indexes, fix and track cross-links, search, and visualize. Use when the user wants to create, edit, lint, reorganize, search, or visualize a markdown+YAML-frontmatter OKF knowledge bundle.
---

# Managing an OKF wiki

This skill manages a knowledge wiki stored in the Open Knowledge Format (a tree of
markdown files with YAML frontmatter). Deterministic mechanics live in the bundled
`okf` CLI; YOU own the prose (what a concept says).

## Setup

The CLI is at `<skill-dir>/toolkit/dist/okf.mjs` and runs on Node ≥ 20 with no
install. Run every command as:

    node <skill-dir>/toolkit/dist/okf.mjs <command> --bundle <wiki-path> [options]

Resolve `<wiki-path>` from the user (ask once if unknown; honor `$OKF_BUNDLE`).
Commands: `validate · index · new · move · search · backlinks · log · viz`.

## Profile

Read `references/OKF-PROFILE.md` for the conformance stance and
`references/okf-spec-quickref.md` for the format rules. Key points: `type` is the
only hard-error field; missing `title`/`description`/`timestamp` and broken links
are warnings; author RELATIVE cross-links to REAL concepts.

## Playbooks

### Author a concept
1. `okf search --type "<type>" --json` to see neighbors + naming.
2. `okf new --type "<type>" --id <dir>/<slug> --title "<t>" --description "<d>" [--resource <uri>] [--tags a,b]`.
3. Open the created file and WRITE THE BODY: structural markdown, conventional
   headings, relative links to real concepts, a `# Citations` section.
4. `okf validate --bundle <p>` (resolve any errors).
5. `okf index --bundle <p>` to refresh listings.
6. Optionally `okf log --scope <dir> --kind Creation --message "Added <slug>."`.
7. Show the user the new file + the validate summary.

### Health check
- `okf validate --bundle <p> --json`; summarize errors vs warnings; propose fixes;
  apply only after the user agrees.

### Refactor (rename/move)
- `okf move --from <id> --to <id> --dry-run` → show impact → run without
  `--dry-run` → `okf validate`.

### Find / explore
- `okf search [--type T] [--tag G] [--text Q]`; `okf backlinks <id>`.

### Visualize
- `okf viz --bundle <p>`; report the output path.

## Discipline rules
- Run `okf validate` AND `okf index` after any authoring or structural change.
- Never delete or overwrite a concept without showing the user first.
- Broken links are warnings, not blockers (OKF is permissive).
- Prefer relative links; keep frontmatter rich.
- After ANY change to `toolkit/src/`, run `cd toolkit && npm run build` to refresh
  `dist/okf.mjs`, then re-run `npm run test`.
```

- [ ] **Step 2: Create `references/OKF-PROFILE.md`**

```markdown
# OKF profile (this skill's stance)

OKF v0.1's spec and its reference code disagree in places. This skill takes an
explicit, documented stance.

| Topic | Spec says | Reference code does | This skill |
|---|---|---|---|
| Required frontmatter | only `type` | type+title+description+timestamp | `type` is the only ERROR; the others are WARNINGS. `new` scaffolds all four. |
| Cross-link form | absolute `/` recommended | relative only | Author RELATIVE (renders on GitHub). Reader resolves BOTH. Absolute usage → `W-LINK-ABSOLUTE`. |
| Broken links | consumers MUST tolerate | n/a | WARNING (`W-LINK-BROKEN`), never an error. |
| Indexes | optional, no frontmatter (root may carry okf_version) | generated, no frontmatter | Missing/stale → WARNING. Frontmatter in a non-root index → ERROR. |

**Rule:** ERRORS are reserved for the spec's §9 MUST-rules; everything else is a
WARNING. Error codes: `E-FRONTMATTER-PARSE`, `E-TYPE-MISSING`, `E-INDEX-FRONTMATTER`,
`E-LOG-DATE`. Warning codes: `W-FIELD-MISSING`, `W-TIMESTAMP-FORMAT`, `W-LINK-BROKEN`,
`W-ORPHAN`, `W-INDEX-MISSING`, `W-LINK-ABSOLUTE`.
```

- [ ] **Step 3: Create `references/okf-spec-quickref.md`**

```markdown
# OKF spec quick reference

- **Bundle**: a directory tree of markdown files. **Concept**: one non-reserved
  `.md` file. **Concept ID**: file path minus `.md`.
- **Reserved files**: `index.md` (directory listing, no frontmatter except a
  root-level `okf_version`), `log.md` (date-grouped `## YYYY-MM-DD` entries,
  newest first).
- **Frontmatter** (`---` delimited YAML): `type` (required), then recommended
  `title`, `description`, `resource`, `tags`, `timestamp` (ISO 8601). Extra keys
  allowed.
- **Body**: structural markdown. Conventional headings: `# Schema`, `# Examples`,
  `# Citations`.
- **Cross-links**: markdown links to `.md` targets. Absolute `/a/b.md` =
  bundle-root-relative; relative `../a/b.md` = resolved from the source dir. This
  skill authors relative links.
- **Citations**: numbered `[1] [Title](URL)` under `# Citations`.
- **Conformance**: parseable frontmatter + non-empty `type` + valid reserved
  files. Everything else is soft guidance; tolerate unknown types, extra keys,
  broken links, missing indexes.
```

- [ ] **Step 4: Create `README.md`**

```markdown
# okf-wiki

A portable Claude Code skill to manage an Open Knowledge Format wiki. The `okf`
CLI (TypeScript, bundled to `toolkit/dist/okf.mjs`) provides
`validate · index · new · move · search · backlinks · log · viz`; `SKILL.md`
orchestrates it. Runtime: Node ≥ 20, no install. Dev: `cd toolkit && npm install
&& npm test && npm run build`.
```

- [ ] **Step 5: Manual end-to-end on a scratch wiki**

Run:
```bash
SKILL_DIR="$PWD"
TMP=$(mktemp -d)
node toolkit/dist/okf.mjs new --bundle "$TMP" --type "Reference" --id references/hello --title "Hello" --description "A test."
node toolkit/dist/okf.mjs index --bundle "$TMP"
node toolkit/dist/okf.mjs validate --bundle "$TMP"; echo "validate exit=$?"
node toolkit/dist/okf.mjs viz --bundle "$TMP" --out "$TMP/viz.html" && ls -la "$TMP/viz.html"
```
Expected: concept created; index written; `validate exit=0` (a single conformant
concept — note it will warn `W-ORPHAN`, which is fine); `viz.html` produced.

- [ ] **Step 6: Commit**

```bash
git add SKILL.md references README.md
git commit -m "feat(okf): SKILL.md, profile + spec quickref, README"
```

---

## Self-Review

**Spec coverage** (every spec section maps to a task):
- §1 division of labor → SKILL.md (T14) + all command tasks.
- §3 profile (errors/warnings) → T7 validate; documented in T14 OKF-PROFILE.md.
- §5.3 core modules → T2 document, T3 paths, T4 bundle, T5 links.
- §5.4 commands → T6 index, T7 validate, T8 new, T9 move, T10 log, T11 search/backlinks, T12 viz, T13 CLI.
- §5.5 every error/warning code → exercised by T7 tests (E-TYPE-MISSING, E-LOG-DATE, E-INDEX-FRONTMATTER, W-FIELD-MISSING, W-LINK-BROKEN, W-ORPHAN, W-LINK-ABSOLUTE, W-INDEX-MISSING) + T2 (E-FRONTMATTER-PARSE via bundle.parseErrors, W-TIMESTAMP-FORMAT).
- §5.6 templates → T8.
- §9 testing → every task is TDD; fixture in T4/T7.
- §10 distribution/build → T1 pipeline + T13 rebuild; staleness mitigation via tests-on-source and the SKILL.md rebuild rule (T14).
- §11 layout / §12 risks → realized by the file paths throughout.

**Placeholder scan:** no TBD/TODO; every code step shows complete code; every run step shows the command + expected result.

**Type consistency:** `Finding`/`OKFDocument` (T2) reused in T7/T8/T12; `BundleModel` (T4) consumed by T5/T6/T7/T9/T11/T12; `buildGraph`/`resolveTarget`/`extractLinks` (T5) reused by T7/T9/T12; `expectedIndexes` (T6) reused by T7; command function names match their CLI call sites in T13.

**Note on `E-FRONTMATTER-PARSE`:** surfaced in `runValidate` (T7) from `bundle.parseErrors` (T4). The fixture's docs all parse; an explicit parse-failure fixture can be added if desired, but the path is covered by the bundle loader's try/catch and the validate mapping.

**Note on `W-INDEX-STALE`:** the spec's stale-index concern is delivered as the `okf index --check` drift detector (`checkIndexes`, T6 + T13), which exits 1 when any index is missing or out of date — rather than as a `validate` warning. `validate` emits `W-INDEX-MISSING` only, keeping conformance (validate) and drift (index --check) as separate concerns.

**Note on move self-links:** `planMove` (T9) rewrites BOTH the inbound links in other docs AND the moved doc's own outbound relative links (absolute links left as-is), per spec §5.4. Both are covered by the T9 test.
