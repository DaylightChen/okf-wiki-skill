import { describe, it, expect } from 'vitest';
import { parseConceptId, conceptIdToRelPath, relPathToConceptId, isReserved } from '../src/core/paths';

describe('paths', () => {
  it('round-trips id and rel path', () => {
    expect(conceptIdToRelPath('tables/users')).toBe('tables/users.md');
    expect(relPathToConceptId('tables/users.md')).toBe('tables/users');
  });
  it('rejects invalid segments', () => {
    expect(() => parseConceptId('tables//x')).not.toThrow(); // empty segments filtered
    expect(() => parseConceptId('tables/.hidden')).toThrow();
    expect(() => parseConceptId('')).toThrow();
  });
  it('knows reserved filenames', () => {
    expect(isReserved('index.md')).toBe(true);
    expect(isReserved('log.md')).toBe(true);
    expect(isReserved('users.md')).toBe(false);
  });
});
