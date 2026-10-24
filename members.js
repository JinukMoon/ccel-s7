/* People page: professor, current members by group (computational / experimental marked), alumni. */
(function () {
  'use strict';
  const S = window.S7;
  if (!S || !S.D) return;
  const { D, $, $$, esc, asset } = S;
  S.chrome();

  const members = D.members || [], alumni = D.alumni || [];
  const all = members.flatMap(g => g.people);
  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const initials = n => S.splitName(n).name.split(/\s+/).map(w => w[0]).join('').slice(0, 2);
  const tyClass = t => (t === 'experimental' ? 'ty-e' : t === 'computational' ? 'ty-c' : 'ty-n');

  /* ---------- masthead ---------- */
  const gp = D.contact && D.contact.group_photo;
  if (gp) $('#group-photo').innerHTML = `<img src="${esc(asset(gp))}" alt="${esc(D.lab.short)} group photo" width="6944" height="4496" decoding="async">`;
  const nComp = all.filter(p => p.type === 'computational').length, nExp = all.filter(p => p.type === 'experimental').length;
  $('#ppl-lede').textContent = `Led by Prof. ${D.professor.name}. Member names and details are shown as the lab records them.`;
  const stat = (n, label) => `<div><dt>${esc(label)}</dt><dd>${esc(n)}</dd></div>`;
  $('#ppl-stats').innerHTML = stat(all.length, 'Current members') + stat(S.people(alumni), 'Alumni') +
    stat(nComp, 'Computational') + stat(nExp, 'Experimental');

  /* ---------- sub navigation ---------- */
  $('#subnav').innerHTML = `<a href="#professor">Professor</a>` +
    members.map(g => `<a href="#${slug(g.group)}">${esc(g.group)}</a>`).join('') + `<a href="#alumni">Alumni</a>`;

  /* ---------- professor ---------- */
  const P = D.professor;
  const edu = ((P.sections && P.sections.Education) || []).slice(1).reduce((out, line) => {
    const t = String(line).replace(/^✔\s*/, '').trim();
    if (/^Advisor:/i.test(t) && out.length) out[out.length - 1] += ' · ' + t;
    else if (t) out.push(t);
    return out;
  }, []);
  const links = [
    P.email ? S.icon('mail', `${P.name} — Email`, 'mailto:' + P.email) : '',
    P.links && P.links.google_scholar ? S.icon('scholar', `${P.name} — Google Scholar`, S.href(P.links.google_scholar)) : '',
    P.links && P.links.cv ? S.icon('cv', `${P.name} — CV`, S.href(P.links.cv)) : ''
  ].join('');
  $('#prof').innerHTML = (P.photo ? `<img class="prof-photo" src="${esc(asset(P.photo))}" alt="${esc(P.name)}" width="413" height="531">` : '') +
    `<div class="prof-body"><p class="eyebrow">Principal investigator</p><h3 class="prof-name">${esc(P.name)}</h3>` +
    `<p class="prof-title">${esc(P.title)}</p>` + (P.roles || []).map(r => `<p class="prof-role">${esc(r)}</p>`).join('') +
    `<p class="prof-mail"><a href="mailto:${esc(P.email)}">${esc(P.email)}</a>` +
    (D.contact && D.contact.professor_office ? ` · Office: ${esc(D.contact.professor_office)}` : '') + `</p>` +
    `<span class="icons icons-lg">${links}</span>` +
    (edu.length ? `<div class="edu"><h3>Education</h3><ul>${edu.map(e => `<li>${esc(e)}</li>`).join('')}</ul></div>` : '') +
    `</div>`;

  /* ---------- members ---------- */
  const photo = (m, cls) => m.photo ?
    `<img class="card-photo" src="${esc(asset(m.photo))}" alt="${esc(S.splitName(m.name).name)}" loading="lazy" decoding="async">` :
    `<div class="card-ph" aria-hidden="true">${esc(initials(m.name))}</div>`;
  const typeLine = m => m.type ? `<p class="card-type"><span class="ty ${tyClass(m.type)}"></span>${esc(S.typeLabel(m.type))}</p>` : '';
  const card = m => {
    const n = S.splitName(m.name);
    return `<li class="card" data-type="${esc(m.type || '')}"><div class="card-media">${photo(m)}</div><div class="card-body">` +
      `<h3 class="card-name">${esc(n.name)}</h3>${n.note ? `<p class="card-note">${esc(n.note)}</p>` : ''}` +
      typeLine(m) + (m.research_area ? `<p class="card-area">${esc(m.research_area)}</p>` : '') +
      ((m.degrees || []).length ? `<ul class="card-deg">${m.degrees.map(d => `<li>${esc(d)}</li>`).join('')}</ul>` : '') +
      ((m.email || m.office) ? `<p class="card-contact">${m.email ? `<a href="mailto:${esc(m.email)}">${esc(m.email)}</a>` : ''}` +
        `${m.email && m.office ? '<br>' : ''}${m.office ? esc(m.office) : ''}</p>` : '') +
      S.personLinks(m, m.links) + `</div></li>`;
  };
  $('#groups').innerHTML = members.map(g =>
    `<section class="grp" id="${slug(g.group)}" aria-labelledby="h-${slug(g.group)}">` +
    `<div class="grp-head"><h2 id="h-${slug(g.group)}">${esc(g.group)}</h2><span class="n">${g.people.length}</span></div>` +
    `<ul class="cards">${g.people.map(card).join('')}</ul></section>`).join('');

  /* ---------- alumni ---------- */
  $('#n-alumni').textContent = S.people(alumni);
  $('#alumni-groups').innerHTML = alumni.map(g =>
    `<section class="grp" id="alumni-${slug(g.group)}" aria-labelledby="h-al-${slug(g.group)}">` +
    `<div class="grp-head"><h2 id="h-al-${slug(g.group)}">${esc(g.group)}</h2><span class="n">${g.people.length}</span></div>` +
    `<ul class="cards">${g.people.map(m => {
      const n = S.splitName(m.name);
      return `<li class="card alum" data-type="${esc(m.type || '')}"><div class="card-media">${photo(m)}</div><div class="card-body">` +
        `<h3 class="card-name">${esc(n.name)}</h3>${n.note ? `<p class="card-note">${esc(n.note)}</p>` : ''}` +
        (m.current_position ? `<p class="alum-pos">${esc(m.current_position)}</p>` : '') + typeLine(m) +
        ((m.degrees || []).length ? `<ul class="card-deg">${m.degrees.map(d => `<li>${esc(d)}</li>`).join('')}</ul>` : '') +
        S.personLinks(m, m.links) + `</div></li>`;
    }).join('')}</ul></section>`).join('');

  /* ---------- computational / experimental filter (current members) ---------- */
  const btns = $$('.filter button');
  btns.forEach(b => b.addEventListener('click', () => {
    btns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    const t = b.dataset.type;
    $$('#groups .card').forEach(c => { c.hidden = !!t && c.dataset.type !== t; });
    $$('#groups .grp').forEach(g => { g.hidden = !$$('.card:not([hidden])', g).length; });
  }));

  S.landOnHash();
})();
