import { describe, it, expect } from 'vitest';
import { main } from '../src/cli';

describe('cli', () => {
  it('prints version and returns 0 for --version', async () => {
    const logs: string[] = [];
    const orig = console.log;
    console.log = (...a: unknown[]) => { logs.push(a.join(' ')); };
    try {
      const code = await main(['--version']);
      expect(code).toBe(0);
      expect(logs.join('\n')).toMatch(/okf 0\.1\.0/);
    } finally {
      console.log = orig;
    }
  });
});
