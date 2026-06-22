# okf-wiki

A portable Claude Code skill to manage an Open Knowledge Format wiki. The `okf`
CLI (TypeScript, bundled to `toolkit/dist/okf.mjs`) provides
`validate · index · new · move · search · backlinks · log · viz`; `SKILL.md`
orchestrates it. Runtime: Node ≥ 20, no install. Dev: `cd toolkit && npm install
&& npm test && npm run build`.

## Install

The skill ships as a self-contained bundle on each release — `SKILL.md`,
`references/`, and the zero-install `okf.mjs` CLI, nothing else. Requires only
Node ≥ 20.

Install the latest release into your **user** skills (available in every project):

```sh
mkdir -p ~/.claude/skills
curl -fsSL https://github.com/DaylightChen/okf-wiki-skill/releases/latest/download/okf-wiki-skill.tar.gz \
  | tar -xz -C ~/.claude/skills
```

…or into a single **project** (`.claude/skills/` at the project root):

```sh
mkdir -p .claude/skills
curl -fsSL https://github.com/DaylightChen/okf-wiki-skill/releases/latest/download/okf-wiki-skill.tar.gz \
  | tar -xz -C .claude/skills
```

Pin a specific version by swapping `latest/download` for
`download/v0.1.0`. Either way you end up with a `okf-wiki/` skill directory;
start a new Claude Code session and ask it to create or validate an OKF wiki.
