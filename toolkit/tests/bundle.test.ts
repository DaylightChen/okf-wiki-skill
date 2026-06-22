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
