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
