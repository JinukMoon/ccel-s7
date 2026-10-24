/* Publications page: all entries newest first, grouped by year, with search, filters and three views. */
(function () {
  'use strict';
  const S = window.S7;
  if (!S || !S.D) return;
  const { D, $, $$, esc, rich, asset } = S;
  S.chrome();

  const pubs = S.pubs;
  const covers = D.cover_publications || [];
  const counts = D.publication_counts || {};
  const years = [...new Set([...Object.keys(counts).map(Number), ...pubs.map(p => p.year).filter(Boolean)])].sort((a, b) => b - a);

  /* ---------- masthead ---------- */
  $('#pub-lede').textContent = `${pubs.length} entries from ${years[years.length - 1]} to ${years[0]}, newest first. ` +
    `Names of CCEL members are set in bold.`;
  /* ---------- covers marquee (front covers, data order = newest first; moved from the landing in v5) ---------- */
  const fronts = covers.filter(c => c.kind === 'front');
  const shown = fronts.slice(0, 14);
  const coverItem = (c, hidden) => {
    const p = S.paperForCover(c);
    const link = p ? S.paperLink(p) : S.secure(c.url);
    const label = p ? S.coverAlt(p) : 'Journal cover';
    return `<a class="mq-item" href="${esc(link)}" target="_blank" rel="noopener"${hidden ? ' tabindex="-1"' : ''}>` +
      `<img src="${esc(asset(c.image))}" alt="${hidden ? '' : esc(label)}" loading="lazy" decoding="async">` +
      (p ? `<span>${esc(S.strip(p.journal || ''))} ${esc(p.year || '')}</span>` : '') + `</a>`;
  };
  $('#marquee').innerHTML = `<div class="mq-track"><div class="mq-set">${shown.map(c => coverItem(c, false)).join('')}</div>` +
    `<div class="mq-set" aria-hidden="true">${shown.map(c => coverItem(c, true)).join('')}</div></div>`;
  $('#n-all').textContent = pubs.length;
  $('#n-sel').textContent = (D.curation.selected_pins || []).length;
  $('#n-cov').textContent = covers.length;

  /* ---------- filters ---------- */
  const opt = (v, t) => `<option value="${esc(v)}">${esc(t)}</option>`;
  $('#f-year').insertAdjacentHTML('beforeend', years.map(y => opt(y, y)).join(''));
  const STATUS_ORDER = ['published', 'in press', 'accepted', 'in revision', 'submitted'];
  const statuses = [...new Set(pubs.map(p => p.status))].sort((a, b) => STATUS_ORDER.indexOf(a) - STATUS_ORDER.indexOf(b));
  $('#f-status').insertAdjacentHTML('beforeend', statuses.map(s => opt(s, s.charAt(0).toUpperCase() + s.slice(1))).join(''));
  $('#f-area').insertAdjacentHTML('beforeend', S.areas.map(a => opt(a.numeral, `${a.numeral} · ${a.title}`)).join('') + opt('none', 'No area assigned'));

  /* ---------- list (built once; filtering only toggles `hidden`) ---------- */
  const underReview = p => p.status === 'submitted' || p.status === 'in revision';
  const entry = p => {
    const cov = S.frontCover(p) || (S.coverByNo.get(p.no) || [])[0];
    const link = S.paperLink(p);
    const title = link ? `<a href="${esc(link)}" target="_blank" rel="noopener">${rich(p.title)}</a>` : rich(p.title);
    const a = p.area ? S.areaOf(p.area) : null;
    return `<li class="ent" data-no="${p.no}"><span class="ent-no">${p.no}</span><div class="cite-body">` +
      `<h3 class="cite-title">${title}</h3><p class="cite-auth">${S.authorsHtml(p)}</p>` +
      `<p class="cite-venue">${esc(S.venue(p))}</p>` +
      `<p class="cite-meta">${S.statusTag(p)}${S.ifTag(p)}` +
      (p.highlight ? `<span class="tag tag-hl">${esc(p.highlight)}</span>` : '') +
      (a ? `<span class="tag" title="${esc(a.title)}">Area ${esc(a.numeral)}</span>` : '') +
      (p.lab_led ? `<span class="tag">Lab-led</span>` : '') + S.doiLink(p) + `</p></div>` +
      (cov ? `<a class="ent-cover" href="${esc(link || S.secure(cov.url))}" target="_blank" rel="noopener" tabindex="-1">` +
        `<img src="${esc(asset(cov.image))}" alt="${esc(S.coverAlt(p))}" loading="lazy" decoding="async"></a>` : '') +
      `</li>`;
  };
  $('#list').innerHTML = years.map(y => {
    const all = pubs.filter(p => p.year === y);
    if (!all.length) return '';
    const out = all.filter(p => !underReview(p)), rev = all.filter(underReview);
    const total = counts[y] != null ? counts[y] : all.length;
    return `<section class="yr" id="y${y}" data-year="${y}"><div class="yr-head"><h2>${y}</h2><span data-total="${total}">${total} entries</span></div>` +
      (out.length ? `<ol class="ents" data-part="out">${out.map(entry).join('')}</ol>` : '') +
      (rev.length ? `<h3 class="sub-head" data-part="rev">Submitted or in revision</h3><ol class="ents" data-part="rev">${rev.map(entry).join('')}</ol>` : '') +
      `</section>`;
  }).join('') + `<p class="empty" id="empty" hidden>No publications match these filters.</p>`;
  $('#years').innerHTML = years.map(y => `<a href="#y${y}" data-year="${y}">${y}<span class="n">${counts[y] != null ? counts[y] : ''}</span></a>`).join('');

  const rows = $$('#list .ent').map(el => {
    const p = S.byNo.get(+el.dataset.no);
    const hay = [S.strip(p.title), S.strip(p.authors), p.journal || '', S.venue(p)].join(' ').toLowerCase();
    return { el, p, hay };
  });
  const groups = $$('#list .yr');

  function apply() {
    const q = $('#q').value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const y = $('#f-year').value, st = $('#f-status').value, ar = $('#f-area').value, led = $('#f-led').checked;
    let shown = 0;
    for (const r of rows) {
      const p = r.p;
      const ok = (!y || String(p.year) === y) && (!st || p.status === st) &&
        (!ar || (ar === 'none' ? !p.area : p.area === ar)) && (!led || p.lab_led) && q.every(t => r.hay.includes(t));
      r.el.hidden = !ok;
      if (ok) shown++;
    }
    for (const g of groups) {
      let vis = 0;
      for (const part of $$('ol.ents', g)) {
        const n = $$('.ent:not([hidden])', part).length;
        part.hidden = !n; vis += n;
        if (part.dataset.part === 'rev') $('.sub-head', g).hidden = !n;
      }
      g.hidden = !vis;
      const t = $('.yr-head span', g), total = t.dataset.total;
      t.textContent = vis === +total ? `${total} entries` : `${vis} of ${total} entries`;
      const ya = $(`#years a[data-year="${g.dataset.year}"]`);
      if (ya) ya.hidden = !vis;
    }
    $('#empty').hidden = shown > 0;
    $('#count').textContent = shown === pubs.length ? `Showing all ${pubs.length} entries.` : `Showing ${shown} of ${pubs.length} entries.`;
  }
  let timer = 0;
  $('#q').addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(apply, 120); });
  ['#f-year', '#f-status', '#f-area', '#f-led'].forEach(s => $(s).addEventListener('change', apply));

  // links from the landing page: publications.html?area=II
  const params = new URLSearchParams(location.search);
  if (params.get('area') && $(`#f-area option[value="${CSS.escape(params.get('area'))}"]`)) $('#f-area').value = params.get('area');
  if (params.get('q')) $('#q').value = params.get('q');
  apply();

  /* ---------- Selected view ---------- */
  $('#sel-pins').innerHTML = (D.curation.selected_pins || []).map(pin => {
    const p = S.byNo.get(pin.no);
    return p ? S.citation(p, { cover: true, area: pin.area, mark: pin.area || '' }) : '';
  }).join('');
  $('#sel-hl').innerHTML = (D.curation.recent_highlights || []).map(no => {
    const p = S.byNo.get(no);
    return p ? S.citation(p, { cover: true, area: p.area, mark: p.area || '' }) : '';
  }).join('');
  $('#sel-rules').textContent = D.curation.rules || '';

  /* ---------- Covers view (complete archive, back pages included and marked) ---------- */
  $('#cover-grid').innerHTML = covers.map(c => {
    const p = S.paperForCover(c);
    const link = p ? S.paperLink(p) : S.secure(c.url);
    const cap = p ? `<b>${esc(S.strip(p.journal || ''))} ${esc(p.year || '')}</b>${rich(p.title)}` : '<b>Journal cover</b>';
    return `<figure><a href="${esc(link)}" target="_blank" rel="noopener">` +
      `<img src="${esc(asset(c.image))}" alt="${esc(p ? S.coverAlt(p) : 'Journal cover')}" loading="lazy" decoding="async"></a>` +
      `<figcaption>${c.kind === 'back_page' ? '<span class="tag">Back cover page</span> ' : ''}${cap}</figcaption></figure>`;
  }).join('');

  /* ---------- tabs (also reachable as #selected / #covers) ---------- */
  const tabs = $$('.tab');
  function show(id, focus) {
    tabs.forEach(t => {
      const on = t.getAttribute('aria-controls') === id;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      $('#' + t.getAttribute('aria-controls')).hidden = !on;
      if (on && focus) t.focus();
    });
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => { show(t.getAttribute('aria-controls')); history.replaceState(null, '', '#' + t.getAttribute('aria-controls')); });
    t.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      show(n.getAttribute('aria-controls'), true);
    });
  });
  function fromHash() {
    const h = location.hash.slice(1);
    if (h === 'selected' || h === 'covers' || h === 'all') show(h);
    else if (/^y\d{4}$/.test(h)) show('all');
  }
  addEventListener('hashchange', () => { fromHash(); S.landOnHash(); });
  fromHash();
  S.landOnHash();
})();
