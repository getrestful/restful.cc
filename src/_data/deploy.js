// Adresse, unter der dieser Build ausgeliefert wird (aus der CNAME-Datei für GitHub Pages).
// Vorschaubild und og:url zeigen darauf, damit Link-Vorschauen auch auf staging funktionieren.
import { readFileSync } from "node:fs";

const host = readFileSync(new URL("../public/CNAME", import.meta.url), "utf8").trim();

export default { url: `https://${host}` };
