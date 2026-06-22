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
  for (const [rel, content] of expected) {
    if (!present.has(rel)) {
      out.push({ level: 'warning', code: 'W-INDEX-MISSING', message: 'Directory has no index.md', where: rel });
      continue;
    }
    const onDisk = await fs.readFile(path.join(bundle.root, rel), 'utf8');
    if (onDisk !== content) {
      out.push({ level: 'warning', code: 'W-INDEX-STALE', message: 'index.md is out of date (run `okf index`)', where: rel });
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
