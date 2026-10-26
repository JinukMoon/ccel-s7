/* Landing page: renders every section from window.CCEL, then drives the left-panel caption.
   Lean by design (v5): identity, news, open position, the six pinned papers, the Korean intro, contact.
   No counts or totals here; research lives on research.html, people on members.html. */
(function () {
  'use strict';
  const S = window.S7;
  if (!S || !S.D) return;
  const { D, $, $$, esc, rich, pad2 } = S;
  S.chrome();

  const set = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
  const txt = (id, t) => { const el = document.getElementById(id); if (el) el.textContent = t; };

  /* ---------- identity ---------- */
  txt('lab-aff', D.lab.affiliation);
  txt('lab-name', D.lab.name);
  set('tagline', rich(D.welcome.tagline));

  /* ---------- section numbers + section index ---------- */
  const secs = $$('.col > .sec');
  secs.forEach((s, i) => { s.dataset.num = pad2(i + 1); $('.sec-num', s).textContent = pad2(i + 1); });
  // "Contact" opens the Contact page (user, 2026-10-26), not the block at the bottom of home
  set('panel-nav', secs.map(s => `<a href="${s.id === 'contact' ? 'contact.html' : '#' + s.id}" data-for="${s.id}"><span>${s.dataset.num}</span>${esc(s.dataset.label)}</a>`).join(''));

  /* ---------- News ---------- */
  set('news-list', (D.welcome.news || []).map(n =>
    `<li>${n.date ? `<time>${esc(n.date)}</time>` : ''}<p>${rich(n.text)}</p></li>`).join(''));

  /* ---------- Open position (Korean notice) ---------- */
  txt('opening-ko', D.welcome.opening_ko || '');
  set('join-mail', `<a class="mail-line" href="mailto:${esc(D.professor.email)}">Email ${esc(D.professor.name)} · ${esc(D.professor.email)}</a>`);

  /* ---------- Selected publications: the professor's pins, compact (title, one journal line, DOI) ---------- */
  set('pins', (D.curation.selected_pins || []).map(pin => {
    const p = S.byNo.get(pin.no);
    if (!p) return '';
    const a = S.areaOf(pin.area || p.area);
    const link = S.paperLink(p);
    const title = link ? `<a href="${esc(link)}" target="_blank" rel="noopener">${rich(p.title)}</a>` : rich(p.title);
    return `<li class="pin">` +
      (a ? `<a class="pin-area" href="research.html#area-${esc(a.numeral)}" title="Research area ${esc(a.numeral)}: ${esc(a.title)}">` +
        `<span aria-hidden="true">${esc(a.numeral)}</span><span class="sr">Research area ${esc(a.numeral)}: ${esc(a.title)}</span></a>` : '<span></span>') +
      `<div class="pin-body"><h3 class="cite-title">${title}</h3>` +
      `<p class="cite-venue"><span>${esc(S.venue(p))}</span>${p.doi ? `<span class="pin-doi">${S.doiLink(p)}</span>` : ''}</p></div></li>`;
  }).join(''));

  /* ---------- About (Korean intro, as on the current Welcome page) ---------- */
  txt('about-ko', D.welcome.about_ko || '');

  /* ---------- Contact ---------- */
  const C = D.contact;
  const row = (k, v) => v ? `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>` : '';
  set('contact-list', [
    row('Address', esc(C.address)),
    row('Email', `<a href="mailto:${esc(C.email)}">${esc(C.email)}</a>`),
    row('Professor office', esc(C.professor_office)),
    row('Laboratory', esc(C.laboratory)),
    row('Student office', esc(C.student_office))
  ].join(''));

  /* ---------- left panel: current section and page progress ---------- */
  const wide = matchMedia('(min-width: 960px)');
  const panel = $('#panel'), introText = $('.intro-inner'), hdr = $('.hdr'), fill = $('#edge-fill');
  const capNum = $('#cap-num'), capName = $('#cap-name');
  const foot = $('#footer'), edge = $('.edge');
  const links = $$('#panel-nav a');
  let raf = 0, last = '';
  function update() {
    raf = 0;
    const de = document.documentElement, max = de.scrollHeight - innerHeight;
    if (fill) fill.style.transform = `scaleY(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    // the caption appears only once the opening text has left the screen, so the two never overlap
    const on = wide.matches && introText.getBoundingClientRect().bottom < hdr.getBoundingClientRect().bottom + 8;
    panel.classList.toggle('is-on', on);
    document.body.classList.toggle('is-split', on);
    // the panel is fixed, so the footer would slide over its section list: lift it with the footer instead
    const lift = foot ? Math.max(0, innerHeight - foot.getBoundingClientRect().top) : 0;
    const shift = lift ? `translateY(${-lift}px)` : '';
    panel.style.transform = shift;
    if (edge) edge.style.transform = shift;
    const line = innerHeight * 0.4;
    let cur = secs[0];
    for (const s of secs) if (s.getBoundingClientRect().top <= line) cur = s;
    // at the very bottom the last (short) section may never reach the line: it is the one being read
    if (max > 0 && scrollY >= max - 2) cur = secs[secs.length - 1];
    if (cur.id === last) return;
    last = cur.id;
    capNum.textContent = cur.dataset.num;
    capName.textContent = cur.dataset.label;
    links.forEach(l => l.classList.toggle('is-active', l.dataset.for === cur.id));
  }
  const req = () => { if (!raf) raf = requestAnimationFrame(update); };
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  update();
  S.landOnHash();
})();
