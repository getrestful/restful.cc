// restful · Navigator: in zwei Schritten zu passenden Anlaufstellen
(() => {
  const root = document.querySelector('[data-navigator]');
  const dataEl = document.getElementById('wn-data');
  if (!root || !dataEl) return;
  const D = JSON.parse(dataEl.textContent);
  const byKey = list => Object.fromEntries(list.map(x => [x.key, x]));
  const TOPICS = byKey(D.topics), NEEDS = byKey(D.needs), ROLES = byKey(D.roles);
  const state = { fuer: 'selbst', thema: null, bedarf: null };

  const steps = [...root.querySelectorAll('[data-step]')];
  const bar = root.querySelector('[data-bar]');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tel = p => 'tel:' + p.replace(/\s/g, '');

  // Schritte anzeigen
  const show = (n, focus = true) => {
    steps.forEach(s => s.classList.toggle('on', s.dataset.step === String(n)));
    bar.style.width = ({ 1: '33%', 2: '66%', 3: '100%' })[n];
    root.querySelectorAll('[data-topic]').forEach(b => b.setAttribute('aria-pressed', b.dataset.topic === state.thema));
    root.querySelectorAll('[data-need]').forEach(b => b.setAttribute('aria-pressed', b.dataset.need === state.bedarf));
    if (n >= 2 && state.thema) root.querySelector('[data-picked]').textContent = '· ' + TOPICS[state.thema].label + ', ' + ROLES[state.fuer].label;
    if (focus) {
      const h = root.querySelector(`[data-step="${n}"] h2`);
      h.focus({ preventScroll: true });
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    const q = new URLSearchParams();
    if (state.thema) q.set('thema', state.thema);
    if (state.thema) q.set('fuer', state.fuer);
    if (n === 3 && state.bedarf) q.set('bedarf', state.bedarf);
    history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : ''));
  };

  // Passende Angebote finden und sortieren
  const match = (o, need) => o.roles.includes(state.fuer)
    && (o.topics.includes(state.thema) || o.topics.includes('alle'))
    && o.needs.includes(need);
  const score = (o, need) => (o.topics.includes(state.thema) ? 3 : 0.5)
    + (o.needs[0] === need ? 2 : 1)
    + (o.prio || 0)
    + (o.partner && need === 'austausch' && o.topics.includes(state.thema) ? 0.5 : 0);
  const rank = () => {
    const need = state.bedarf;
    let list = D.offers.filter(o => match(o, need)).map(o => ({ o, s: score(o, need) }));
    if (list.length < 4) {
      const seen = new Set(list.map(x => x.o.id)), extra = [];
      (D.related[need] || []).forEach(rn => D.offers.forEach(o => {
        if (!seen.has(o.id) && match(o, rn)) { seen.add(o.id); extra.push({ o, s: score(o, rn) - 2.5, related: true }); }
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
    const need = NEEDS[state.bedarf];
    root.querySelector('[data-summary]').textContent = TOPICS[state.thema].label + ' · ' + ROLES[state.fuer].label + ' · ' + need.label;
    root.querySelector('[data-result-title]').innerHTML = need.title;
    const sub = root.querySelector('[data-result-sub]');
    const primary = root.querySelector('[data-primary]');
    const moreWrap = root.querySelector('[data-more-wrap]');
    const more = root.querySelector('[data-more]');
    const crisisBox = root.querySelector('[data-crisis]');
    if (state.bedarf === 'krise') {
      sub.textContent = 'Du musst das nicht allein tragen. Hier erreichst du sofort jemanden, auch nachts und am Wochenende.';
      const extra = D.offers.filter(o => o.needs.includes('krise') && o.roles.includes(state.fuer) && o.topics.includes(state.thema));
      primary.innerHTML = D.crisis.map(crisisCard).join('') + extra.map(o => card({ o })).join('');
      moreWrap.hidden = true; crisisBox.hidden = true;
    } else {
      const list = rank();
      sub.textContent = 'Alle Angebote sind freiwillig. Du entscheidest, was du davon nutzen möchtest, und kannst jederzeit zurück.';
      primary.innerHTML = list.slice(0, 3).map(card).join('');
      more.innerHTML = list.slice(3).map(row).join('');
      moreWrap.hidden = list.length <= 3; crisisBox.hidden = false;
    }
  };

  // Bedienung
  root.querySelectorAll('input[name=fuer]').forEach(r => r.addEventListener('change', () => { state.fuer = r.value; }));
  root.querySelectorAll('[data-topic]').forEach(b => b.addEventListener('click', () => { state.thema = b.dataset.topic; show(2); }));
  root.querySelectorAll('[data-need]').forEach(b => b.addEventListener('click', () => { state.bedarf = b.dataset.need; result(); show(3); }));
  root.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', () => show(+b.dataset.goto)));
  root.querySelector('[data-restart]').addEventListener('click', () => {
    state.thema = state.bedarf = null; state.fuer = 'selbst';
    root.querySelector('input[name=fuer][value=selbst]').checked = true;
    show(1);
  });

  // Direkter Einstieg über die Adresse, z.B. /navigator/?thema=krebs&fuer=angehoerige&bedarf=austausch
  const q = new URLSearchParams(location.search);
  if (ROLES[q.get('fuer')]) { state.fuer = q.get('fuer'); root.querySelector(`input[name=fuer][value=${state.fuer}]`).checked = true; }
  if (TOPICS[q.get('thema')]) {
    state.thema = q.get('thema');
    if (NEEDS[q.get('bedarf')]) { state.bedarf = q.get('bedarf'); result(); show(3, false); }
    else show(2, false);
  } else show(1, false);
})();
