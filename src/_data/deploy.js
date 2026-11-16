// Wo dieser Build ausgeliefert wird.
// Vercel (Produktion): www.restful.cc, für Suchmaschinen freigegeben.
// Sonst (GitHub Pages, Vorschauen): Adresse aus der CNAME-Datei, für Suchmaschinen gesperrt.
// Vorschaubild und og:url zeigen auf die jeweilige Adresse, damit Link-Vorschauen überall funktionieren.
import { readFileSync } from "node:fs";

const production = process.env.VERCEL_ENV === "production";
const host = production ? "www.restful.cc" : readFileSync(new URL("../public/CNAME", import.meta.url), "utf8").trim();

export default { url: `https://${host}`, production };
