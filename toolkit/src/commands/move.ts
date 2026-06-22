import { promises as fs } from 'node:fs';
import path from 'node:path';
import { loadBundle, BundleModel } from '../core/bundle';
import { extractLinks, resolveTarget } from '../core/links';
import { conceptIdToRelPath } from '../core/paths';

export interface Edit { relPath: string; before: string; after: string; }
export interface MovePlan { fromId: string; toId: string; fileFrom: string; fileTo: string; edits: Edit[]; }

function relLink(fromRelPath: string, toRelPath: string): string {
  return path.posix.relative(path.posix.dirname(fromRelPath), toRelPath) || path.posix.basename(toRelPath);
}

export function planMove(bundle: BundleModel, fromId: string, toId: string): MovePlan {
  const fileFrom = conceptIdToRelPath(fromId);
  const fileTo = conceptIdToRelPath(toId);
  const edits: Edit[] = [];

  // 1. Rewrite INBOUND links in other docs (target resolves to fromId) -> new relative path.
  for (const c of bundle.concepts.values()) {
    if (c.id === fromId) continue;
    let body = c.doc.body;
    let changed = false;
    for (const link of extractLinks(body)) {
      if (resolveTarget(link.target, c.relPath) !== fromId) continue;
      body = body.split(`](${link.target})`).join(`](${relLink(c.relPath, fileTo)})`);
      changed = true;
    }
    if (changed) edits.push({ relPath: c.relPath, before: c.doc.body, after: body });
  }

  // 2. Rewrite the MOVED doc's OWN outbound RELATIVE links for its new location (absolute left as-is).
  const moved = bundle.concepts.get(fromId);
  if (moved) {
    let body = moved.doc.body;
    let changed = false;
    for (const link of extractLinks(body)) {
      if (link.isAbsolute) continue;
      const tgt = resolveTarget(link.target, moved.relPath);
      if (tgt === null) continue;
      const newRel = relLink(fileTo, conceptIdToRelPath(tgt));
      if (newRel !== link.target) {
        body = body.split(`](${link.target})`).join(`](${newRel})`);
        changed = true;
      }
    }
    if (changed) edits.push({ relPath: fileFrom, before: moved.doc.body, after: body });
  }

  return { fromId, toId, fileFrom, fileTo, edits };
}

function applyBodyEdit(fileText: string, before: string, after: string): string {
  const idx = fileText.lastIndexOf(before);
  if (idx === -1) return fileText;
  return fileText.slice(0, idx) + after + fileText.slice(idx + before.length);
}

export async function runMove(root: string, fromId: string, toId: string, opts: { dryRun?: boolean } = {}): Promise<MovePlan> {
  const bundle = await loadBundle(root);
  if (!bundle.concepts.has(fromId)) throw new Error(`Concept not found: ${fromId}`);
  const plan = planMove(bundle, fromId, toId);
  const absFrom = path.join(root, plan.fileFrom);
  const absTo = path.join(root, plan.fileTo);

  let targetExists = false;
  try { await fs.access(absTo); targetExists = true; } catch { targetExists = false; }
  if (targetExists) throw new Error(`Target already exists: ${plan.fileTo}`);
  if (opts.dryRun) return plan;

  // Apply inbound edits to OTHER docs (skip the moved doc's self-edit).
  for (const edit of plan.edits) {
    if (edit.relPath === plan.fileFrom) continue;
    const abs = path.join(root, edit.relPath);
    const text = await fs.readFile(abs, 'utf8');
    await fs.writeFile(abs, applyBodyEdit(text, edit.before, edit.after), 'utf8');
  }

  // Write the moved doc at its new path (applying its self-edit if any), then remove the old file.
  const selfEdit = plan.edits.find((e) => e.relPath === plan.fileFrom);
  let content = await fs.readFile(absFrom, 'utf8');
  if (selfEdit) content = applyBodyEdit(content, selfEdit.before, selfEdit.after);
  await fs.mkdir(path.dirname(absTo), { recursive: true });
  await fs.writeFile(absTo, content, 'utf8');
  await fs.rm(absFrom);
  return plan;
}
