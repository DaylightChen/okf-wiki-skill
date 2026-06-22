import { describe, it, expect } from 'vitest';
import { parseDocument, serializeDocument, validateConcept, OKFDocumentError } from '../src/core/document';

describe('parseDocument', () => {
  it('splits frontmatter and body', () => {
    const doc = parseDocument('---\ntype: Reference\ntitle: X\n---\n\n# Body\ntext\n');
    expect(doc.frontmatter.type).toBe('Reference');
    expect(doc.frontmatter.title).toBe('X');
    expect(doc.body).toBe('# Body\ntext\n');
  });

  it('treats a file without frontmatter as all-body', () => {
    const doc = parseDocument('no frontmatter here');
    expect(doc.frontmatter).toEqual({});
    expect(doc.body).toBe('no frontmatter here');
  });

  it('throws on unterminated frontmatter', () => {
    expect(() => parseDocument('---\ntype: X\n')).toThrow(OKFDocumentError);
  });

  it('keeps timestamp as a string (JSON_SCHEMA)', () => {
    const doc = parseDocument('---\ntype: X\ntimestamp: 2026-05-28T14:30:00Z\n---\n');
    expect(typeof doc.frontmatter.timestamp).toBe('string');
  });
});

describe('serializeDocument', () => {
  it('round-trips preserving key order', () => {
    const text = '---\ntype: BigQuery Table\ntitle: Orders\ndescription: One row per order.\n---\n\n# Schema\n';
    const out = serializeDocument(parseDocument(text));
    expect(out).toBe(text);
  });
});

describe('validateConcept', () => {
  it('errors on missing type, warns on missing recommended fields', () => {
    const findings = validateConcept(parseDocument('---\ntitle: X\n---\n'));
    expect(findings.some(f => f.code === 'E-TYPE-MISSING' && f.level === 'error')).toBe(true);
    expect(findings.some(f => f.code === 'W-FIELD-MISSING' && f.message.includes('description'))).toBe(true);
  });

  it('warns on non-ISO timestamp', () => {
    const findings = validateConcept(parseDocument('---\ntype: X\ntitle: T\ndescription: D\ntimestamp: last tuesday\n---\n'));
    expect(findings.some(f => f.code === 'W-TIMESTAMP-FORMAT')).toBe(true);
  });
});
