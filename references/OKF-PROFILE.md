# OKF profile (this skill's stance)

OKF v0.1's spec and its reference code disagree in places. This skill takes an
explicit, documented stance.

| Topic | Spec says | Reference code does | This skill |
|---|---|---|---|
| Required frontmatter | only `type` | type+title+description+timestamp | `type` is the only ERROR; the others are WARNINGS. `new` scaffolds all four. |
| Cross-link form | absolute `/` recommended | relative only | Author RELATIVE (renders on GitHub). Reader resolves BOTH. Absolute usage → `W-LINK-ABSOLUTE`. |
| Broken links | consumers MUST tolerate | n/a | WARNING (`W-LINK-BROKEN`), never an error. |
| Indexes | optional, no frontmatter (root may carry okf_version) | generated, no frontmatter | Missing/stale → WARNING. Frontmatter in a non-root index → ERROR. |

**Rule:** ERRORS are reserved for the spec's §9 MUST-rules; everything else is a
WARNING. Error codes: `E-FRONTMATTER-PARSE`, `E-TYPE-MISSING`, `E-INDEX-FRONTMATTER`,
`E-LOG-DATE`. Warning codes: `W-FIELD-MISSING`, `W-TIMESTAMP-FORMAT`, `W-LINK-BROKEN`,
`W-ORPHAN`, `W-INDEX-MISSING`, `W-INDEX-STALE`, `W-LINK-ABSOLUTE`.
