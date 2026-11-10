// Sprache der Seite und die passenden übersetzten Inhalte.
// Die Sprache kommt aus der Paginierung (lang) oder, bei Zielgruppenseiten, aus zgp.lang.
const loc = (d) => (d.zgp && d.zgp.lang) || d.lang || "de";
const from = (key) => (d) => d.i18n?.[loc(d)]?.[key];

export default {
  locale: loc,
  zg: (d) => d.zgp?.zg,
  advisory: from("advisory"),
  commeliaseite: from("commeliaseite"),
  digitalprojekte: from("digitalprojekte"),
  einstieg: from("einstieg"),
  evidenz: from("evidenz"),
  faq: from("faq"),
  initiatives: from("initiatives"),
  loesungen: from("loesungen"),
  nutzen: from("nutzen"),
  plattform: from("plattform"),
  team: from("team"),
  testimonial: from("testimonial"),
  themenfelder: from("themenfelder"),
  zielgruppen: from("zielgruppen"),
};
