import path from 'node:path';
import type { BundleModel } from './bundle';

const LINK_RE = /\]\(([^)\s]+\.md)(?:#[^)]*)?\)/g;

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
