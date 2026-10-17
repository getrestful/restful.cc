# restful.cc

Website von restful, gebaut mit Eleventy (Nunjucks-Vorlagen, ein Stylesheet, kein Build-Schritt für CSS).

## Entwickeln

```
npm install
npm run dev
```

## Bauen

```
npm run build
```

Das Ergebnis landet in `_site/`. Ein Push auf `main` veröffentlicht die Seite über GitHub Pages.

## Aufbau

- `src/_data/`: Inhalte als JSON (Texte, Team, Partner, Studien, Zielgruppenseiten)
- `src/_includes/`: Layout und Bausteine (`layout.njk`, `macros.njk`, `icon.njk`)
- `src/*.njk`: Seiten, `src/zielgruppe.njk` erzeugt die Seiten unter `/fuer/…`
- `src/public/`: Bilder, Schriften, `css/site.css`, `js/site.js`
