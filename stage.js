/* Scroll stage for the landing page.
   Desktop (>= 960px): one fixed canvas fills the viewport behind the opening; the dark reading column
   then rises over its right half, so the video stays as the left panel for the rest of the page.
   The frame index follows the progress of the whole page. Narrow screens: the canvas is a video band
   at the top and the frame follows how far the band has scrolled away.
   Native scroll only. Reduced motion: the poster stays as a still image and nothing scrubs.
   Loading: poster at once, keyframes after `load`, the remaining frames after the first interaction. */
(function () {
  'use strict';
  const stage = document.querySelector('.stage');
  if (!stage) return;
  const canvas = stage.querySelector('canvas');
  const poster = stage.querySelector('img');
  const ctx = canvas.getContext('2d');
  const ROOT = '_shared/scroll/';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const wide = matchMedia('(min-width: 960px)');
  const CONCURRENT = 4;

  let manifest = null, hero = null, seq = null, frames = [], setKey = '', drawn = -1, raf = 0;

  const fileName = i => manifest.pattern.replace(/\{index(?::0?(\d+)d)?\}/,
    (_, w) => String(i + (manifest.index_base || 0)).padStart(+w || 0, '0'));

  // keyframes (every 8th and the last) load after `load`; the gaps only once the visitor starts to
  // scroll or interact, coarse-to-fine (every 4th, every 2nd, the rest)
  function order(n) {
    const seen = new Set(), keys = [], rest = [];
    const add = (list, i) => { if (i >= 0 && i < n && !seen.has(i)) { seen.add(i); list.push(i); } };
    for (let i = 0; i < n; i += 8) add(keys, i);
    add(keys, n - 1);
    for (const step of [4, 2, 1]) for (let i = 0; i < n; i += step) add(rest, i);
    return { keys, rest };
  }

  let engaged = false, loader = null;
  function engage() {
    if (engaged) return;
    engaged = true;
    ['scroll', 'wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(t => removeEventListener(t, engage));
    if (loader) loader.more();
  }

  function pickSet() {
    const s = innerWidth < 768 && hero.mobile ? Object.assign({}, hero, hero.mobile) : hero;
    if (s.dir === setKey) return;
    setKey = s.dir; seq = s; frames = new Array(s.count); drawn = -1;
    const key = setKey, { keys, rest } = order(s.count), queue = keys.slice();
    let active = 0, added = false;
    const next = () => {
      while (setKey === key && active < CONCURRENT && queue.length) {
        const i = queue.shift(), im = new Image();
        active++;
        im.decoding = 'async';
        im.onload = () => { active--; if (setKey !== key) return; frames[i] = im; request(); next(); };
        im.onerror = () => { active--; next(); };
        im.src = ROOT + s.dir + '/' + fileName(i);
      }
    };
    loader = { more: () => { if (!added) { added = true; queue.push(...rest); next(); } } };
    next();
    if (engaged) loader.more();
  }

  function size() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(stage.clientWidth * dpr)), h = Math.max(1, Math.round(stage.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; drawn = -1; }
  }

  function progress() {
    if (wide.matches) {
      const max = document.documentElement.scrollHeight - innerHeight;
      return max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    }
    const band = stage.offsetHeight || 1;
    return Math.min(1, Math.max(0, scrollY / band));
  }

  function nearest(t) {
    for (let d = 0; d < frames.length; d++) {
      if (frames[t - d]) return t - d;
      if (frames[t + d]) return t + d;
    }
    return -1;
  }

  function draw() {
    raf = 0;
    if (!seq) return;
    const i = nearest(Math.round(progress() * (seq.count - 1)));
    if (i < 0 || i === drawn) return;           // redraw only when the frame changes
    const im = frames[i], W = canvas.width, H = canvas.height;
    const s = Math.max(W / im.naturalWidth, H / im.naturalHeight);
    const dw = im.naturalWidth * s, dh = im.naturalHeight * s;
    ctx.drawImage(im, (W - dw) / 2, (H - dh) / 2, dw, dh);   // cover-fit, centred like the poster
    drawn = i;
    stage.classList.add('is-live');
  }

  function request() { if (!raf) raf = requestAnimationFrame(draw); }

  function start() {
    fetch(ROOT + 'manifest.json').then(r => r.json()).then(m => {
      manifest = m;
      hero = m.sequences && m.sequences.hero;
      if (!hero) return;
      const p = ROOT + hero.poster;
      if (hero.poster && poster.getAttribute('src') !== p) poster.src = p;
      if (reduce.matches) return;                // still poster, laid out normally
      size();
      pickSet();
      ['scroll', 'wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(t => addEventListener(t, engage, { passive: true }));
      if (scrollY > 0) engage();          // arrived mid-page (anchor) or scrolled before `load`
      addEventListener('scroll', request, { passive: true });
      addEventListener('resize', () => { size(); pickSet(); request(); });
      request();
    }).catch(() => { /* frames are decoration: the poster and all text stay */ });
  }

  // never compete with first paint: start fetching frames once the page has loaded
  if (document.readyState === 'complete') start();
  else addEventListener('load', start, { once: true });
})();
