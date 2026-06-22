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
