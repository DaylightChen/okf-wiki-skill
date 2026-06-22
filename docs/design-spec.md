# Design Spec — `okf-wiki` skill

**Date:** 2026-06-22
**Status:** Draft for review
**Author:** Claude (brainstormed with user)

---

## 1. Summary

`okf-wiki` is a portable Claude Code skill that manages a knowledge wiki stored in
the **Open Knowledge Format (OKF)** — a directory of markdown files with YAML
frontmatter. The skill helps author concepts, validate conformance, keep indexes
and links healthy, refactor safely, search, and visualize — all while *strictly
following OKF*.

It has two parts:

1. **`SKILL.md`** — the orchestration brain. It tells Claude when the skill
   applies, how to drive the toolkit, and where Claude's own judgment (writing
   concept prose) is required.
2. **A bundled `okf` CLI toolkit** (TypeScript / Node) — does all the
   deterministic OKF mechanics: parse/serialize, conformance validation, link
   graph, index regeneration, scaffolding, safe move/rename, search, and
   visualization.

**Core principle — division of labor:**

- **Code owns truth & mechanics.** "Is this conformant?", "what links to X?",
  "regenerate indexes", "render the graph" — deterministic, tested, repeatable.
- **Claude owns judgment & prose.** What a concept should say, how to structure
  its body, whether to mint a reference, how to summarize wiki health. Claude
  never hand-rolls validation or backlink math.

This split is what makes "strictly following OKF" a *checkable, tested* guarantee
rather than a hope.

---

## 2. Scope

### In scope

- Steady-state lifecycle management of an **already-OKF**, greenfield wiki.
- Authoring concept documents (scaffold skeleton + Claude-authored prose).
- Two-tier conformance + link linting.
- Index (`index.md`) regeneration for progressive disclosure.
- Change logging (`log.md`).
- Safe concept rename/move with inbound-link rewriting.
- Search by type/tag/text, and backlinks.
- Self-contained interactive HTML visualization of the bundle graph.

### Out of scope (YAGNI)

- **Migration / ingestion** from non-OKF formats. The wiki is OKF from day one.
- **LLM-based directory-description synthesis** (the reference implementation's
  Gemini call). The toolkit uses deterministic descriptions; Claude may improve
  them on request via the skill, but the toolkit has no model dependency.
- **Source enrichment** (BigQuery introspection, web crawling) — that is the
  `reference_agent` producer's job, not this skill's.
- **Multi-bundle linking** across separate wikis.

---

## 3. Background: OKF and the conformance profile

OKF (v0.1 draft) represents knowledge as a directory tree of markdown files.
Each non-reserved `.md` file is a **concept**; its **concept ID** is its path
minus `.md`. Two reserved filenames have defined meaning at any level: `index.md`
(directory listing) and `log.md` (change history). A concept has YAML frontmatter
(`---` delimited) plus a markdown body. Concepts cross-link via ordinary markdown
links, forming a graph.

Research into the OKF spec and its reference implementation surfaced real
contradictions that this skill must take a clear stance on. The skill therefore
ships an explicit **OKF profile** (`references/OKF-PROFILE.md`) documenting these
decisions:

| Topic | Spec (SPEC.md) says | Reference code does | **This skill's profile** |
|---|---|---|---|
| Required frontmatter | Only `type` | All of `type,title,description,timestamp` | `type` is the only **hard error**; the other three are **warnings** when missing. Authoring scaffolds all four. |
| Cross-link form | Absolute `/`-rooted is *recommended* | Relative only (for GitHub rendering); viewer is inconsistent | **Relative** links are the authoring default (render on GitHub). The reader resolves **both** absolute and relative forms so nothing silently drops. |
| Broken links | Consumers MUST tolerate | n/a | **Warning**, never an error (permissive consumption). |
| Index files | Optional, no frontmatter (except root `okf_version`) | Generated without frontmatter | Missing/stale index → **warning**. Frontmatter in a non-root index → **error**. |

The profile's guiding rule: **errors are reserved for the spec's actual §9
MUST-rules; everything else is a warning.** This keeps the linter honest and the
wiki usable as it grows and is partially agent-generated.

---

## 4. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ User: "add a concept about X" / "is my wiki healthy?" / ...  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                  ┌─────────▼─────────┐
                  │     SKILL.md      │   Claude reads intent, writes PROSE,
                  │  (orchestration)  │   and drives the toolkit for mechanics.
                  └─────────┬─────────┘
                            │ runs:  node <skill>/toolkit/dist/okf.mjs <cmd> --bundle <path>
                  ┌─────────▼─────────┐
                  │   okf CLI (TS)    │
                  │  ┌─────────────┐  │   core/: document, paths, bundle, links
                  │  │    core     │  │   commands/: validate, index, new, move,
                  │  ├─────────────┤  │              search, backlinks, log, viz
                  │  │  commands   │  │
                  │  └─────────────┘  │
                  └─────────┬─────────┘
                            │ reads/writes
                  ┌─────────▼─────────┐
                  │  The OKF bundle   │   (the user's wiki folder — anywhere)
                  └───────────────────┘
```

**Portability.** The skill directory is self-contained. Every command takes
`--bundle <path>` (default: `$OKF_BUNDLE`, else cwd). The toolkit is bundled to a
single `dist/okf.mjs`, so the only runtime requirement is **Node ≥ 20** — no
`npm install`, no Google/ADK/BigQuery dependencies. The wiki itself lives wherever
the user keeps it; the skill is pointed at it.

---

## 5. The toolkit (`okf` CLI)

### 5.1 Tech stack

- **Language:** TypeScript, compiled/bundled with **esbuild** to `dist/okf.mjs`
  (ESM, `--platform=node`, `--target=node20`, deps inlined).
- **Runtime dep (inlined into the bundle):** `js-yaml` only (frontmatter
  parse/dump, preserving key insertion order). The `viz` command emits HTML that
  embeds concept bodies as strings; markdown rendering and graph layout happen
  **in-browser** via CDN-loaded `marked` + `cytoscape`, so the Node side needs no
  markdown/graph library.
- **Dev deps:** `typescript`, `esbuild`, `vitest`.
- **Distribution:** the bundled `dist/okf.mjs` is committed (zero-install). Tests
  run against the TypeScript **source**, and `npm run build` regenerates the
  bundle. SKILL.md mandates a rebuild after any toolkit change. (See §10 for the
  staleness mitigation.)

### 5.2 Layout

```
toolkit/
├── package.json            # scripts: build, test, typecheck
├── tsconfig.json
├── vitest.config.ts
├── src/
│   ├── cli.ts              # argparse-style dispatch: subcommands, --bundle, --json
│   ├── core/
│   │   ├── document.ts     # OKFDocument: parse / serialize / validate (findings, not throws)
│   │   ├── paths.ts        # conceptId <-> path; segment + reserved-name rules
│   │   ├── bundle.ts       # walk tree -> in-memory model; tolerant of bad files
│   │   └── links.ts        # parse + resolve cross-links (relative AND absolute) -> graph
│   ├── commands/
│   │   ├── validate.ts  index.ts  new.ts  move.ts
│   │   ├── search.ts    backlinks.ts  log.ts  viz.ts
│   │   └── templates.ts   # type -> conventional body skeleton registry
│   └── viz_assets/
│       ├── viz.html.ts     # template (string module)
│       ├── viz.js.ts       # in-browser app (shares link-resolution rules with links.ts)
│       └── viz.css.ts
├── dist/
│   └── okf.mjs             # committed bundle (zero-install entrypoint)
└── tests/
    ├── fixtures/sample-wiki/   # crafted bundle exercising every rule
    └── *.test.ts
```

### 5.3 Core modules

- **`document.ts`** — Parses a file into `{ frontmatter: object, body: string }`.
  Frontmatter is the YAML between a leading `---` line and the next `---` line;
  everything after is the body. Serialization dumps YAML with insertion-order keys
  preserved, then `---\n{yaml}---\n\n{body}`. `validate(doc)` returns a list of
  findings (`{level: 'error'|'warning', code, message}`), it does **not** throw —
  so the linter can aggregate across the whole bundle.

- **`paths.ts`** — Converts a concept ID (`tables/users`) to a relative file path
  (`tables/users.md`) and back. Validates ID segments against
  `[A-Za-z0-9_][A-Za-z0-9_.\-]*`. Knows the reserved filenames `index.md` and
  `log.md`.

- **`bundle.ts`** — Walks the bundle directory, reads every `.md`, classifies
  reserved vs concept files, parses each, and returns a model:
  `{ concepts: Map<id, {frontmatter, body, path}>, indexes, logs, parseErrors }`.
  A single unparseable file is recorded in `parseErrors` and never aborts the run.

- **`links.ts`** — The shared link engine used by `validate`, `move`, `viz`,
  `search`/`backlinks`. Extracts markdown `.md` links from a body (with optional
  `#fragment`). Resolves a raw target to a concept ID:
  - absolute (`/a/b.md`) → bundle-root-relative → `a/b`;
  - relative (`../a/b.md`, `b.md`) → resolved against the source concept's
    directory, made bundle-relative → id; `null` if it escapes the bundle root.

  Builds the directed graph, backlinks, broken links (target id not present), and
  orphans (no inbound and no outbound). Because it resolves **both** link forms,
  the graph is correct regardless of which form a doc uses — closing the bug found
  in the reference viewer.

### 5.4 Commands

All commands accept `--bundle <path>`; read-oriented commands accept `--json` for
Claude to parse.

| Command | Signature (essentials) | Behavior | Exit |
|---|---|---|---|
| `validate` | `okf validate [--json] [--strict]` | Two-tier lint over the whole bundle (see §5.5). `--strict` treats warnings as errors. | `1` if any error (or warning under `--strict`), else `0` |
| `index` | `okf index [--check]` | Regenerate every directory's `index.md`: no frontmatter, entries grouped by `type`, `* [title](relative-link) - description` from frontmatter; deterministic subdirectory descriptions (comma-list of child titles, truncated). Idempotent. `--check` writes nothing and exits `1` if any index would change (drift detection). | `0` / `1` (`--check`) |
| `new` | `okf new --type T --id ID [--title ..] [--description ..] [--resource ..] [--tags a,b]` | Write a conformant skeleton with the conventional body headings for `T` (see §5.6). Refuses to overwrite unless `--force`. Prints the path; Claude then fills the prose. | `0` / `1` if exists |
| `move` | `okf move --from ID --to ID [--dry-run]` | Move the concept file to the new ID, rewrite all inbound relative links bundle-wide, and recompute the moved doc's own relative links. Refuses to clobber an existing target. `--dry-run` prints the change set without writing. | `0` / `1` |
| `search` | `okf search [--type T] [--tag G] [--text Q] [--json]` | List concepts matching any provided filter (frontmatter + body for `--text`): id, title, description. | `0` |
| `backlinks` | `okf backlinks ID [--json]` | List concepts that link to `ID` (reverse graph). | `0` |
| `log` | `okf log --scope DIR --kind KIND --message MSG` | Prepend a dated entry (`## YYYY-MM-DD`, newest-first) under the scope's `log.md`, creating the file if needed. `KIND` is the bold lead word (`Update`/`Creation`/`Deprecation`/...). | `0` |
| `viz` | `okf viz [--out FILE] [--name NAME]` | Render a self-contained interactive HTML graph (Cytoscape + marked via CDN). Edges and in-body link rewiring both use `links.ts`, so relative and absolute links behave identically. Default output `<bundle>/viz.html`. | `0` |

### 5.5 The conformance profile (validate rules)

**Errors (block; exit 1) — spec §9 MUST-rules:**

- `E-FRONTMATTER-PARSE` — a non-reserved `.md` has an unterminated or unparseable
  YAML frontmatter block, or frontmatter that is not a mapping.
- `E-TYPE-MISSING` — a concept's frontmatter has no non-empty `type`.
- `E-INDEX-FRONTMATTER` — a non-root `index.md` contains a frontmatter block
  (only the bundle-root `index.md` may, and only for bundle-level declaration).
- `E-LOG-DATE` — a `log.md` date heading is not ISO `YYYY-MM-DD`.

**Warnings (report; exit 0):**

- `W-FIELD-MISSING` — missing recommended field `title`, `description`, or
  `timestamp`.
- `W-TIMESTAMP-FORMAT` — `timestamp` present but not valid ISO 8601.
- `W-LINK-BROKEN` — a cross-link target resolves to a concept ID not in the bundle.
- `W-ORPHAN` — a concept has no inbound and no outbound links.
- `W-INDEX-MISSING` — a non-empty directory has no `index.md`.
- `W-INDEX-STALE` — an `index.md` differs from what `okf index` would generate.
- `W-LINK-ABSOLUTE` — a cross-link uses the absolute `/`-form (profile prefers
  relative for GitHub rendering). Clearly labeled as a *profile preference*, not a
  spec violation.

### 5.6 Concept templates (`new` scaffolding)

A small, overridable registry maps `type` → conventional body skeleton. Defaults:

- **`Reference`** → `# Definition` + `# Citations`.
- **type containing `Table`** → `# Schema` + `# Citations`.
- **`Playbook`** → `# Trigger` + `# Steps` + `# Citations`.
- **anything else (default)** → a short prose placeholder + `# Citations`.

Every skeleton's frontmatter includes `type`, `title`, `description`, and a
`timestamp` stamped at creation, plus `resource`/`tags` when supplied.

---

## 6. The skill (`SKILL.md`)

`SKILL.md` is concise and workflow-oriented. Frontmatter `name: okf-wiki` and a
`description` that triggers on managing/authoring/validating/visualizing an OKF
wiki. It provides Claude with playbooks:

- **Author** ("add a concept about X"): find the right folder/type via
  `okf search` → `okf new` skeleton → **Claude writes the body** (structural
  markdown, conventional headings, relative links to *real* concepts, citations) →
  `okf validate` → `okf index` → optional `okf log` → show the user the result.
- **Health check** ("is my wiki conformant / healthy?"): `okf validate --json` →
  Claude summarizes errors vs warnings, proposes fixes, and applies them on
  approval.
- **Refactor** ("rename/move Y"): `okf move --dry-run` → show impact →
  `okf move` → `okf validate`.
- **Find / explore**: `okf search` / `okf backlinks`.
- **Visualize**: `okf viz` → report the output path.

**Discipline rules (always):**

- Re-run `okf validate` and `okf index` after any authoring or structural change.
- Never delete or overwrite a concept without showing the user first.
- Treat broken links as warnings, not blockers (OKF is permissive).
- Prefer relative links; keep frontmatter rich.
- After any change to the toolkit source, run `npm run build` to refresh
  `dist/okf.mjs`.

**Bundled references:**

- `references/OKF-PROFILE.md` — the conformance/conventions stance (§3 table,
  expanded), including the deliberate divergences from spec and reference code.
- `references/okf-spec-quickref.md` — a distilled §-rule cheat-sheet so Claude
  authors correctly without re-reading the full spec.

---

## 7. Data flow — example: "add a concept about the orders table"

1. Skill activates. Claude runs `okf search --type "Table" --json` to see
   neighbors and naming conventions.
2. Claude runs `okf new --type "Table" --id tables/orders --title "Orders"
   --description "One row per completed order." --resource <uri> --tags sales,orders`.
   The toolkit writes a conformant skeleton (`# Schema`, `# Citations`).
3. Claude reads neighboring concepts, then **writes the body prose**: the schema
   table, joins, example queries, relative cross-links (`[customers](customers.md)`),
   and citations.
4. Claude runs `okf validate` (expect clean) and `okf index` (refresh listings).
5. Optionally `okf log --scope tables --kind Creation --message "Added orders."`.
6. Claude shows the user the new file and the validate summary.

The toolkit is the single source of truth for "is this OKF-correct"; Claude never
hand-rolls that judgment.

---

## 8. Error handling

- **Toolkit:** per-file parse failures are localized and reported, never abort a
  run. `validate` separates errors (exit 1) from warnings (exit 0). `move` is
  `--dry-run`-able and refuses to clobber an existing target. `index` and `viz`
  are idempotent regenerations. Every command validates `--bundle` exists and is a
  directory before acting.
- **Skill:** Claude runs `validate` after every mutation, surfaces anything
  destructive to the user before acting, and follows the permissive consumption
  model (broken links inform, they do not block).

---

## 9. Testing strategy (TDD)

A **vitest** suite runs against the TypeScript source. A crafted fixture bundle
(`tests/fixtures/sample-wiki/`) intentionally exercises every rule: a fully
conformant doc; a doc missing `type` (error); a doc missing `description`
(warning); a doc with a `timestamp` in the wrong format; a broken link; an orphan;
a doc using an absolute link; a doc using a relative link; nested subdirectories;
a malformed `log.md` date; a non-root `index.md` carrying frontmatter (error).

Coverage:

- `document` parse/serialize round-trip (key order + body preserved).
- `paths` conceptId ↔ path and segment validation.
- `links` resolution for relative, absolute, and out-of-bundle/broken targets;
  graph, backlinks, orphans.
- `validate` — each error and warning code fires exactly when expected.
- `index` regeneration output and `--check` drift detection.
- `new` skeleton conformance per type-template.
- `move` inbound-link rewrite and clobber refusal.
- `search` / `backlinks` filtering.
- `viz` smoke: produces HTML embedding the bundle JSON; edges built from both link
  forms; in-body rewiring matches both forms.

**Definition of "strictly follows OKF": a green suite, not a claim.**

---

## 10. Distribution & build

- `npm run build` → esbuild bundles `src/cli.ts` + inlined deps → `dist/okf.mjs`.
- The skill invokes `node <skill-dir>/toolkit/dist/okf.mjs <cmd> ...`.
- **Staleness mitigation** (avoiding the very trap found in OKF's stale `viz.html`):
  tests run against `src/` so correctness is verified pre-build; `npm run build`
  is an explicit dev-time step; SKILL.md mandates a rebuild after any toolkit edit;
  and `okf --version` reports a build hash so drift is detectable. The committed
  bundle is treated as a build artifact, regenerated, never hand-edited.

---

## 11. Full skill layout

```
~/.claude/skills/okf-wiki/
├── SKILL.md
├── references/
│   ├── OKF-PROFILE.md
│   └── okf-spec-quickref.md
├── toolkit/
│   ├── package.json  tsconfig.json  vitest.config.ts
│   ├── src/ … (core/, commands/, viz_assets/, cli.ts)
│   ├── dist/okf.mjs             # committed zero-install bundle
│   └── tests/ …
└── docs/superpowers/specs/2026-06-22-okf-wiki-skill-design.md   # this spec
```

**Naming & home:** skill `okf-wiki`, CLI `okf`, home `~/.claude/skills/okf-wiki/`
(personal skill, discoverable by Claude Code). The wiki bundle stays wherever the
user keeps it.

---

## 12. Risks & open questions

- **Bundled-artifact staleness** — mitigated per §10 (tests on source, explicit
  rebuild, build-hash in `--version`).
- **TS reimplementation divergence** from the Python reference semantics —
  mitigated by the test suite and `okf-spec-quickref.md`; we already chose the
  standalone path, so no 1:1 mirror was on the table regardless.
- **`viz` CDN dependency** — Cytoscape/marked load from CDN, so *viewing* needs
  internet (generation does not). Matches the reference viewer; vendoring offline
  is a possible future enhancement, deliberately deferred.
- **YAML round-trip fidelity** — `js-yaml` preserves object key insertion order
  (JS string-keyed objects are ordered), so frontmatter round-trips cleanly; tests
  guard this.

---

## 13. Implementation milestones (high level)

The detailed plan will be produced by the writing-plans skill. Anticipated order:

1. Toolkit scaffold (`package.json`, `tsconfig`, vitest, esbuild build) +
   `core/document` + tests.
2. `core/paths` + `core/bundle` + `core/links` + tests.
3. `validate` + the conformance profile + tests (the backbone).
4. `index` (+ `--check`) + tests.
5. `new` + templates + tests.
6. `move` + `log` + tests.
7. `search` + `backlinks` + tests.
8. `viz` + slim viewer assets (shared `links` core) + smoke tests.
9. CLI wiring + `dist/okf.mjs` bundle + zero-install verification.
10. `SKILL.md` + `references/` + an end-to-end dry run on a fixture wiki.
