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
