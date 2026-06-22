import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { extractLinks, resolveTarget, buildGraph } from '../src/core/links';
import { loadBundle } from '../src/core/bundle';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'sample-wiki');

describe('resolveTarget', () => {
  it('resolves relative links against the source dir', () => {
    expect(resolveTarget('customers.md', 'tables/orders.md')).toBe('tables/customers');
    expect(resolveTarget('../datasets/sales.md', 'tables/orders.md')).toBe('datasets/sales');
  });
  it('resolves absolute (bundle-root) links', () => {
    expect(resolveTarget('/tables/orders.md', 'references/glossary.md')).toBe('tables/orders');
  });
  it('returns null when escaping the bundle', () => {
    expect(resolveTarget('../../etc/passwd.md', 'tables/orders.md')).toBeNull();
  });
});

describe('extractLinks', () => {
  it('extracts .md links and flags absolute', () => {
    const links = extractLinks('a [x](foo.md) b [y](/bar.md#h)');
    expect(links).toEqual([
      { target: 'foo.md', isAbsolute: false },
      { target: '/bar.md', isAbsolute: true },
    ]);
  });

  it('extracts links whose anchor contains dots or unicode (fragment excluded from target)', () => {
    expect(extractLinks('see [a](foo.md#sec.1) and [b](bar.md#数据)')).toEqual([
      { target: 'foo.md', isAbsolute: false },
      { target: 'bar.md', isAbsolute: false },
    ]);
  });
});

describe('buildGraph', () => {
  it('builds edges from both link forms, finds broken + orphans', async () => {
    const g = buildGraph(await loadBundle(ROOT));
    // glossary uses an ABSOLUTE link to orders -> must still produce an edge
    expect(g.edges.some(e => e.from === 'references/glossary' && e.to === 'tables/orders')).toBe(true);
    // orders <-> customers relative links
    expect(g.backlinks.get('tables/customers')).toContain('tables/orders');
    // broken.md -> /tables/missing
    expect(g.broken.some(b => b.from === 'tables/broken')).toBe(true);
    // thin.md has no links in or out
    expect(g.orphans).toContain('tables/thin');
  });
});
