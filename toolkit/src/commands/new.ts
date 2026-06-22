import { promises as fs } from 'node:fs';
import path from 'node:path';
import { OKFDocument, serializeDocument } from '../core/document';
import { conceptIdToRelPath } from '../core/paths';
import { bodyTemplate } from './templates';

export interface NewOptions {
  type: string;
  id: string;
  title?: string;
  description?: string;
  resource?: string;
  tags?: string[];
  force?: boolean;
  now?: string;
}

export function scaffold(opts: NewOptions): OKFDocument {
  const fm: Record<string, unknown> = { type: opts.type };
  if (opts.resource) fm.resource = opts.resource;
  fm.title = opts.title ?? opts.id.split('/').pop();
  fm.description = opts.description ?? '';
  if (opts.tags && opts.tags.length) fm.tags = opts.tags;
  fm.timestamp = opts.now ?? new Date().toISOString();
  return { frontmatter: fm, body: bodyTemplate(opts.type) };
}

export async function runNew(root: string, opts: NewOptions): Promise<string> {
  const rel = conceptIdToRelPath(opts.id);
  const abs = path.join(root, rel);
  let exists = false;
  try { await fs.access(abs); exists = true; } catch { exists = false; }
  if (exists && !opts.force) throw new Error(`Concept already exists: ${rel} (use --force to overwrite)`);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, serializeDocument(scaffold(opts)), 'utf8');
  return rel;
}
