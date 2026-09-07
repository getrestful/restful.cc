# CLAUDE.md

Guidance for Claude Code when working in this repo.

## Content data

Repeated content blocks (initiatives, team, advisory community) live as JSON
in `src/_data/`, not inline in templates. Eleventy exposes each file as a
global template variable named after the file (`src/_data/team.json` →
`team`). When adding a new repeated content block, or a new item to an
existing one, prefer adding/editing a file in `src/_data/` over hardcoding an
array inside a `.njk` template — it keeps content edits out of the markup and
makes the data reusable across templates.

## Git workflow

Commit and push directly to `main`. This repo does not use feature branches
or PRs for routine changes — after making a change, commit it and push to
`origin main` right away.
