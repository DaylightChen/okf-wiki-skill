---
name: okf-wiki
description: Manage an Open Knowledge Format (OKF) wiki — author concepts, validate conformance, regenerate indexes, fix and track cross-links, search, and visualize. Use when the user wants to create, edit, lint, reorganize, search, or visualize a markdown+YAML-frontmatter OKF knowledge bundle.
---

# Managing an OKF wiki

This skill manages a knowledge wiki stored in the Open Knowledge Format (a tree of
markdown files with YAML frontmatter). Deterministic mechanics live in the bundled
`okf` CLI; YOU own the prose (what a concept says).

## Setup

The CLI is at `<skill-dir>/toolkit/dist/okf.mjs` and runs on Node ≥ 20 with no
install. Run every command as:

    node <skill-dir>/toolkit/dist/okf.mjs <command> --bundle <wiki-path> [options]

Resolve `<wiki-path>` from the user (ask once if unknown; honor `$OKF_BUNDLE`).
Commands: `validate · index · new · move · search · backlinks · log · viz`.

## Profile

Read `references/OKF-PROFILE.md` for the conformance stance and
`references/okf-spec-quickref.md` for the format rules. Key points: `type` is the
only hard-error field; missing `title`/`description`/`timestamp` and broken links
are warnings; author RELATIVE cross-links to REAL concepts.

## Playbooks

In the playbooks below, `okf` is shorthand for `node <skill-dir>/toolkit/dist/okf.mjs`. Always pass `--bundle <wiki-path>` (or set `$OKF_BUNDLE`).

### Author a concept
1. `okf search --type "<type>" --bundle <p> --json` to see neighbors + naming.
2. `okf new --type "<type>" --id <dir>/<slug> --title "<t>" --description "<d>" [--resource <uri>] [--tags a,b]`.
3. Open the created file and WRITE THE BODY: structural markdown, conventional
   headings, relative links to real concepts, a `# Citations` section.
4. `okf validate --bundle <p>` (resolve any errors).
5. `okf index --bundle <p>` to refresh listings.
6. Optionally `okf log --scope <dir> --kind Creation --message "Added <slug>." --bundle <p>`.
7. Show the user the new file + the validate summary.

### Health check
- `okf validate --bundle <p> --json`; summarize errors vs warnings; propose fixes;
  apply only after the user agrees.

### Refactor (rename/move)
- `okf move --from <id> --to <id> --dry-run` → show impact → run without
  `--dry-run` → `okf validate`.

### Find / explore
- `okf search [--type T] [--tag G] [--text Q]`; `okf backlinks <id>`.

### Visualize
- `okf viz --bundle <p>`; report the output path.

## Discipline rules
- Run `okf validate` AND `okf index` after any authoring or structural change.
- Never delete or overwrite a concept without showing the user first.
- Broken links are warnings, not blockers (OKF is permissive).
- Prefer relative links; keep frontmatter rich.
- After ANY change to `toolkit/src/`, run `cd toolkit && npm run build` to refresh
  `dist/okf.mjs`, then re-run `npm run test`.
