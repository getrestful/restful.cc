// restful · Navigator: in vier kurzen Fragen zu passenden Anlaufstellen
(() => {
  const root = document.querySelector('[data-navigator]');
  const dataEl = document.getElementById('wn-data');
  if (!root || !dataEl) return;
  const D = JSON.parse(dataEl.textContent);
  const byKey = list => Object.fromEntries(list.map(x => [x.key, x]));
  const TOPICS = byKey(D.topics), NEEDS = byKey(D.needs), ROLES = byKey(D.roles), GROUPS = byKey(D.groups);
  const groupOf = t => D.groups.find(g => g.topics.includes(t));
  const state = { fuer: null, bereich: null, thema: null, bedarf: null };

  const steps = [...root.querySelectorAll('[data-step]')];
  const bar = root.querySelector('[data-bar]');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tel = p => 'tel:' + p.replace(/\s/g, '');

  // Themen des gewählten Bereichs (höchstens fünf)
  const renderTopics = () => {
    root.querySelector('[data-topics]').innerHTML = GROUPS[state.bereich].topics.map(k =>
      `<button type="button" class="wn-choice" data-topic="${k}" aria-pressed="${k === state.thema}"><b>${esc(TOPICS[k].label)}</b><span>${esc(TOPICS[k].hint)}</span></button>`).join('');
    root.querySelectorAll('[data-topic]').forEach(b => b.addEventListener('click', () => { state.thema = b.dataset.topic; show(4); }));
  };

  // Schritt anzeigen
  const show = (n, focus = true) => {
    steps.forEach(s => s.classList.toggle('on', s.dataset.step === String(n)));
    bar.style.width = (n * 20) + '%';
    const press = (attr, val) => root.querySelectorAll(`[${attr}]`).forEach(b => b.setAttribute('aria-pressed', b.getAttribute(attr) === val));
    press('data-fuer', state.fuer); press('data-group', state.bereich); press('data-need', state.bedarf);
    if (n === 3) renderTopics();
    if (focus) {
      root.querySelector(`[data-step="${n}"] h2`).focus({ preventScroll: true });
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    const q = new URLSearchParams();
    if (n === 5) { q.set('thema', state.thema); q.set('fuer', state.fuer); q.set('bedarf', state.bedarf); }
    history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : ''));
  };

  // Passende Angebote finden und sortieren
  const fits = (o, keys) => o.roles.includes(state.fuer)
    && (o.topics.includes(state.thema) || o.topics.includes('alle'))
    && o.needs.some(n => keys.includes(n));
  const score = (o, keys) => (o.topics.includes(state.thema) ? 3 : 0.5)
    + (keys.includes(o.needs[0]) ? 2 : 1)
    + (o.prio || 0)
    + (o.partner && keys.includes('austausch') && o.topics.includes(state.thema) ? 0.5 : 0);
  const rank = () => {
    const keys = NEEDS[state.bedarf].match;
    let list = D.offers.filter(o => fits(o, keys)).map(o => ({ o, s: score(o, keys) }));
    if (list.length < 4) {
      const seen = new Set(list.map(x => x.o.id)), extra = [];
      (D.related[state.bedarf] || []).forEach(rn => D.offers.forEach(o => {
        const rk = NEEDS[rn].match;
        if (!seen.has(o.id) && fits(o, rk)) { seen.add(o.id); extra.push({ o, s: score(o, rk) - 2.5, related: true }); }
      }));
      list = list.concat(extra.sort((a, b) => b.s - a.s).slice(0, 6 - list.length));
    }
    return list.sort((a, b) => b.s - a.s).slice(0, 9);
  };

  const card = ({ o, related }) => `
    <article class="wn-card">
      <div class="wn-tags"><span class="wn-type">${esc(D.types[o.type] || '')}</span>${o.partner ? '<span class="wn-partner">Partner von restful</span>' : ''}${related ? '<span class="wn-rel">Könnte auch passen</span>' : ''}</div>
      <h3>${esc(o.name)}</h3>
      <p class="wn-org">${esc(o.org)}</p>
      <p class="wn-desc">${esc(o.desc)}</p>
      <p class="wn-formats">${o.formats.map(esc).join(' · ')}</p>
      <div class="wn-cta">
        <a class="btn btn-dark" href="${esc(o.url)}" target="_blank" rel="noopener">${esc(o.action || 'Zum Angebot')} <span aria-hidden="true">↗</span><span class="sr-only"> (öffnet in neuem Fenster)</span></a>
        ${o.phone ? `<a class="wn-tel" href="${tel(o.phone)}">Anrufen: ${esc(o.phone)}</a>` : ''}
      </div>
    </article>`;
  const row = ({ o, related }) => `
    <a class="wn-row" href="${esc(o.url)}" target="_blank" rel="noopener">
      <span class="wn-row-txt"><b>${esc(o.name)}</b><span>${esc(o.org)}${o.phone ? ' · ' + esc(o.phone) : ''}${related ? ' · könnte auch passen' : ''}</span><small>${esc(o.desc)}</small></span>
      <span class="wn-row-go" aria-hidden="true">↗</span><span class="sr-only"> (öffnet in neuem Fenster)</span>
    </a>`;
  const crisisCard = c => `
    <article class="wn-card wn-card-krise">
      <h3>${esc(c.name)}</h3>
      <p class="wn-desc">${esc(c.desc)}</p>
      <div class="wn-cta"><a class="btn btn-dark" href="tel:${esc(c.phone)}">Anrufen: ${esc(c.phone)}</a>${c.url.startsWith('http') ? `<a class="wn-tel" href="${esc(c.url)}" target="_blank" rel="noopener">Chat und Mail ↗</a>` : ''}</div>
    </article>`;

  const result = () => {
    const krise = state.bedarf === 'krise';
    const need = krise ? D.crisisNeed : NEEDS[state.bedarf];
    root.querySelector('[data-summary]').textContent = TOPICS[state.thema].label + ' · ' + ROLES[state.fuer].label.toLowerCase() + ' · ' + need.label;
    root.querySelector('[data-result-title]').innerHTML = need.title;
    const sub = root.querySelector('[data-result-sub]');
    const primary = root.querySelector('[data-primary]');
    const moreWrap = root.querySelector('[data-more-wrap]');
    const crisisBox = root.querySelector('[data-crisis]');
    if (krise) {
      sub.textContent = 'Du musst das nicht allein tragen. Hier erreichst du sofort jemanden, auch nachts und am Wochenende.';
      const extra = D.offers.filter(o => o.needs.includes('krise') && o.roles.includes(state.fuer) && o.topics.includes(state.thema));
      primary.innerHTML = D.crisis.map(crisisCard).join('') + extra.map(o => card({ o })).join('');
      moreWrap.hidden = true; crisisBox.hidden = true;
    } else {
      const list = rank();
      sub.textContent = 'Alle Angebote sind freiwillig. Du entscheidest, was du davon nutzen möchtest, und kannst jederzeit zurück.';
      primary.innerHTML = list.slice(0, 3).map(card).join('');
      root.querySelector('[data-more]').innerHTML = list.slice(3).map(row).join('');
      moreWrap.hidden = list.length <= 3; crisisBox.hidden = false;
    }
  };

  // Bedienung
  root.querySelectorAll('[data-fuer]').forEach(b => b.addEventListener('click', () => { state.fuer = b.dataset.fuer; show(2); }));
  root.querySelectorAll('[data-group]').forEach(b => b.addEventListener('click', () => {
    if (state.bereich !== b.dataset.group) state.thema = null;
    state.bereich = b.dataset.group; show(3);
  }));
  root.querySelectorAll('[data-need]').forEach(b => b.addEventListener('click', () => { state.bedarf = b.dataset.need; result(); show(5); }));
  root.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', () => show(+b.dataset.goto)));
  root.querySelector('[data-restart]').addEventListener('click', () => {
    state.fuer = state.bereich = state.thema = state.bedarf = null;
    show(1);
  });

  // Direkter Einstieg, z.B. /navigator/?thema=krebs&fuer=angehoerige&bedarf=austausch
  const q = new URLSearchParams(location.search);
  const bedarf = D.aliases[q.get('bedarf')] || q.get('bedarf');
  if (ROLES[q.get('fuer')]) state.fuer = q.get('fuer');
  if (TOPICS[q.get('thema')]) { state.thema = q.get('thema'); state.bereich = groupOf(state.thema).key; }
  if (state.fuer && state.thema && (NEEDS[bedarf] || bedarf === 'krise')) { state.bedarf = bedarf; result(); show(5, false); }
  else if (state.fuer && state.thema) show(4, false);
  else if (state.fuer) show(2, false);
  else show(1, false);
})();
