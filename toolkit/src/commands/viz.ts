import { promises as fs } from 'node:fs';
import type { BundleModel } from '../core/bundle';
import { buildGraph, extractLinks, resolveTarget } from '../core/links';

export interface VizNode {
  id: string; label: string; type: string; description: string;
  resource: string; tags: string[]; color: string; body: string;
  linkMap: Record<string, string | null>;
}

const PALETTE: Record<string, string> = {
  'BigQuery Dataset': '#8b5cf6',
  'BigQuery Table': '#3b82f6',
  'Reference': '#10b981',
};

function colorFor(type: string): string { return PALETTE[type] ?? '#94a3b8'; }

export function generateViz(bundle: BundleModel, name: string): string {
  const graph = buildGraph(bundle);
  const nodes: VizNode[] = [];
  for (const c of bundle.concepts.values()) {
    const fm = c.doc.frontmatter;
    const linkMap: Record<string, string | null> = {};
    for (const l of extractLinks(c.doc.body)) {
      const to = resolveTarget(l.target, c.relPath);
      linkMap[l.target] = to && bundle.concepts.has(to) ? to : null;
    }
    nodes.push({
      id: c.id,
      label: String(fm.title ?? c.id),
      type: String(fm.type ?? 'Other'),
      description: String(fm.description ?? ''),
      resource: String(fm.resource ?? ''),
      tags: Array.isArray(fm.tags) ? (fm.tags as unknown[]).map(String) : [],
      color: colorFor(String(fm.type ?? 'Other')),
      body: c.doc.body,
      linkMap,
    });
  }
  const edges = graph.edges.map((e) => ({ source: e.from, target: e.to }));
  const data = JSON.stringify({ name, nodes, edges });
  return HTML.replace('__NAME__', () => escapeHtml(name)).replace('__BUNDLE__', () => data);
}

export async function runViz(root: string, outPath: string, name: string): Promise<string> {
  const { loadBundle } = await import('../core/bundle');
  await fs.writeFile(outPath, generateViz(await loadBundle(root), name), 'utf8');
  return outPath;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
}

const HTML = `<!doctype html><html><head><meta charset="utf-8"><title>__NAME__ — OKF</title>
<script src="https://cdn.jsdelivr.net/npm/cytoscape@3.28.1/dist/cytoscape.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/marked@12.0.0/marked.min.js"></script>
<style>body{margin:0;font-family:system-ui;display:flex;height:100vh}#cy{flex:2;height:100%}#panel{flex:1;padding:1rem;overflow:auto;border-left:1px solid #ddd}a{cursor:pointer}</style>
</head><body>
<div id="cy"></div><div id="panel"><em>Click a node.</em></div>
<script>
const BUNDLE = __BUNDLE__;
const byId = Object.fromEntries(BUNDLE.nodes.map(n => [n.id, n]));
const cy = cytoscape({
  container: document.getElementById('cy'),
  elements: [
    ...BUNDLE.nodes.map(n => ({ data: { id: n.id, label: n.label, color: n.color } })),
    ...BUNDLE.edges.map(e => ({ data: { id: e.source + '__' + e.target, source: e.source, target: e.target } })),
  ],
  style: [
    { selector: 'node', style: { 'background-color': 'data(color)', label: 'data(label)', 'font-size': 8 } },
    { selector: 'edge', style: { 'width': 1, 'line-color': '#ccc', 'target-arrow-shape': 'triangle', 'target-arrow-color': '#ccc', 'curve-style': 'bezier' } },
  ],
  layout: { name: 'cose' },
});
function show(id) {
  const n = byId[id]; if (!n) return;
  const p = document.getElementById('panel');
  p.innerHTML = '<h2>' + n.label + '</h2><p><code>' + n.id + '</code> · ' + n.type + '</p>' +
    (n.resource ? '<p><a href="' + n.resource + '" target="_blank" rel="noopener">resource</a></p>' : '') +
    '<div id="body"></div>';
  const body = document.getElementById('body');
  body.innerHTML = marked.parse(n.body);
  body.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href');
    const target = n.linkMap[href];
    if (target) { a.onclick = (e) => { e.preventDefault(); show(target); }; }
    else { a.target = '_blank'; a.rel = 'noopener'; }
  });
}
cy.on('tap', 'node', (e) => show(e.target.id()));
</script></body></html>`;
