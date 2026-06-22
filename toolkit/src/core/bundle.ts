import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parseDocument, OKFDocument } from './document';
import { relPathToConceptId } from './paths';

export interface ConceptEntry {
  id: string;
  relPath: string;
  absPath: string;
  doc: OKFDocument;
}

export interface ParseError {
  relPath: string;
  message: string;
}

export interface BundleModel {
  root: string;
  concepts: Map<string, ConceptEntry>;
  indexFiles: string[];
  logFiles: string[];
  dirs: string[];
  parseErrors: ParseError[];
}

const SKIP_DIRS = new Set(['.git', 'node_modules']);

function toPosix(p: string): string {
  return p.split(path.sep).join('/');
}

async function collectDirs(dir: string, acc: string[]): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory() && !SKIP_DIRS.has(e.name)) {
      const abs = path.join(dir, e.name);
      acc.push(abs);
      await collectDirs(abs, acc);
    }
  }
}

export async function loadBundle(root: string): Promise<BundleModel> {
  root = path.resolve(root);
  const concepts = new Map<string, ConceptEntry>();
  const indexFiles: string[] = [];
  const logFiles: string[] = [];
  const parseErrors: ParseError[] = [];

  const subDirs: string[] = [];
  await collectDirs(root, subDirs);
  const allDirs = [root, ...subDirs];
  const dirs = allDirs.map((d) => toPosix(path.relative(root, d))).sort();

  for (const d of allDirs) {
    const entries = await fs.readdir(d, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isFile() || !e.name.endsWith('.md')) continue;
      const abs = path.join(d, e.name);
      const relPath = toPosix(path.relative(root, abs));
      if (e.name === 'index.md') { indexFiles.push(relPath); continue; }
      if (e.name === 'log.md') { logFiles.push(relPath); continue; }
      const text = await fs.readFile(abs, 'utf8');
      try {
        const doc = parseDocument(text);
        const id = relPathToConceptId(relPath);
        concepts.set(id, { id, relPath, absPath: abs, doc });
      } catch (err) {
        parseErrors.push({ relPath, message: (err as Error).message });
      }
    }
  }

  return { root, concepts, indexFiles, logFiles, dirs, parseErrors };
}
