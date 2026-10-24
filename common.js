/* S7 Bold split screen: helpers shared by all three pages.
   Every fact comes from window.CCEL (_shared/content.js); this file only formats it. */
(function () {
  'use strict';
  const D = window.CCEL;
  const BASE = '_shared/';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // titles, authors and summaries carry only <sub>/<sup>: keep those, escape the rest
  const rich = s => esc(s).replace(/&lt;(\/?)(sub|sup)&gt;/g, '<$1$2>');
  const strip = s => String(s ?? '').replace(/<[^>]+>/g, '');
  const asset = p => (p ? BASE + p : '');
  const secure = u => (u ? String(u).replace(/^http:/i, 'https:') : '');
  const href = u => (!u ? '' : /^[a-z]+:/i.test(u) ? secure(u) : BASE + u);
  const pad2 = n => String(n).padStart(2, '0');

  /* ---------- research areas ---------- */
  const areas = D.research.areas;
  const areaOf = n => areas.find(a => a.numeral === n) || null;
  // the data's summary repeats "I. <title>" at the front; show only the prose
  const areaSummary = a => {
    const head = `${a.numeral}. ${a.title}`;
    const s = String(a.summary || '');
    return s.startsWith(head) ? s.slice(head.length).trim() : s;
  };

  /* ---------- publications ---------- */
  const pubs = D.publications;
  const byNo = new Map(pubs.map(p => [p.no, p]));
  const isOut = p => p.status === 'published' || p.status === 'in press' || p.status === 'accepted';
  const normUrl = u => String(u || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '')
    .replace(/[#?].*$/, '').replace(/\/+$/, '');

  // a cover belongs to a paper only when the DOI or the article URL matches (never by position)
  const coverByNo = new Map();
  for (const c of D.cover_publications || []) {
    const cu = normUrl(c.url), cd = String(c.doi || '').toLowerCase();
    const p = pubs.find(p => {
      const pd = String(p.doi || '').toLowerCase();
      return (cd && pd && cd === pd) || (cu && p.url && cu === normUrl(p.url)) || (cu && pd && cu.endsWith(pd));
    });
    if (p) {
      const list = coverByNo.get(p.no) || [];
      list.push(c);
      coverByNo.set(p.no, list);
    }
  }
  const frontCover = p => (coverByNo.get(p.no) || []).find(c => c.kind === 'front') || null;
  const paperForCover = c => {
    for (const [no, list] of coverByNo) if (list.includes(c)) return byNo.get(no);
    return null;
  };

  const paperLink = p => (p.doi ? 'https://doi.org/' + p.doi : secure(p.url));

  const boldNames = (html, names) => {
    const list = [...new Set(names.filter(Boolean))].sort((a, b) => b.length - a.length);
    for (const n of list) {
      const re = new RegExp('(^|[\\s,>])(' + n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(?=$|[\\s,<])', 'g');
      html = html.replace(re, '$1<b>$2</b>');
    }
    return html;
  };
  const authorsHtml = p => boldNames(rich(p.authors), [...(p.ccel_authors || []), D.professor.name]);

  // "Journal vol (year) pages." = citation_tail minus the author list and the "(IF=...)" note
  const venue = p => {
    const a = strip(p.authors).trim(), t = String(p.citation_tail || '').trim();
    let v = t.startsWith(a) ? t.slice(a.length).replace(/^\s*,\s*/, '') : [p.journal, p.year && `(${p.year})`].filter(Boolean).join(' ');
    return v.replace(/\s*\(IF\s*=[^)]*\)\s*\.?\s*$/i, '').trim();
  };

  const ifTag = p => p.impact_factor == null ? '' :
    `<span class="tag tag-if">IF ${esc(p.impact_factor)}${p.if_provisional === true ?
      ' <abbr class="prov" title="Provisional: the JCR value for the publication year is not released yet">provisional</abbr>' : ''}</span>`;

  const statusTag = p => p.status && p.status !== 'published' ? `<span class="tag tag-status">${esc(p.status)}</span>` : '';

  const doiLink = p => p.doi ? `<a class="doi" href="https://doi.org/${esc(p.doi)}" target="_blank" rel="noopener">doi:${esc(p.doi)}</a>` :
    (p.url ? `<a class="doi" href="${esc(secure(p.url))}" target="_blank" rel="noopener">Article page</a>` : '');

  const coverAlt = p => `Journal cover: ${strip(p.journal || 'journal')}${p.year ? ' ' + p.year : ''}`;

  // one full citation; opts.cover shows a matching front cover, opts.area labels the research area
  const citation = (p, opts = {}) => {
    const link = paperLink(p);
    const title = link ? `<a href="${esc(link)}" target="_blank" rel="noopener">${rich(p.title)}</a>` : rich(p.title);
    const cov = opts.cover ? frontCover(p) : null;
    const a = opts.area ? areaOf(opts.area) : null;
    const hl = p.highlight ? `<span class="tag tag-hl">${esc(p.highlight)}</span>` : '';
    const side = cov ? `<a class="cite-cover" href="${esc(link || secure(cov.url))}" target="_blank" rel="noopener" tabindex="-1">` +
      `<img src="${esc(asset(cov.image))}" alt="${esc(coverAlt(p))}" loading="lazy" decoding="async"></a>` :
      (opts.mark ? `<span class="cite-mark" aria-hidden="true">${esc(opts.mark)}</span>` : '');
    return `<article class="cite${side ? ' has-side' : ''}">${side}<div class="cite-body">` +
      (a ? `<p class="cite-area"><span>${esc(a.numeral)}</span>${esc(a.title)}</p>` : '') +
      `<h3 class="cite-title">${title}</h3>` +
      `<p class="cite-auth">${authorsHtml(p)}</p>` +
      `<p class="cite-venue">${esc(venue(p))}</p>` +
      `<p class="cite-meta">${statusTag(p)}${ifTag(p)}${hl}${doiLink(p)}</p>` +
      `</div></article>`;
  };

  /* ---------- people ---------- */
  const ICONS = {
    github: '<path fill="currentColor" d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2 0-.3-.5-1.5.2-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.6 18.3 5 18.3 5c.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3"/>',
    linkedin: '<path fill="currentColor" d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/>',
    scholar: '<path fill="currentColor" d="M5.24 13.77 0 9.5 12 0l12 9.5-5.24 4.27A7.5 7.5 0 0 0 12 9.5a7.5 7.5 0 0 0-6.76 4.27zM12 10a7 7 0 1 0 0 14 7 7 0 0 0 0-14z"/>',
    cv: '<path fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" d="M6 2.5h8.5L19 7v14.5H6z"/><path fill="none" stroke="currentColor" stroke-width="1.9" d="M14 2.5V7.5h5M9 12h7M9 15.5h7M9 19h4"/>',
    homepage: '<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.9"/><path fill="none" stroke="currentColor" stroke-width="1.9" d="M2.5 12h19M12 2.5c2.6 2.8 3.9 6 3.9 9.5s-1.3 6.7-3.9 9.5c-2.6-2.8-3.9-6-3.9-9.5S9.4 5.3 12 2.5z"/>',
    mail: '<path fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" d="M2.5 5h19v14h-19z"/><path fill="none" stroke="currentColor" stroke-width="1.9" d="m3 5.5 9 7.5 9-7.5"/>'
  };
  const LINK_LABELS = [['github', 'GitHub'], ['linkedin', 'LinkedIn'], ['scholar', 'Google Scholar'], ['cv', 'CV'], ['homepage', 'Homepage']];
  const icon = (k, label, url) =>
    `<a class="ico" href="${esc(url)}" target="_blank" rel="noopener" aria-label="${esc(label)}" title="${esc(label)}">` +
    `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">${ICONS[k]}</svg></a>`;
  // only links that are set; a null link renders nothing
  const personLinks = (person, links) => {
    const nm = splitName(person.name).name;
    const out = LINK_LABELS.filter(([k]) => links && links[k]).map(([k, l]) => icon(k, `${nm} — ${l}`, href(links[k])));
    return out.length ? `<span class="icons">${out.join('')}</span>` : '';
  };
  // "Hwakyoung Seo (Vice Chief of Lab)" -> name + note
  function splitName(full) {
    const m = String(full || '').match(/^(.*?)\s*\((.*)\)\s*$/);
    return m ? { name: m[1], note: m[2] } : { name: String(full || ''), note: '' };
  }
  const people = groups => (groups || []).reduce((n, g) => n + (g.people || []).length, 0);
  const typeLabel = t => (t === 'computational' ? 'Computational' : t === 'experimental' ? 'Experimental' : '');

  /* ---------- chrome: menu, compact header, footer ---------- */
  function chrome() {
    const hdr = $('.hdr'), btn = $('.menu-btn'), nav = $('#nav');
    const logo = $('.hdr .ccel-logo');
    if (logo && D.lab.logo) { logo.src = asset(D.lab.logo); logo.alt = `${D.lab.short} — ${D.lab.name}`; }
    if (btn && nav) {
      btn.addEventListener('click', () => {
        const open = btn.getAttribute('aria-expanded') !== 'true';
        btn.setAttribute('aria-expanded', String(open));
        hdr.classList.toggle('is-open', open);
      });
      nav.addEventListener('click', e => {
        if (e.target.closest('a')) { btn.setAttribute('aria-expanded', 'false'); hdr.classList.remove('is-open'); }
      });
    }
    const compact = () => hdr && hdr.classList.toggle('is-compact', scrollY > 24);
    addEventListener('scroll', compact, { passive: true });
    compact();
    const ft = $('#footer');
    if (ft) {
      const c = D.contact;
      ft.innerHTML =
        `<div class="ft-brand"><span class="ccel-logo-plate"><img class="ccel-logo" src="${esc(asset(D.lab.logo))}" alt="${esc(D.lab.short)} logo" loading="lazy" width="200" height="102"></span>` +
        `<p class="ft-name">${esc(D.lab.name)}</p><p class="ft-aff">${esc(D.lab.affiliation)}</p></div>` +
        `<div class="ft-col"><p class="ft-h">Address</p><p>${esc(c.address)}</p></div>` +
        `<div class="ft-col"><p class="ft-h">Contact</p><p><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></p>` +
        `<p>Professor office: ${esc(c.professor_office)}</p><p>Student office: ${esc(c.student_office)}</p></div>` +
        `<nav class="ft-nav" aria-label="Footer"><a href="index.html">Welcome</a><a href="members.html#professor">Professor</a>` +
        `<a href="members.html">Members</a><a href="research.html">Research</a><a href="publications.html">Publications</a><a href="index.html#contact">Contact</a></nav>` +
        (D.lab.mse_logo ? `<span class="ft-mse"><img src="${esc(asset(D.lab.mse_logo))}" alt="Department of Materials Science and Engineering, Seoul National University" loading="lazy"></span>` : '');
    }
  }

  // large figures get their <img> only when they come within 400px of the viewport
  // (native loading="lazy" starts far earlier and fetched ~1.6 MB of figures on first paint)
  function lazyFigures(root = document) {
    const figs = $$('[data-img]', root);
    const put = f => {
      f.innerHTML = `<img src="${esc(f.dataset.img)}" alt="${esc(f.dataset.alt || '')}" decoding="async">`;
      f.removeAttribute('data-img');
    };
    if (!('IntersectionObserver' in window)) { figs.forEach(put); return; }
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { io.unobserve(e.target); put(e.target); }
    }), { rootMargin: '400px 0px' });
    figs.forEach(f => io.observe(f));
  }

  // content is rendered after load, so re-apply a #hash once the sections exist
  function landOnHash() {
    if (!location.hash) return;
    let el = null;
    try { el = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (e) { el = null; }
    if (el) requestAnimationFrame(() => el.scrollIntoView({ block: 'start' }));
  }

  window.S7 = {
    D, BASE, $, $$, esc, rich, strip, asset, secure, href, pad2,
    areas, areaOf, areaSummary, pubs, byNo, isOut, frontCover, coverByNo, paperForCover, paperLink,
    authorsHtml, venue, ifTag, statusTag, doiLink, coverAlt, citation,
    personLinks, splitName, people, typeLabel, icon, chrome, landOnHash, lazyFigures
  };
})();
