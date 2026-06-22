import { describe, it, expect } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { scaffold, runNew } from '../src/commands/new';
import { parseDocument } from '../src/core/document';

describe('scaffold', () => {
  it('produces conformant frontmatter and a type-appropriate body', () => {
    const doc = scaffold({ type: 'Reference', id: 'references/x', title: 'X', description: 'D', now: '2026-06-22T00:00:00Z' });
    expect(doc.frontmatter.type).toBe('Reference');
    expect(doc.frontmatter.timestamp).toBe('2026-06-22T00:00:00Z');
    expect(doc.body).toContain('# Definition');
    expect(doc.body).toContain('# Citations');
  });

  it('uses # Schema for table-like types', () => {
    const doc = scaffold({ type: 'BigQuery Table', id: 'tables/y', now: '2026-06-22T00:00:00Z' });
    expect(doc.body).toContain('# Schema');
  });
});

describe('runNew', () => {
  it('writes a file and refuses to overwrite without force', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'okf-'));
    const rel = await runNew(dir, { type: 'Reference', id: 'references/x', title: 'X', description: 'D', now: '2026-06-22T00:00:00Z' });
    expect(rel).toBe('references/x.md');
    const written = parseDocument(await fs.readFile(path.join(dir, rel), 'utf8'));
    expect(written.frontmatter.title).toBe('X');
    await expect(runNew(dir, { type: 'Reference', id: 'references/x', now: '2026-06-22T00:00:00Z' })).rejects.toThrow();
  });
});
