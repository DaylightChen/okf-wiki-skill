import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import { generateViz } from '../src/commands/viz';
import { loadBundle } from '../src/core/bundle';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'sample-wiki');

describe('generateViz', () => {
  it('embeds a JSON graph with edges from both link forms and a precomputed linkMap', async () => {
    const html = generateViz(await loadBundle(ROOT), 'Sample');
    expect(html).toContain('<title>Sample');
    expect(html).toContain('cytoscape');
    const m = /const BUNDLE = (\{[\s\S]*?\});\n/.exec(html);
    expect(m).toBeTruthy();
    const data = JSON.parse(m![1]);
    // glossary -> orders edge comes from an ABSOLUTE link; must be present
    expect(data.edges.some((e: any) => e.source === 'references/glossary' && e.target === 'tables/orders')).toBe(true);
    // linkMap resolves the absolute href to the concept id
    const glossary = data.nodes.find((n: any) => n.id === 'references/glossary');
    expect(glossary.linkMap['/tables/orders.md']).toBe('tables/orders');
  });

  it('does not corrupt bodies containing $-sequences in the embedded JSON', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'okf-viz-'));
    try {
      await fs.writeFile(
        path.join(dir, 'a.md'),
        '---\ntype: Reference\ntitle: A\ndescription: d\ntimestamp: 2026-01-01T00:00:00Z\n---\n\nCode: `$&` and `$\'` and `$1` and jQuery `$(".x")`.\n',
      );
      const html = generateViz(await loadBundle(dir), 'T');
      const m = /const BUNDLE = (\{[\s\S]*?\});\n/.exec(html);
      expect(m).toBeTruthy();
      const data = JSON.parse(m![1]);
      const node = data.nodes.find((n: any) => n.id === 'a');
      expect(node.body).toContain('$&');
      expect(node.body).toContain("$'");
      expect(node.body).toContain('$1');
      expect(node.body).toContain('$(".x")');
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});
