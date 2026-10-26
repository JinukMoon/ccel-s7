/* Contact page (v6), as on the legacy contact_us.html: the group photo, the lab name and the contact
   details from `contact`. No map, no form. */
(function () {
  'use strict';
  const S = window.S7;
  if (!S || !S.D) return;
  const { D, $, esc, asset } = S;
  S.chrome();

  const C = D.contact || {};
  if (C.group_photo) $('#group-photo').innerHTML = `<img src="${esc(asset(C.group_photo))}" alt="${esc(D.lab.short)} group photo" width="6944" height="4496" decoding="async">`;
  $('#contact-lede').textContent = D.lab.affiliation || '';
  $('#h-lab').textContent = C.lab_name || D.lab.name || '';
  // keep hyphenated tokens (phone numbers, Gwanak-ro) on one line
  const nb = s => esc(s).replace(/(\S+-\S+)/g, '<span class="nw">$1</span>');
  const cell = (k, v, cls = '') => v ? `<div class="${cls}"><dt>${esc(k)}</dt><dd>${v}</dd></div>` : '';
  $('#contact-grid').innerHTML =
    cell('Address', nb(C.address), 'wide') +
    cell('Email', C.email ? `<a href="mailto:${esc(C.email)}">${esc(C.email)}</a>` : '') +
    cell('Professor office', nb(C.professor_office)) +
    cell('Laboratory', nb(C.laboratory)) +
    cell('Student office', nb(C.student_office));
  S.landOnHash();
})();
