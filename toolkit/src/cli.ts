import { loadBundle } from './core/bundle';
import { runValidate, formatFindings } from './commands/validate';
import { writeIndexes, checkIndexes } from './commands/index';
import { runNew } from './commands/new';
import { runMove } from './commands/move';
import { runSearch, runBacklinks } from './commands/search';
import { runLog } from './commands/log';
import { runViz } from './commands/viz';

function flag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}
function has(argv: string[], name: string): boolean { return argv.includes(name); }
function bundleRoot(argv: string[]): string {
  return flag(argv, '--bundle') ?? process.env.OKF_BUNDLE ?? process.cwd();
}

export async function main(argv: string[]): Promise<number> {
  if (argv.includes('--version') || argv[0] === 'version') { console.log('okf 0.1.0'); return 0; }
  const cmd = argv[0];
  const rest = argv.slice(1);
  const root = bundleRoot(rest);

  switch (cmd) {
    case 'validate': {
      const findings = await runValidate(await loadBundle(root));
      const errs = findings.filter(f => f.level === 'error').length;
      console.log(has(rest, '--json') ? JSON.stringify(findings) : formatFindings(findings));
      return errs > 0 || (has(rest, '--strict') && findings.length > 0) ? 1 : 0;
    }
    case 'index': {
      const bundle = await loadBundle(root);
      if (has(rest, '--check')) {
        const drift = await checkIndexes(bundle);
        console.log(drift.length ? `Out-of-date indexes:\n${drift.join('\n')}` : 'Indexes up to date.');
        return drift.length ? 1 : 0;
      }
      const changed = await writeIndexes(bundle);
      console.log(`Wrote ${changed.length} index file(s).`);
      return 0;
    }
    case 'new': {
      const tags = flag(rest, '--tags');
      const rel = await runNew(root, {
        type: flag(rest, '--type') ?? 'Reference',
        id: flag(rest, '--id') ?? '',
        title: flag(rest, '--title'),
        description: flag(rest, '--description'),
        resource: flag(rest, '--resource'),
        tags: tags ? tags.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        force: has(rest, '--force'),
      });
      console.log(`Created ${rel}`);
      return 0;
    }
    case 'move': {
      const plan = await runMove(root, flag(rest, '--from') ?? '', flag(rest, '--to') ?? '', { dryRun: has(rest, '--dry-run') });
      console.log(`${has(rest, '--dry-run') ? '[dry-run] ' : ''}moved ${plan.fromId} -> ${plan.toId}; ${plan.edits.length} doc(s) relinked.`);
      return 0;
    }
    case 'search': {
      const results = runSearch(await loadBundle(root), { type: flag(rest, '--type'), tag: flag(rest, '--tag'), text: flag(rest, '--text') });
      console.log(has(rest, '--json') ? JSON.stringify(results) : results.map(r => `${r.id}  [${r.type}]  ${r.description}`).join('\n'));
      return 0;
    }
    case 'backlinks': {
      const id = rest.find(a => !a.startsWith('--') && a !== flag(rest, '--bundle')) ?? '';
      const r = runBacklinks(await loadBundle(root), id);
      console.log(has(rest, '--json') ? JSON.stringify(r) : r.join('\n'));
      return 0;
    }
    case 'log': {
      const rel = await runLog(root, flag(rest, '--scope') ?? '.', flag(rest, '--kind') ?? 'Update', flag(rest, '--message') ?? '');
      console.log(`Logged to ${rel}`);
      return 0;
    }
    case 'viz': {
      const out = flag(rest, '--out') ?? `${root.replace(/\/$/, '')}/viz.html`;
      await runViz(root, out, flag(rest, '--name') ?? 'OKF Wiki');
      console.log(`Wrote ${out}`);
      return 0;
    }
    default:
      console.error('usage: okf <validate|index|new|move|search|backlinks|log|viz> [--bundle <path>] [options]');
      return 1;
  }
}
