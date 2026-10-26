/* Professor page (v6): the principal investigator only, as on the legacy prof.html. Portrait masthead,
   address, email and Google Citation/CV, then Education, Experience and Service from the structured professor fields.
   No members, nothing below but the footer. */
(function () {
  'use strict';
  const S = window.S7;
  if (!S || !S.D) return;
  const { D, $, esc, asset } = S;
  S.chrome();

  const P = D.professor || {}, C = D.contact || {}, L = P.links || {};
  // content = exactly what the legacy prof.html shows (user rule 2026-10-26): no office/phone, no extra links
  // "Jeong Woo Han, Ph.D." as on the legacy page; the degree comes from professor.education
  const phd = (P.education || []).some(e => /^Ph\.?\s?D/i.test(e.degree || ''));
  if (P.photo) $('#prof-photo').innerHTML = `<img src="${esc(asset(P.photo))}" alt="${esc(P.name)}" width="413" height="531" decoding="async">`;
  $('#h-prof').textContent = (P.name || '') + (phd ? ', Ph.D.' : '');
  // "Professor, Department of ..., Seoul National University" -> one line each, roles after the rank
  const parts = String(P.title || '').split(/,\s*/).filter(Boolean);
  $('#prof-lede').innerHTML = [parts[0], ...(P.roles || []), ...parts.slice(1)].filter(Boolean)
    .map((x, i) => `<span class="${i <= (P.roles || []).length ? 'l-strong' : ''}">${esc(x)}</span>`).join('');

  // the street address without the department/university lines already shown in the masthead
  let addr = String(C.address || '');
  if (D.lab.affiliation && addr.startsWith(D.lab.affiliation)) addr = addr.slice(D.lab.affiliation.length).replace(/^\s*,\s*/, '');
  const row = (k, v) => v ? `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>` : '';
  const btn = (k, label, url) => `<a class="prof-btn" href="${esc(url)}"${/^mailto:/.test(url) ? '' : ' target="_blank" rel="noopener"'}>` +
    `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">${S.iconPath(k)}</svg>${esc(label)}</a>`;
  $('#prof-card').innerHTML = `<p class="eyebrow">Contact</p><dl class="prof-dl">` +
    row('Address', esc(addr)) +
    row('Email', P.email ? `<a href="mailto:${esc(P.email)}">${esc(P.email)}</a>` : '') +
    `</dl>` +
    `<p class="prof-btns">` +
    (L.google_scholar ? btn('scholar', 'Google Citation', S.href(L.google_scholar)) : '') +
    (L.cv ? btn('cv', 'Curriculum Vitae', S.href(L.cv)) : '') + `</p>`;

  // Education, Experience and Service from the structured fields (professor.education / experience / service)
  const dash = s => esc(String(s || '').replace(/\s+-\s+/g, ' – '));
  const edu = P.education || [];
  $('#edu-list').innerHTML = edu.map(e => `<li class="cv-item"><span class="cv-date">${esc(e.date || '')}</span><div>` +
    `<p class="cv-inst">${esc(e.institution)}${e.location ? `<span class="loc">, ${esc(e.location)}</span>` : ''}</p>` +
    `<p class="cv-deg"><b>${esc(e.degree)}</b>${e.honors ? ` (${esc(e.honors)})` : ''}${e.field ? `, ${esc(e.field)}` : ''}</p>` +
    (e.thesis ? `<p class="cv-thesis">&ldquo;${esc(e.thesis)}&rdquo;</p>` : '') +
    (e.advisor ? `<p class="cv-adv">Advisor: ${esc(e.advisor)}</p>` : '') + `</div></li>`).join('');
  if (!edu.length) $('#education').hidden = true;

  const exp = P.experience || [];
  $('#exp-list').innerHTML = exp.map(b => `<div class="cv-org"><h3>${esc(b.institution)}` +
    `${b.location ? `<span class="loc">, ${esc(b.location)}</span>` : ''}</h3><ul class="cv-roles">` +
    (b.roles || []).map(r => `<li><span><span class="role">${esc(r.title)}</span>${r.unit ? `, ${esc(r.unit)}` : ''}</span>` +
      `<span class="when">${dash(r.period)}</span></li>`).join('') + `</ul></div>`).join('');
  if (!exp.length) $('#experience').hidden = true;

  const svc = P.service || [];
  $('#svc-list').innerHTML = svc.map(s => `<li><span><span class="role">${esc(s.title)}</span>` +
    `${s.organization ? `, ${esc(s.organization)}` : ''}</span><span class="when">${dash(s.period)}</span></li>`).join('');
  if (!svc.length) $('#service').hidden = true;

  S.landOnHash();
})();
