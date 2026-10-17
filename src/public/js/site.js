// restful · kleine Helfer für Navigation, Wegweiser, Ansichten, Filter und Kontaktformular

// Mobile Navigation
const header = document.querySelector('[data-header]');
const menuBtn = document.querySelector('[data-menu-btn]');
if (header && menuBtn) {
  const setMenu = open => {
    header.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', open);
  };
  menuBtn.addEventListener('click', () => setMenu(!header.classList.contains('open')));
  header.querySelectorAll('#hauptmenue a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && header.classList.contains('open')) { setMenu(false); menuBtn.focus(); }
  });
}

// Aufklappmenü «Für wen»
document.querySelectorAll('.dd').forEach(dd => {
  const btn = dd.querySelector('button');
  const setOpen = open => { dd.classList.toggle('open', open); btn.setAttribute('aria-expanded', open); };
  btn.addEventListener('click', () => setOpen(!dd.classList.contains('open')));
  dd.addEventListener('focusout', e => { if (!dd.contains(e.relatedTarget)) setOpen(false); });
  dd.addEventListener('keydown', e => { if (e.key === 'Escape' && dd.classList.contains('open')) { setOpen(false); btn.focus(); } });
  document.addEventListener('click', e => { if (!dd.contains(e.target)) setOpen(false); });
});

// Wegweiser «Wo stehst du gerade?»
document.querySelectorAll('[data-guide]').forEach(g => {
  const answers = [...g.querySelectorAll('.ans')];
  g.querySelectorAll('input[type=radio]').forEach(r => r.addEventListener('change', () => {
    answers.forEach((a, i) => a.classList.toggle('on', String(i) === r.value));
  }));
});

// Umschalter Sicht Organisation / Sicht Nutzerin
document.querySelectorAll('[role=tablist]').forEach(list => {
  const tabs = [...list.querySelectorAll('[role=tab]')];
  const select = i => tabs.forEach((t, j) => {
    const on = i === j;
    t.setAttribute('aria-selected', on);
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).classList.toggle('on', on);
  });
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i));
    t.addEventListener('keydown', e => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!step) return;
      const next = (i + step + tabs.length) % tabs.length;
      select(next);
      tabs[next].focus();
    });
  });
});

// Filter der Themenfelder auf /wissenschaft/
const filter = document.querySelector('[data-filter]');
if (filter) {
  const F = { topic: 'all', group: 'all', format: 'all' };
  const cards = [...document.querySelectorAll('.ev-card')];
  const chips = [...filter.querySelectorAll('.chip')];
  const count = filter.querySelector('[data-count]');
  const empty = document.querySelector('[data-empty]');
  const apply = () => {
    let n = 0;
    cards.forEach(c => {
      const ok = (F.topic === 'all' || c.dataset.topic === F.topic)
        && (F.group === 'all' || c.dataset.groups.split(' ').includes(F.group))
        && (F.format === 'all' || c.dataset.formats.split(' ').includes(F.format));
      c.hidden = !ok;
      c.classList.remove('wide');
      if (ok) n++;
    });
    const visible = cards.filter(c => !c.hidden);
    if (visible.length === 1) { visible[0].classList.add('wide'); visible[0].querySelector('details').open = true; }
    if (visible.length > 1 && visible.length % 2 === 1) visible[visible.length - 1].classList.add('wide');
    count.textContent = n === 1 ? '1 Themenfeld' : n + ' Themenfelder';
    empty.style.display = n ? 'none' : 'block';
    chips.forEach(ch => {
      const on = F[ch.dataset.f] === ch.dataset.v;
      ch.classList.toggle('on', on);
      ch.setAttribute('aria-pressed', on);
    });
  };
  chips.forEach(ch => ch.addEventListener('click', () => { F[ch.dataset.f] = ch.dataset.v; apply(); }));
  document.querySelectorAll('[data-reset]').forEach(b => b.addEventListener('click', () => {
    F.topic = F.group = F.format = 'all';
    apply();
  }));
  // Direktlink auf ein Thema, z.B. /wissenschaft/#demenz
  const fromHash = () => {
    const hash = decodeURIComponent(location.hash.slice(1));
    if (!cards.some(c => c.dataset.topic === hash)) return false;
    F.topic = hash;
    F.group = F.format = 'all';
    apply();
    document.getElementById('themen').scrollIntoView();
    return true;
  };
  if (!fromHash()) apply();
  window.addEventListener('hashchange', fromHash);
}

// Kontaktformular: bereitet eine E-Mail an restful vor
document.querySelectorAll('[data-contact]').forEach(form => {
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const v = name => form.elements[name].value.trim();
    const subject = 'Anfrage über restful.cc' + (v('Organisation') ? ': ' + v('Organisation') : '');
    const body = [
      v('Nachricht'),
      '',
      'Name: ' + v('Name'),
      'Organisation: ' + (v('Organisation') || '-'),
      'E-Mail: ' + v('E-Mail'),
    ].join('\n');
    location.href = 'mailto:' + form.dataset.to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    form.querySelector('.form-status').textContent = 'Dein E-Mail-Programm sollte sich jetzt mit der Nachricht öffnen. Falls nicht, schreib uns direkt an ' + form.dataset.to + '.';
  });
});
