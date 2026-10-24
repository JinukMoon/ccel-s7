/* Landing page: renders every section from window.CCEL, then drives the left-panel caption. */
(function () {
  'use strict';
  const S = window.S7;
  if (!S || !S.D) return;
  const { D, $, $$, esc, rich, asset, pad2 } = S;
  S.chrome();

  const set = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
  const txt = (id, t) => { const el = document.getElementById(id); if (el) el.textContent = t; };

  /* ---------- identity ---------- */
  txt('lab-aff', D.lab.affiliation);
  txt('lab-name', D.lab.name);
  set('lab-headline', rich(D.research.headline));

  /* ---------- section numbers + section index ---------- */
  const secs = $$('.col > .sec');
  secs.forEach((s, i) => { s.dataset.num = pad2(i + 1); $('.sec-num', s).textContent = pad2(i + 1); });
  set('panel-nav', secs.map(s => `<a href="#${s.id}" data-for="${s.id}"><span>${s.dataset.num}</span>${esc(s.dataset.label)}</a>`).join(''));

  /* ---------- About ---------- */
  set('tagline', rich(D.welcome.tagline));
  set('intro', (D.research.intro || []).map(p => `<p>${rich(p)}</p>`).join(''));
  if (D.research.image) {
    const loop = $('#loop');
    loop.dataset.img = asset(D.research.image);
    loop.dataset.alt = `${D.lab.short} research overview: AI, computational design, experimental validation and analysis`;
  }
  const published = S.pubs.filter(p => p.status === 'published').length;
  const stat = (n, label) => `<div><dt>${esc(label)}</dt><dd>${esc(n)}</dd></div>`;
  set('stats', [
    stat(published, 'Published papers'),
    stat((D.cover_publications || []).length, 'Journal covers'),
    stat(S.people(D.members), 'Current members'),
    stat(S.people(D.alumni), 'Alumni')
  ].join(''));
  txt('about-ko', D.welcome.about_ko || '');

  /* ---------- Research areas ---------- */
  txt('areas-lede', `${S.areas.length} research areas. The publication list is labelled with the same numerals.`);
  set('areas', S.areas.map(a => {
    const inArea = S.pubs.filter(p => p.area === a.numeral);
    const latest = inArea.filter(S.isOut).slice(0, 2);   // data order is newest first
    return `<article class="area" id="area-${esc(a.numeral)}" data-cap="${esc(a.numeral)} · ${esc(a.title)}">` +
      `<div class="area-top"><span class="area-num" aria-hidden="true">${esc(a.numeral)}</span>` +
      (a.image ? `<figure class="area-fig" data-img="${esc(asset(a.image))}" data-alt="Research area ${esc(a.numeral)}: ${esc(a.title)}"></figure>` : '') +
      `</div>` +
      `<h3 class="area-title"><span class="sr">Area ${esc(a.numeral)}: </span>${esc(a.title)}</h3>` +
      `<p class="area-sum">${rich(S.areaSummary(a))}</p>` +
      `<ul class="kw" aria-label="Keywords">${(a.keywords || []).map(k => `<li>${esc(k)}</li>`).join('')}</ul>` +
      `<div class="area-pubs"><div class="row-head"><h4 class="h-mini">Latest papers in area ${esc(a.numeral)}</h4>` +
      `<a class="more" href="publications.html?area=${encodeURIComponent(a.numeral)}">All ${inArea.length} papers</a></div>` +
      latest.map(p => S.citation(p)).join('') + `</div>` +
      `</article>`;
  }).join(''));

  /* ---------- Selected publications (professor's pins, in order) ---------- */
  set('pins', (D.curation.selected_pins || []).map(pin => {
    const p = S.byNo.get(pin.no);
    return p ? S.citation(p, { cover: true, area: pin.area, mark: pin.area || '' }) : '';
  }).join(''));
  txt('all-pubs', `Full publication list · ${published} published papers`);

  /* ---------- covers marquee (front covers, data order = newest first) ---------- */
  const fronts = (D.cover_publications || []).filter(c => c.kind === 'front');
  const shown = fronts.slice(0, 14);
  const coverItem = (c, hidden) => {
    const p = S.paperForCover(c);
    const link = p ? S.paperLink(p) : S.secure(c.url);
    const label = p ? S.coverAlt(p) : 'Journal cover';
    return `<a class="mq-item" href="${esc(link)}" target="_blank" rel="noopener"${hidden ? ' tabindex="-1"' : ''}>` +
      `<img src="${esc(asset(c.image))}" alt="${hidden ? '' : esc(label)}" loading="lazy" decoding="async">` +
      (p ? `<span>${esc(S.strip(p.journal || ''))} ${esc(p.year || '')}</span>` : '') + `</a>`;
  };
  set('marquee', `<div class="mq-track"><div class="mq-set">${shown.map(c => coverItem(c, false)).join('')}</div>` +
    `<div class="mq-set" aria-hidden="true">${shown.map(c => coverItem(c, true)).join('')}</div></div>`);
  txt('covers-more', `All ${(D.cover_publications || []).length} covers`);

  /* ---------- Recent highlights (filled by the maintenance rule) ---------- */
  set('hl', (D.curation.recent_highlights || []).map(no => {
    const p = S.byNo.get(no);
    return p ? S.citation(p, { cover: true, area: p.area, mark: p.area || '' }) : '';
  }).join(''));
  txt('rules', `${D.curation.rules || ''}${D.curation.updated_at ? ' Last updated ' + D.curation.updated_at + '.' : ''}`);

  /* ---------- People preview ---------- */
  const P = D.professor;
  const profLinks = [
    P.email ? S.icon('mail', `${P.name} — Email`, 'mailto:' + P.email) : '',
    P.links && P.links.google_scholar ? S.icon('scholar', `${P.name} — Google Scholar`, S.href(P.links.google_scholar)) : '',
    P.links && P.links.cv ? S.icon('cv', `${P.name} — CV`, S.href(P.links.cv)) : ''
  ].join('');
  set('prof', (P.photo ? `<img class="prof-photo" src="${esc(asset(P.photo))}" alt="${esc(P.name)}" loading="lazy" width="413" height="531">` : '') +
    `<div class="prof-body"><p class="eyebrow">Principal investigator</p><h3 class="prof-name">${esc(P.name)}</h3>` +
    `<p class="prof-title">${esc(P.title)}</p>` + (P.roles || []).map(r => `<p class="prof-role">${esc(r)}</p>`).join('') +
    `<p class="prof-mail"><a href="mailto:${esc(P.email)}">${esc(P.email)}</a></p>` +
    `<span class="icons icons-lg">${profLinks}</span>` +
    `<p><a class="more" href="members.html#professor">Professor profile</a></p></div>`);
  set('group-counts', (D.members || []).map(g => stat(g.people.length, g.group)).join(''));
  set('roster', `<p class="legend"><span class="ty ty-c"></span><span class="lg">Computational</span><span class="ty ty-e"></span><span class="lg">Experimental</span></p>` +
    (D.members || []).map(g => `<div class="ro-group"><h3 class="h-mini">${esc(g.group)}</h3><ul>` +
      g.people.map(m => {
        const n = S.splitName(m.name), t = m.type;
        return `<li><span class="ty ${t === 'experimental' ? 'ty-e' : t === 'computational' ? 'ty-c' : 'ty-n'}" title="${esc(S.typeLabel(t))}"></span>` +
          `<span class="ro-name">${esc(n.name)}${t ? `<span class="sr"> (${esc(S.typeLabel(t))})</span>` : ''}</span>${S.personLinks(m, m.links)}</li>`;
      }).join('') + `</ul></div>`).join(''));

  /* ---------- News ---------- */
  set('news-list', (D.welcome.news || []).map(n =>
    `<li>${n.date ? `<time>${esc(n.date)}</time>` : ''}<p>${rich(n.text)}</p></li>`).join(''));

  /* ---------- Join + Contact ---------- */
  txt('opening', D.welcome.opening_ko || '');
  set('join-mail', `<a class="mail-line" href="mailto:${esc(D.professor.email)}">Email ${esc(D.professor.name)} · ${esc(D.professor.email)}</a>`);
  const C = D.contact;
  const row = (k, v) => v ? `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>` : '';
  set('contact-list', [
    row('Address', esc(C.address)),
    row('Email', `<a href="mailto:${esc(C.email)}">${esc(C.email)}</a>`),
    row('Professor office', esc(C.professor_office)),
    row('Laboratory', esc(C.laboratory)),
    row('Student office', esc(C.student_office))
  ].join(''));

  S.lazyFigures();

  /* ---------- left panel: current section, sub-caption, page progress ---------- */
  const wide = matchMedia('(min-width: 960px)');
  const panel = $('#panel'), introText = $('.intro-inner'), hdr = $('.hdr'), fill = $('#edge-fill');
  const capNum = $('#cap-num'), capName = $('#cap-name'), capSub = $('#cap-sub');
  const foot = $('#footer'), edge = $('.edge');
  const links = $$('#panel-nav a');
  const areasEls = $$('.area');
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
    let sub = '';
    if (cur.id === 'research') for (const a of areasEls) if (a.getBoundingClientRect().top <= line) sub = a.dataset.cap;
    const key = cur.id + '|' + sub;
    if (key === last) return;
    last = key;
    capNum.textContent = cur.dataset.num;
    capName.textContent = cur.dataset.label;
    capSub.textContent = sub;
    links.forEach(l => l.classList.toggle('is-active', l.dataset.for === cur.id));
  }
  const req = () => { if (!raf) raf = requestAnimationFrame(update); };
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  update();
  S.landOnHash();
})();
