# OKF spec quick reference

- **Bundle**: a directory tree of markdown files. **Concept**: one non-reserved
  `.md` file. **Concept ID**: file path minus `.md`.
- **Reserved files**: `index.md` (directory listing, no frontmatter except a
  root-level `okf_version`), `log.md` (date-grouped `## YYYY-MM-DD` entries,
  newest date section first).
- **Frontmatter** (`---` delimited YAML): `type` (required), then recommended
  `title`, `description`, `resource`, `tags`, `timestamp` (ISO 8601). Extra keys
  allowed.
- **Body**: structural markdown. Conventional headings: `# Schema`, `# Examples`,
  `# Citations`.
- **Cross-links**: markdown links to `.md` targets. Absolute `/a/b.md` =
  bundle-root-relative; relative `../a/b.md` = resolved from the source dir. This
  skill authors relative links.
- **Citations**: numbered `[1] [Title](URL)` under `# Citations`.
- **Conformance**: parseable frontmatter + non-empty `type` + valid reserved
  files. Everything else is soft guidance; tolerate unknown types, extra keys,
  broken links, missing indexes.
