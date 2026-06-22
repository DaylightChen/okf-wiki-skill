import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { runValidate } from '../src/commands/validate';
import { loadBundle } from '../src/core/bundle';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'sample-wiki');

describe('runValidate', () => {
  it('flags the spec MUST-rules as errors', async () => {
    const f = await runValidate(await loadBundle(ROOT));
    const codes = (lvl: string) => f.filter(x => x.level === lvl).map(x => x.code);
    expect(codes('error')).toContain('E-TYPE-MISSING');      // no_type.md
    expect(codes('error')).toContain('E-LOG-DATE');          // log.md bad date
    expect(codes('error')).toContain('E-INDEX-FRONTMATTER'); // tables/index.md
    expect(codes('error')).toContain('E-FRONTMATTER-PARSE'); // tables/malformed.md
  });

  it('reports recommended/link issues as warnings, never errors', async () => {
    const f = await runValidate(await loadBundle(ROOT));
    const wcodes = f.filter(x => x.level === 'warning').map(x => x.code);
    expect(wcodes).toContain('W-FIELD-MISSING');  // thin.md
    expect(wcodes).toContain('W-LINK-BROKEN');    // broken.md
    expect(wcodes).toContain('W-ORPHAN');         // thin.md
    expect(wcodes).toContain('W-LINK-ABSOLUTE');  // glossary.md uses /tables/orders.md
    expect(wcodes).toContain('W-INDEX-STALE');   // fixture's tables/index.md content differs from generated
  });
});
