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
    expect(tables).not.toMatch(/^---/m); // no frontmatter
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

  it('lists subdirectory child titles in deterministic sorted order', async () => {
    const root = (await expectedIndexes(await loadBundle(ROOT))).get('index.md')!;
    const line = root.split('\n').find((l) => l.includes('](tables/index.md)'))!;
    expect(line.indexOf('Customers')).toBeLessThan(line.indexOf('Orders'));
    expect(line.indexOf('Orders')).toBeLessThan(line.indexOf('thin'));
  });
});
