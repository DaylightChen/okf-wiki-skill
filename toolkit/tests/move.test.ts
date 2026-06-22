import { describe, it, expect } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runMove } from '../src/commands/move';

async function makeWiki(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'okf-mv-'));
  await fs.mkdir(path.join(dir, 'tables'), { recursive: true });
  await fs.writeFile(path.join(dir, 'tables', 'orders.md'),
    '---\ntype: T\ntitle: Orders\ndescription: d\ntimestamp: 2026-01-01T00:00:00Z\n---\n\nFK to [customers](customers.md).\n');
  await fs.writeFile(path.join(dir, 'tables', 'customers.md'),
    '---\ntype: T\ntitle: Customers\ndescription: d\ntimestamp: 2026-01-01T00:00:00Z\n---\n\nseen by [orders](orders.md)\n');
  return dir;
}

describe('runMove', () => {
  it('moves the file and rewrites inbound relative links', async () => {
    const dir = await makeWiki();
    const plan = await runMove(dir, 'tables/customers', 'reference/people');
    // file moved
    await expect(fs.access(path.join(dir, 'reference', 'people.md'))).resolves.toBeUndefined();
    // orders.md inbound link rewritten to the new relative path
    const orders = await fs.readFile(path.join(dir, 'tables', 'orders.md'), 'utf8');
    expect(orders).toContain('[customers](../reference/people.md)');
    expect(plan.edits.some(e => e.relPath === 'tables/orders.md')).toBe(true);
    // the moved doc's OWN outbound link is recomputed for its new location
    const people = await fs.readFile(path.join(dir, 'reference', 'people.md'), 'utf8');
    expect(people).toContain('[orders](../tables/orders.md)');
  });

  it('dry-run makes no changes', async () => {
    const dir = await makeWiki();
    await runMove(dir, 'tables/customers', 'reference/people', { dryRun: true });
    await expect(fs.access(path.join(dir, 'reference', 'people.md'))).rejects.toThrow();
  });

  it('rewrites the body link, not an identical-looking frontmatter value', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'okf-mv2-'));
    await fs.mkdir(path.join(dir, 'tables'), { recursive: true });
    await fs.writeFile(path.join(dir, 'tables', 'customers.md'),
      '---\ntype: T\ntitle: Customers\ndescription: d\ntimestamp: 2026-01-01T00:00:00Z\n---\n\nrow per customer\n');
    await fs.writeFile(path.join(dir, 'tables', 'orders.md'),
      '---\ntype: T\ntitle: Orders\ndescription: see [customers](customers.md)\ntimestamp: 2026-01-01T00:00:00Z\n---\n\nFK to [customers](customers.md).\n');
    await runMove(dir, 'tables/customers', 'reference/people');
    const orders = await fs.readFile(path.join(dir, 'tables', 'orders.md'), 'utf8');
    // body link rewritten:
    expect(orders).toContain('FK to [customers](../reference/people.md).');
    // frontmatter description UNCHANGED (still points at the old relative markup):
    expect(orders).toContain('description: see [customers](customers.md)');
  });
});
