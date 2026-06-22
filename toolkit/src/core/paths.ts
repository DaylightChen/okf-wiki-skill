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
