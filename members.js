/* Members page (v6): current members only on first view, one person per row as on the legacy
   members.html (photo left; name with the experimental/computational mark, degrees, email, office,
   research area and link icons right). Alumni sit behind an Alumni view with the same rows plus
   Current Position. The professor has his own page (professor.html).
   Views: #current (default) and #alumni. A view link pushes a history entry, so the back button and the
   address bar stay in sync; loading members.html#alumni (or #alumni-<group>) opens the alumni view. */
(function () {
  'use strict';
  const S = window.S7;
  if (!S || !S.D) return;
  const { D, $, $$, esc, asset } = S;
  S.chrome();

  const members = D.members || [], alumni = D.alumni || [];
  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const initials = n => S.splitName(n).name.split(/\s+/).map(w => w[0]).join('').slice(0, 2);

  /* ---------- masthead + bar ---------- */
  $('#ppl-lede').innerHTML = `Led by <a href="professor.html">Prof. ${esc(D.professor.name)}</a>. ` +
    `Names and details are shown as the lab records them.`;
  $('#n-current').textContent = S.people(members);
  $('#n-alumni').textContent = S.people(alumni);
  $('#subnav-current').innerHTML = members.map(g => `<a href="#${slug(g.group)}">${esc(g.group)}</a>`).join('');
  $('#subnav-alumni').innerHTML = alumni.map(g => `<a href="#alumni-${slug(g.group)}">${esc(g.group)}</a>`).join('');
  // the legend doubles as the filter, with the same marks as on each row
  $('#filter').innerHTML = `<span>Show</span><button type="button" data-type="" aria-pressed="true">Everyone</button>` +
    ['experimental', 'computational'].map(t =>
      `<button type="button" data-type="${t}" aria-pressed="false">${S.typeIcon(t)}${esc(S.typeLabel(t))}</button>`).join('');

  /* ---------- one person per row ---------- */
  // "PhD Chemical Engineering, POSTECH (2024)" -> <b>PhD</b> Chemical Engineering, ...
  const DEG = /^(MS\/PhD Course|PhD Course|Research Professor|Postdoc|Ph\.?D\.?|M\.?S\.?|B\.?S\.?)(?=\s|$)/;
  const degLine = d => { const m = String(d).match(DEG); return m ? `<b>${esc(m[1])}</b>${esc(String(d).slice(m[1].length))}` : esc(d); };
  const nb = s => esc(s).replace(/(\S+-\S+)/g, '<span class="nw">$1</span>');   // phone numbers on one line
  const info = (k, v) => v ? `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>` : '';
  const row = (m, alum) => {
    const n = S.splitName(m.name);
    const media = m.photo ?
      `<img class="row-photo" src="${esc(asset(m.photo))}" alt="${esc(n.name)}" loading="lazy" decoding="async" width="180" height="225">` :
      `<div class="row-ph" aria-hidden="true">${esc(initials(m.name))}</div>`;
    const facts = alum ?
      info('Current position', esc(m.current_position)) :
      info('Email', m.email ? `<a href="mailto:${esc(m.email)}">${esc(m.email)}</a>` : '') +
      info('Office', nb(m.office)) + info('Research area', esc(m.research_area));
    return `<li class="row${alum ? ' is-alum' : ''}" data-type="${esc(m.type || '')}"><div class="row-media">${media}</div>` +
      `<div class="row-body"><h3 class="row-name">${S.typeIcon(m.type, true)}<span>${esc(n.name)}</span></h3>` +
      (n.note ? `<p class="row-note">${esc(n.note)}</p>` : '') +
      `<div class="row-cols">` +
      ((m.degrees || []).length ? `<ul class="row-deg">${m.degrees.map(d => `<li>${degLine(d)}</li>`).join('')}</ul>` : '') +
      (facts ? `<dl class="row-info">${facts}</dl>` : '') + `</div>` +
      S.personLinks(m, m.links) + `</div></li>`;
  };
  $('#groups').innerHTML = members.map(g =>
    `<section class="grp" id="${slug(g.group)}" aria-labelledby="h-${slug(g.group)}">` +
    `<div class="grp-head"><h2 id="h-${slug(g.group)}">${esc(g.group)}</h2><span class="n">${g.people.length}</span></div>` +
    `<ul class="rows">${g.people.map(m => row(m, false)).join('')}</ul></section>`).join('');
  $('#alumni-groups').innerHTML = alumni.map(g =>
    `<section class="grp" id="alumni-${slug(g.group)}" aria-labelledby="h-al-${slug(g.group)}">` +
    `<div class="grp-head"><h3 id="h-al-${slug(g.group)}">${esc(g.group)}</h3><span class="n">${g.people.length}</span></div>` +
    `<ul class="rows">${g.people.map(m => row(m, true)).join('')}</ul></section>`).join('');

  /* ---------- experimental / computational filter (both views) ---------- */
  const btns = $$('#filter button');
  btns.forEach(b => b.addEventListener('click', () => {
    btns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    const t = b.dataset.type;
    $$('.row').forEach(r => { r.hidden = !!t && r.dataset.type !== t; });
    $$('.view .grp').forEach(g => { g.hidden = !$$('.row:not([hidden])', g).length; });
  }));

  /* ---------- views: current members / alumni ---------- */
  const VIEW = { current: $('#current'), alumni: $('#alumni') };
  const SUB = { current: $('#subnav-current'), alumni: $('#subnav-alumni') };
  const viewBtns = $$('.view-btn');
  // which view an in-page id belongs to; null = not a members id (e.g. #main), left to the browser
  const viewOf = id => {
    if (!id) return 'current';
    const el = document.getElementById(id);
    if (!el) return null;
    if (VIEW.alumni.contains(el)) return 'alumni';
    if (VIEW.current.contains(el)) return 'current';
    return null;
  };
  const show = v => {
    for (const k of Object.keys(VIEW)) { VIEW[k].hidden = k !== v; SUB[k].hidden = k !== v; }
    viewBtns.forEach(b => (b.dataset.view === v ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
  };
  const reveal = (id, instant) => {
    const el = id && document.getElementById(id);
    if (el) el.scrollIntoView({ block: 'start', behavior: instant ? 'instant' : 'auto' });
  };
  const hashId = () => { try { return decodeURIComponent(location.hash.slice(1)); } catch (e) { return ''; } };

  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const id = decodeURIComponent(a.getAttribute('href').slice(1)), v = viewOf(id);
    if (!v) return;
    e.preventDefault();
    // remember where the visitor was, so Back returns to the same spot
    history.replaceState(Object.assign({}, history.state, { y: scrollY }), '');
    if (location.hash !== '#' + id) history.pushState({}, '', '#' + id);
    show(v);
    reveal(id);
  });
  let popped = null;
  addEventListener('popstate', e => {
    const id = hashId();
    popped = location.hash;
    show(viewOf(id) || 'current');
    const y = e.state && typeof e.state.y === 'number' ? e.state.y : null;
    requestAnimationFrame(() => {
      if (y != null) scrollTo({ top: y, behavior: 'instant' });
      else if (id && viewOf(id)) reveal(id, true);
      else scrollTo({ top: 0, behavior: 'instant' });
    });
  });
  // a hash typed into the address bar
  addEventListener('hashchange', () => {
    if (popped === location.hash) { popped = null; return; }
    const id = hashId(), v = viewOf(id);
    if (v) { show(v); reveal(id); }
  });

  // first load: members.html#alumni opens the alumni view
  show(viewOf(hashId()) || 'current');
  S.landOnHash();
  // land again once fonts and the page have settled, unless the visitor has already moved
  if (location.hash) {
    let touched = false;
    ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(ev => addEventListener(ev, () => { touched = true; }, { once: true, passive: true }));
    const again = () => { if (!touched && viewOf(hashId())) reveal(hashId(), true); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(again);
    addEventListener('load', again);
  }
})();
