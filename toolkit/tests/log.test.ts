import { describe, it, expect } from 'vitest';
import { prependLogEntry } from '../src/commands/log';

describe('prependLogEntry', () => {
  it('creates a fresh log with an ISO date heading', () => {
    const out = prependLogEntry(null, '2026-06-22', 'Creation', 'Added orders.');
    expect(out).toContain('## 2026-06-22');
    expect(out).toContain('* **Creation**: Added orders.');
  });

  it('prepends a new entry under an existing same-day heading, newest content first', () => {
    const existing = '# Update Log\n\n## 2026-06-22\n* **Creation**: first.\n';
    const out = prependLogEntry(existing, '2026-06-22', 'Update', 'second.');
    const firstIdx = out.indexOf('second.');
    const secondIdx = out.indexOf('first.');
    expect(firstIdx).toBeGreaterThan(-1);
    expect(firstIdx).toBeLessThan(secondIdx);
  });
});
