/* Research page: the five areas with figure, summary, keywords and key papers.
   Moved from the landing page in v5. Every fact from window.CCEL. */
(function () {
  'use strict';
  const S = window.S7;
  if (!S || !S.D) return;
  const { D, $, esc, rich, asset } = S;
  S.chrome();

  $('#r-headline').innerHTML = rich(D.research.headline || '');
  $('#intro').innerHTML = (D.research.intro || []).map(p => `<p>${rich(p)}</p>`).join('');
  if (D.research.image) {
    const loop = $('#loop');
    loop.dataset.img = asset(D.research.image);
    loop.dataset.alt = `${D.lab.short} research overview: AI, computational design, experimental validation and analysis`;
  }
  $('#area-nav').innerHTML = S.areas.map(a =>
    `<a href="#area-${esc(a.numeral)}"><span>${esc(a.numeral)}</span>${esc(a.title)}</a>`).join('');

  $('#areas').innerHTML = S.areas.map(a => {
    const inArea = S.pubs.filter(p => p.area === a.numeral);
    const latest = inArea.filter(S.isOut).slice(0, 2);   // data order is newest first
    return `<article class="area" id="area-${esc(a.numeral)}">` +
      `<div class="area-top"><span class="area-num" aria-hidden="true">${esc(a.numeral)}</span>` +
      (a.image ? `<figure class="area-fig" data-img="${esc(asset(a.image))}" data-alt="Research area ${esc(a.numeral)}: ${esc(a.title)}"></figure>` : '') +
      `</div>` +
      `<div class="area-main">` +
      `<h2 class="area-title"><span class="sr">Area ${esc(a.numeral)}: </span>${esc(a.title)}</h2>` +
      `<p class="area-sum">${rich(S.areaSummary(a))}</p>` +
      `<ul class="kw" aria-label="Keywords">${(a.keywords || []).map(k => `<li>${esc(k)}</li>`).join('')}</ul>` +
      `<div class="area-pubs"><div class="row-head"><h3 class="h-mini">Latest papers in area ${esc(a.numeral)}</h3>` +
      `<a class="more" href="publications.html?area=${encodeURIComponent(a.numeral)}">All area ${esc(a.numeral)} papers</a></div>` +
      latest.map(p => S.citation(p)).join('') + `</div>` +
      `</div></article>`;
  }).join('');

  S.lazyFigures();
  S.landOnHash();
})();
