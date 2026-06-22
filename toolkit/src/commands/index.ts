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
        .map((c) => String(c.doc.frontmatter.title ?? path.basename(c.relPath, '.md')))
        .sort();
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
