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

Content that differs per language lives in `src/_i18n/<lang>/` instead
(`de`, `fr`, `en`). The German file is the source; the French and English
files have the same structure with translated text. `src/_data/eleventyComputed.js`
picks the right file per page, so templates still use `team`, `faq` etc.
Non-translated data (site settings, literature, logos, navigator) stays in
`src/_data/`.

## Languages

German is served at `/`, French at `/fr/`, English at `/en/`. Pages are
paginated over `langs`; `src/_i18n/routes.json` maps each German path to its
French and English path.

- Wrap fixed template text in `{{ "Deutscher Text" | t }}` (add `| safe` for
  text with `<i>`). Translations live in `src/_i18n/<lang>/strings.json`, keyed
  by the German text. A suffix like `"E-Mail|im Satz"` separates identical
  German text that needs a different translation.
- Wrap internal links in `{{ '/pfad/' | l }}` so they point to the current
  language.
- Import macros `with context` so `t` and `l` know the page language.
- The build lists missing translations (`[i18n] … fehlende Übersetzungen`).
  When changing German text, update `fr` and `en` in the same change.

## Git workflow

Commit and push directly to `main`. This repo does not use feature branches
or PRs for routine changes — after making a change, commit it and push to
`origin main` right away.
