import yaml from 'js-yaml';

export interface OKFDocument {
  frontmatter: Record<string, unknown>;
  body: string;
}

export interface Finding {
  level: 'error' | 'warning';
  code: string;
  message: string;
}

export class OKFDocumentError extends Error {}

const DELIM = '---';
const ISO = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;

export function parseDocument(text: string): OKFDocument {
  const lines = text.split('\n');
  if (lines.length === 0 || lines[0].trim() !== DELIM) {
    return { frontmatter: {}, body: text };
  }
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === DELIM) { end = i; break; }
  }
  if (end === -1) throw new OKFDocumentError('Unterminated YAML frontmatter block');

  let fm: unknown;
  try {
    fm = yaml.load(lines.slice(1, end).join('\n'), { schema: yaml.JSON_SCHEMA }) ?? {};
  } catch (e) {
    throw new OKFDocumentError(`Invalid YAML in frontmatter: ${(e as Error).message}`);
  }
  if (typeof fm !== 'object' || fm === null || Array.isArray(fm)) {
    throw new OKFDocumentError('Frontmatter must be a YAML mapping');
  }

  let body = lines.slice(end + 1).join('\n');
  if (body.startsWith('\n')) body = body.slice(1);
  return { frontmatter: fm as Record<string, unknown>, body };
}

export function serializeDocument(doc: OKFDocument): string {
  const fmText = yaml.dump(doc.frontmatter, { sortKeys: false, lineWidth: -1 }).trimEnd();
  const body = doc.body.endsWith('\n') ? doc.body : doc.body + '\n';
  return `${DELIM}\n${fmText}\n${DELIM}\n\n${body}`;
}

export function validateConcept(doc: OKFDocument): Finding[] {
  const out: Finding[] = [];
  const fm = doc.frontmatter;
  const type = fm['type'];
  if (typeof type !== 'string' || type.trim() === '') {
    out.push({ level: 'error', code: 'E-TYPE-MISSING', message: 'Missing or empty required field: type' });
  }
  for (const key of ['title', 'description', 'timestamp']) {
    const v = fm[key];
    const empty = v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
    if (empty) out.push({ level: 'warning', code: 'W-FIELD-MISSING', message: `Missing recommended field: ${key}` });
  }
  const ts = fm['timestamp'];
  if (typeof ts === 'string' && ts.trim() !== '' && !ISO.test(ts.trim())) {
    out.push({ level: 'warning', code: 'W-TIMESTAMP-FORMAT', message: `timestamp is not valid ISO 8601: ${ts}` });
  }
  return out;
}
