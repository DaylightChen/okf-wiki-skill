import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { main } from '../src/cli';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'sample-wiki');

function capture() {
  const logs: string[] = [];
  const orig = console.log;
  console.log = (...a: unknown[]) => { logs.push(a.join(' ')); };
  return { logs, restore: () => { console.log = orig; } };
}

describe('cli e2e', () => {
  it('validate exits 1 on the fixture (it has errors) and prints findings', async () => {
    const c = capture();
    try {
      const code = await main(['validate', '--bundle', ROOT]);
      expect(code).toBe(1);
      expect(c.logs.join('\n')).toMatch(/E-TYPE-MISSING/);
    } finally { c.restore(); }
  });

  it('search --json prints a JSON array', async () => {
    const c = capture();
    try {
      const code = await main(['search', '--bundle', ROOT, '--type', 'Reference', '--json']);
      expect(code).toBe(0);
      const parsed = JSON.parse(c.logs.join('\n'));
      expect(parsed.some((r: any) => r.id === 'references/glossary')).toBe(true);
    } finally { c.restore(); }
  });
});
