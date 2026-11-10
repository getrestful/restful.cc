import { readFileSync, readdirSync, existsSync } from "node:fs";

// Sprachen der Website. Deutsch ist die Ausgangssprache und liegt ohne Präfix unter /.
const LANGS = ["de", "fr", "en"];
const I18N = "src/_i18n";

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

// Übersetzte Inhalte: src/_i18n/<sprache>/<name>.json. Fehlt eine Datei, gilt die deutsche.
function loadContent() {
  const content = {};
  const names = readdirSync(`${I18N}/de`).filter((f) => f.endsWith(".json") && f !== "strings.json");
  for (const lang of LANGS) {
    content[lang] = {};
    for (const file of names) {
      const own = `${I18N}/${lang}/${file}`;
      content[lang][file.replace(/\.json$/, "")] = readJson(existsSync(own) ? own : `${I18N}/de/${file}`);
    }
  }
  return content;
}

// UI-Texte: deutscher Originaltext als Schlüssel, Übersetzung als Wert.
function loadStrings() {
  const strings = {};
  for (const lang of LANGS) {
    const file = `${I18N}/${lang}/strings.json`;
    strings[lang] = lang !== "de" && existsSync(file) ? readJson(file) : {};
  }
  return strings;
}

// Pfade der Seiten pro Sprache. Die Zielgruppenseiten kommen aus den Inhaltsdaten dazu.
function loadRoutes(content) {
  const routes = readJson(`${I18N}/routes.json`);
  content.de.zielgruppen.forEach((zg, i) => {
    routes[`/fuer/${zg.key}/`] = Object.fromEntries(
      LANGS.filter((l) => l !== "de").map((l) => [l, `${routes["/fuer/"][l]}${content[l].zielgruppen[i].slug}/`])
    );
  });
  return routes;
}

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/public": "/" });
  eleventyConfig.addWatchTarget(I18N);

  const content = loadContent();
  const strings = loadStrings();
  const routes = loadRoutes(content);
  const missing = new Set();

  eleventyConfig.addGlobalData("langs", LANGS);
  eleventyConfig.addGlobalData("i18n", content);
  // Zielgruppenseiten: eine Seite pro Sprache und Zielgruppe
  eleventyConfig.addGlobalData("zgPages", LANGS.flatMap((lang) => content[lang].zielgruppen.map((zg) => ({ lang, zg }))));

  const currentLang = (ctx) => ctx?.locale || "de";

  // Übersetzt einen deutschen Text in die Sprache der Seite. Platzhalter {name} werden ersetzt.
  eleventyConfig.addFilter("t", function (text, vars) {
    const lang = currentLang(this.ctx);
    let out = text;
    if (lang !== "de" && typeof text === "string" && text) {
      if (text in strings[lang]) out = strings[lang][text];
      else missing.add(`${lang}: ${text}`);
    }
    if (vars && typeof out === "string") out = out.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
    return out;
  });

  // Wandelt einen deutschen Pfad (mit optionalem #Anker) in den Pfad der gewünschten Sprache um.
  function localize(path, lang) {
    if (lang === "de" || typeof path !== "string" || !path.startsWith("/")) return path;
    const [base, hash] = path.split("#");
    let target = routes[base]?.[lang];
    if (!target) {
      const prefix = Object.keys(routes).filter((k) => k !== "/" && base.startsWith(k)).sort((a, b) => b.length - a.length)[0];
      target = prefix ? routes[prefix][lang] + base.slice(prefix.length) : `/${lang}${base}`;
    }
    return hash === undefined ? target : `${target}#${hash}`;
  }
  eleventyConfig.addFilter("l", function (path, lang) {
    return localize(path, lang || currentLang(this.ctx));
  });

  // Französische Typografie: schmales geschütztes Leerzeichen vor ; : ! ? und innerhalb von « »
  eleventyConfig.addTransform("fr-typo", function (html) {
    if (!this.page.outputPath?.endsWith(".html") || !this.page.url?.startsWith("/fr/")) return html;
    const nb = " ";
    return html.replace(/(<(script|style)[\s\S]*?<\/\2>)|(<[^>]+>)|([^<]+)/g, (m, block, _tag, tag, text) => {
      if (block || tag) return m;
      return text
        .replace(/[  ]*([;:!?])(?=\s|$|<|&|\)|»)/g, `${nb}$1`)
        .replace(/«[  ]*/g, `«${nb}`)
        .replace(/[  ]*»/g, `${nb}»`);
    });
  });

  // Fehlende Übersetzungen nach dem Build melden
  eleventyConfig.on("eleventy.after", () => {
    if (missing.size) console.warn(`[i18n] ${missing.size} fehlende Übersetzungen:\n  ` + [...missing].sort().join("\n  "));
    missing.clear();
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site",
    },
  };
}
