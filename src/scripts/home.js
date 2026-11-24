/* Home page behavior: pixel scene, windows, photo viewer, bunnies, raccoon, screensaver, tour and calm mode.
   Loaded by the <script> at the bottom of src/pages/index.astro; Astro bundles and minifies it. */
document.getElementById('year').textContent = new Date().getFullYear();
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Pixel-art scene ---------- */
const PX_W = 320; // the scene is drawn 320 pixels wide, then scaled up
let sceneTops = [], sceneH = 1; // front hill ridge, used by the bunnies
function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }

function drawScene() {
  const canvas = document.getElementById('scene-canvas');
  const W = PX_W;
  const H = Math.max(180, Math.round(W * window.innerHeight / window.innerWidth));
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const rand = rng(7);
  const px = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); };

  // Sky: hard color bands with a checkerboard dither between them
  const sky = ['#1b5cc8', '#2369d6', '#2d78e2', '#3a88ec', '#4b99f3', '#5fabf8', '#76bcfb', '#90cdfd', '#addcfe', '#c9e9ff'];
  const skyEnd = Math.round(H * 0.8);
  const band = skyEnd / sky.length;
  ctx.fillStyle = sky[sky.length - 1]; ctx.fillRect(0, 0, W, H);
  for (let y = 0; y < skyEnd; y++) {
    const i = Math.min(sky.length - 1, Math.floor(y / band));
    ctx.fillStyle = sky[i]; ctx.fillRect(0, y, W, 1);
    if (y / band - i > 0.7 && i < sky.length - 1) {
      for (let x = (y % 2); x < W; x += 2) px(x, y, sky[i + 1]);
    }
  }

  // Sun with dithered glow
  const sx = Math.round(W * 0.82), sy = Math.round(Math.min(H * 0.12, 44)), r = 12;
  for (let dy = -r - 6; dy <= r + 6; dy++) {
    for (let dx = -r - 6; dx <= r + 6; dx++) {
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d <= r - 3) px(sx + dx, sy + dy, '#fff4a8');
      else if (d <= r) px(sx + dx, sy + dy, '#ffe066');
      else if (d <= r + 6 && (dx + dy) % 2 === 0) px(sx + dx, sy + dy, '#e9f6ff');
    }
  }

  // Rolling hills
  function hill(base, amp, f1, f2, phase, light, mid, dark) {
    const tops = [];
    for (let x = 0; x < W; x++) {
      const y = Math.round(base + amp * Math.sin(x / f1 + phase) + amp * 0.45 * Math.sin(x / f2 + phase * 2));
      tops.push(y);
      ctx.fillStyle = mid; ctx.fillRect(x, y, 1, H - y);
      ctx.fillStyle = dark; ctx.fillRect(x, y + Math.round((H - y) * 0.55), 1, H);
      px(x, y, light);
      if (x % 3 === 0) px(x, y - 1, light); // grass tufts on the ridge
    }
    // texture specks
    for (let n = 0; n < W * 2; n++) {
      const x = Math.floor(rand() * W);
      const y = tops[x] + 2 + Math.floor(rand() * (H - tops[x]));
      px(x, y, rand() > 0.5 ? dark : light);
    }
    return tops;
  }
  hill(H * 0.64, 9, 40, 17, 0.6, '#b2ee7c', '#7fd34e', '#5fbb38');
  const front = hill(H * 0.78, 11, 52, 14, 2.1, '#8ee05a', '#4eae2e', '#348f20');
  sceneTops = front; sceneH = H;

  // Wildflowers on the front hill
  const petals = ['#ffffff', '#ffe14d', '#ff8fb1', '#ffb347'];
  for (let n = 0; n < 70; n++) {
    const x = 2 + Math.floor(rand() * (W - 4));
    const y = front[x] + 4 + Math.floor(rand() * (H - front[x] - 6));
    const c = petals[Math.floor(rand() * petals.length)];
    px(x, y, c); px(x - 1, y, c); px(x + 1, y, c); px(x, y - 1, c);
    px(x, y, '#ffd23f'); px(x, y + 1, '#2c7a19');
  }
}

// Pixel sprites for clouds and birds (drawn once, reused as images)
function sprite(w, h, paint) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  paint(c.getContext('2d'));
  return c.toDataURL();
}
function cloudSprite(seed) {
  const rand = rng(seed), w = 48, h = 18;
  const puffs = [{ x: 24, y: 12, r: 6 }];
  for (let i = 0; i < 4; i++) puffs.push({ x: 9 + rand() * 30, y: 8 + rand() * 3, r: 4 + rand() * 4 });
  return { w, h, url: sprite(w, h, (ctx) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const inBase = y >= 10 && y <= 15 && x >= 5 && x <= 43;
      const inPuff = puffs.some((p) => (x - p.x) ** 2 + (y - p.y) ** 2 <= p.r * p.r);
      if (inBase || inPuff) { ctx.fillStyle = y >= 14 ? '#cfe6fb' : '#ffffff'; ctx.fillRect(x, y, 1, 1); }
    }
  }) };
}
const birdUrl = sprite(14, 4, (ctx) => {
  ctx.fillStyle = '#1d3557';
  const frames = [
    ['#.....#', '.#...#.', '..#.#..', '...#...'],
    ['.......', '...#...', '.##.##.', '#.....#']
  ];
  frames.forEach((rows, f) => rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '#') ctx.fillRect(f * 7 + x, y, 1, 1); })));
});

function buildSkyLayer() {
  const layer = document.getElementById('sky-layer');
  const clouds = [
    { top: 8, dur: 140, delay: -30, seed: 11 },
    { top: 20, dur: 190, delay: -120, seed: 23 },
    { top: 4, dur: 165, delay: -80, seed: 37 },
    { top: 30, dur: 220, delay: -10, seed: 51 }
  ];
  clouds.forEach((c, i) => {
    const s = cloudSprite(c.seed);
    const el = document.createElement('div');
    el.className = 'cloud';
    el.style.cssText = `top:${c.top}%;--w:${s.w};--h:${s.h};background-image:url(${s.url});animation-duration:${c.dur}s;animation-delay:${c.delay}s;--scale:${i % 2 ? 0.75 : 1}`;
    layer.appendChild(el);
  });
  [{ top: 18, dur: 38, delay: -6 }, { top: 23, dur: 46, delay: -25 }, { top: 15, dur: 52, delay: -40 }].forEach((b) => {
    const wrap = document.createElement('div');
    wrap.className = 'bird-path';
    wrap.style.cssText = `top:${b.top}%;animation-duration:${b.dur}s;animation-delay:${b.delay}s`;
    const bird = document.createElement('div');
    bird.className = 'bird';
    bird.style.backgroundImage = `url(${birdUrl})`;
    wrap.appendChild(bird);
    layer.appendChild(wrap);
  });
}

function setScale() { document.documentElement.style.setProperty('--px', (window.innerWidth / PX_W) + 'px'); }
setScale(); drawScene(); buildSkyLayer();
let lastW = window.innerWidth, lastH = window.innerHeight, resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    // ignore small height changes from mobile address bars
    if (window.innerWidth !== lastW || Math.abs(window.innerHeight - lastH) > 120) {
      lastW = window.innerWidth; lastH = window.innerHeight;
      setScale(); drawScene(); placeBunnies();
    }
  }, 150);
});

/* ---------- Tab title + active taskbar button ---------- */
const titles = {
  top: 'Abraham Zhong',
  projects: 'Personal Projects — Abraham Zhong',
  about: 'About Me — Abraham Zhong',
  contact: 'Contact — Abraham Zhong'
};
const tasks = document.querySelectorAll('.task');
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    document.title = titles[e.target.id];
    tasks.forEach((t) => t.classList.toggle('active', t.dataset.section === e.target.id));
  });
}, { rootMargin: '-45% 0px -45% 0px' });
document.querySelectorAll('section[id]').forEach((s) => sectionObserver.observe(s));

/* ---------- Reveal on scroll ---------- */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); revealObserver.unobserve(e.target); }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

/* ---------- Calm mode: scrolling down blurs the background and hides the moving scenery and desktop icons ---------- */
// Back at the very top, everything returns. Only scrolls the visitor makes count: on a refresh the browser
// jumps back to where you were before you touch anything, so that jump leaves the full scene showing.
(() => {
  const root = document.documentElement;
  const inputs = ['pointerdown', 'wheel', 'touchstart', 'keydown'];
  let armed = false;
  const arm = () => { armed = true; inputs.forEach((t) => removeEventListener(t, arm, true)); };
  inputs.forEach((t) => addEventListener(t, arm, { capture: true, passive: true }));
  addEventListener('scroll', () => {
    if (armed) root.classList.toggle('calm', scrollY > 4);   // 4px of slack for trackpad and touch wobble
  }, { passive: true });
})();

/* ---------- Headline ticker ---------- */
const headlines = [
  'Now building: a robot arm to play catch',
  'Training policies for cross-embodiment transfer',
  'Software Engineer at Stanford University School of Medicine',
  'Logistics & Hardware Lead at TreeHacks',
  'Vid2CAD: turning video into parametric CAD'
];
const headlineEl = document.getElementById('headline');
let h = 0;
setInterval(() => {
  h = (h + 1) % headlines.length;
  if (reduceMotion) { headlineEl.textContent = headlines[h]; return; }
  headlineEl.classList.add('out');
  setTimeout(() => { headlineEl.textContent = headlines[h]; headlineEl.classList.remove('out'); }, 300);
}, 4500);

/* ---------- Taskbar clock ---------- */
const clock = document.getElementById('clock');
let clockStolen = false;
const tick = () => { if (clockStolen) return; clock.textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); };
tick();
setInterval(tick, 15000);

/* ---------- Photos: anything dropped into /images loads automatically ---------- */
const photoCache = {};
function probe(src) {
  if (!(src in photoCache)) {
    photoCache[src] = new Promise((res) => {
      const im = new Image();
      im.onload = () => res(true);
      im.onerror = () => res(false);
      im.src = src;
    });
  }
  return photoCache[src];
}

const isVideo = (src) => /\.(mp4|webm|mov)$/i.test(src);

// Videos play once, only while on screen (never with reduced motion), then go back to their poster
const videoSeen = new IntersectionObserver((entries) => entries.forEach((e) => {
  const v = e.target;
  v._visible = e.isIntersecting;
  if (v._visible && v._wanted !== false && !v._done && !reduceMotion) v.play().catch(() => {});
  else v.pause();
}), { threshold: 0.25 });

// After one play-through, show the poster (the video's first frame) and stay there
function showThumb(v) {
  v._done = true;
  v.load(); // resets to the poster; preload="none" means nothing downloads again
}

function makeMedia(src, poster, alt) {
  if (!isVideo(src)) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    img.decoding = 'async';
    return img;
  }
  const v = document.createElement('video');
  v.muted = true;
  v.playsInline = true;
  v.preload = 'none'; // nothing downloads until it scrolls into view
  v.setAttribute('muted', '');
  v.setAttribute('playsinline', '');
  if (poster) v.poster = poster;
  v.src = src;
  v.setAttribute('aria-label', alt);
  v.addEventListener('ended', () => showThumb(v));
  videoSeen.observe(v);
  return v;
}

// Swap a checkered placeholder for its photo or video, if the file exists (videos are checked via their poster)
async function fill(ph) {
  const { src, poster = '', alt = '' } = ph.dataset;
  const ok = isVideo(src) ? !poster || await probe(poster) : await probe(src);
  if (!ok) return null;
  const el = makeMedia(src, poster, alt);
  el.className = ph.className.replace('placeholder', '').trim();
  ph.replaceWith(el);
  return el;
}

// Photo Viewer slideshow: one entry per tile that has media, in tile order
const tiles = [...document.querySelectorAll('.tile')];
let photos = [];
const tilesReady = Promise.all(tiles.map(async (t) => {
  const ph = t.querySelector('.tile-media');
  const { src, poster = '' } = ph.dataset;
  const name = t.querySelector('h3').textContent;
  const el = await fill(ph);
  if (!el) return null;
  const video = isVideo(src);
  el.setAttribute('role', 'button');
  el.setAttribute('tabindex', '0');
  el.setAttribute('aria-label', `View ${name} ${video ? 'video' : 'photo'}`);
  return { el, src, poster, video, name };
})).then((list) => { photos = list.filter(Boolean); });
document.querySelectorAll('.placeholder[data-src]:not(.tile-media)').forEach(fill);

// Tile media opens in the photo viewer
const photoAt = (e) => {
  const m = e.target.closest('.tile-media');
  const i = m ? photos.findIndex((p) => p.el === m) : -1;
  return i >= 0 ? [i, m] : null;
};
document.querySelector('.tiles').addEventListener('click', (e) => {
  const hit = photoAt(e);
  if (hit) openInViewer(...hit);
});
document.querySelector('.tiles').addEventListener('keydown', (e) => {
  const hit = photoAt(e);
  if (hit && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openInViewer(...hit); }
});

/* ---------- Window manager: minimize / maximize / close ---------- */
const ICONS = {
  min: '<svg viewBox="0 0 8 8" fill="currentColor"><rect x="1" y="6" width="5" height="2"/></svg>',
  max: '<svg viewBox="0 0 8 8" fill="currentColor"><path fill-rule="evenodd" d="M0 0h8v8H0zM1 2v5h6V2z"/></svg>',
  restore: '<svg viewBox="0 0 8 8" fill="currentColor"><path fill-rule="evenodd" d="M2 0h6v6H7V2H2zM0 2h6v6H0zM1 4v3h4V4z"/></svg>',
  close: '<svg viewBox="0 0 8 8" fill="currentColor"><path d="M0 0h2v1h1v1h2V1h1V0h2v2H7v1H6v2h1v1h1v2H6V7H5V6H3v1H2v1H0V6h1V5h1V3H1V2H0z"/></svg>',
  play: '<svg viewBox="0 0 8 8" fill="currentColor"><path d="M2 0h1v8H2zM3 1h1v6H3zM4 2h1v4H4zM5 3h1v2H5z"/></svg>',
  pause: '<svg viewBox="0 0 8 8" fill="currentColor"><path d="M1 1h2v6H1zM5 1h2v6H5z"/></svg>'
};

// Play a choppy (stepped) animation; resolves with a function that clears it
async function run(el, frames, opts = {}) {
  if (reduceMotion) return () => {};
  const a = el.animate(frames, { duration: 360, easing: 'steps(6, end)', fill: 'forwards', ...opts });
  try { await a.finished; } catch (_) { /* cancelled */ }
  return () => a.cancel();
}
const flip = (from, to) => `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`;
const toward = (from, to) => `translate(${to.left + to.width / 2 - (from.left + from.width / 2)}px, ${to.top + to.height / 2 - (from.top + from.height / 2)}px) scale(${to.width / from.width}, ${to.height / from.height})`;
const CRT_OFF = [
  { transform: 'none', filter: 'brightness(1)', opacity: 1 },
  { transform: 'scale(1, 0.03)', filter: 'brightness(3)', opacity: 1, offset: 0.55 },
  { transform: 'scale(0, 0.03)', filter: 'brightness(4)', opacity: 0 }
];

async function guard(win, fn) {
  if (win._busy) return;
  win._busy = true;
  try { await fn(); } finally { win._busy = false; }
}
const isMax = (win) => win.classList.contains('maximized');
const taskWindows = document.getElementById('task-windows');

function setMaxIcon(win, on) {
  const b = win.querySelector('[data-act="max"]');
  b.innerHTML = on ? ICONS.restore : ICONS.max;
  b.setAttribute('aria-label', `${on ? 'Restore' : 'Maximize'} ${win._name}`);
}

async function maximize(win, fromRect) {
  const real = win.getBoundingClientRect();
  const first = fromRect || real;
  const ghost = document.createElement('div');
  ghost.className = 'win-ghost';
  ghost.style.height = real.height + 'px';
  win.before(ghost);
  win._ghost = ghost;
  win.classList.add('maximized');
  document.body.classList.add('has-max');
  setMaxIcon(win, true);
  const last = win.getBoundingClientRect();
  (await run(win, [
    { transformOrigin: '0 0', transform: flip(first, last) },
    { transformOrigin: '0 0', transform: 'none' }
  ], { duration: 340 }))();
}

async function unmaximize(win, animate = true) {
  const first = win.getBoundingClientRect();
  win.classList.remove('maximized');
  if (win._ghost) { win._ghost.remove(); win._ghost = null; }
  if (!document.querySelector('.window.maximized')) document.body.classList.remove('has-max');
  setMaxIcon(win, false);
  if (!animate) return;
  const last = win.getBoundingClientRect();
  (await run(win, [
    { transformOrigin: '0 0', transform: flip(first, last) },
    { transformOrigin: '0 0', transform: 'none' }
  ], { duration: 300 }))();
}

async function minimize(win) {
  if (isMax(win)) await unmaximize(win, false);
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'task win-task';
  btn.setAttribute('aria-label', `Restore ${win._name}`);
  btn.innerHTML = '<span class="win-task-ico" aria-hidden="true"></span><span class="win-task-label"></span>';
  btn.lastChild.textContent = win._name;
  btn.addEventListener('click', () => guard(win, () => restore(win)));
  taskWindows.append(btn);
  win._task = btn;
  run(btn, [{ transform: 'translateY(110%)' }, { transform: 'none' }], { duration: 240, easing: 'steps(3, end)' }).then((d) => d());
  const done = await run(win, [
    { transform: 'none', opacity: 1 },
    { transform: toward(win.getBoundingClientRect(), btn.getBoundingClientRect()), opacity: 0.3 }
  ], { duration: 420, easing: 'steps(7, end)' });
  win.hidden = true;
  done();
}

async function restore(win) {
  const btn = win._task;
  win.hidden = false;
  win.scrollIntoView({ block: 'center', behavior: 'instant' });
  const from = win.getBoundingClientRect();
  const to = btn.getBoundingClientRect();
  btn.remove();
  win._task = null;
  (await run(win, [
    { transform: toward(from, to), opacity: 0.3 },
    { transform: 'none', opacity: 1 }
  ], { duration: 400, easing: 'steps(7, end)' }))();
}

function desktopIcon(win) {
  if (win._icon) return win._icon;
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'desk-icon';
  b.hidden = true;
  b.setAttribute('aria-label', `Open ${win._name}`);
  b.innerHTML = '<span class="desk-ico" aria-hidden="true"></span><span class="desk-label"></span><span class="desk-hint">click to open</span>';
  b.querySelector('.desk-label').textContent = win._name;
  b.addEventListener('click', () => guard(win, () => reopen(win)));
  win.before(b);
  return (win._icon = b);
}

async function closeWin(win) {
  if (isMax(win)) await unmaximize(win, false);
  const done = await run(win, CRT_OFF, { duration: 460, easing: 'steps(9, end)' });
  win.hidden = true;
  done();
  const icon = desktopIcon(win);
  icon.hidden = false;
  icon.focus({ preventScroll: true });
  (await run(icon, [{ opacity: 0, transform: 'scale(0.5)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'steps(4, end)' }))();
}

async function reopen(win) {
  win._icon.hidden = true;
  win.hidden = false;
  (await run(win, [...CRT_OFF].reverse().map((f, i) => ({ ...f, offset: [0, 0.45, 1][i] })), { duration: 460, easing: 'steps(9, end)' }))();
}

// Give every window real title-bar buttons
document.querySelectorAll('.window').forEach((win) => {
  const bar = win.querySelector('.title-bar');
  win._name = win.dataset.name || bar.querySelector('.title').textContent.trim();
  const btns = document.createElement('span');
  btns.className = 'title-buttons';
  btns.innerHTML =
    `<button type="button" data-act="min" aria-label="Minimize ${win._name}">${ICONS.min}</button>` +
    `<button type="button" data-act="max" aria-label="Maximize ${win._name}">${ICONS.max}</button>` +
    `<button type="button" data-act="close" aria-label="Close ${win._name}">${ICONS.close}</button>`;
  bar.appendChild(btns);
  // On a project tile, maximize opens the project page, same as its Learn more button
  const page = win.classList.contains('tile') && win.querySelector('a[href^="/projects/"]');
  if (page) btns.querySelector('[data-act="max"]').setAttribute('aria-label', `Open the ${win._name} page`);
  btns.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'max' && page) return page.click();
    guard(win, () => act === 'min' ? minimize(win) : act === 'close' ? closeWin(win) : isMax(win) ? unmaximize(win) : maximize(win));
  });
  bar.addEventListener('dblclick', (e) => {
    if (e.target.closest('button')) return;
    if (page) return page.click();
    guard(win, () => isMax(win) ? unmaximize(win) : maximize(win));
  });
});

/* ---------- Photo viewer ---------- */
const viewer = document.querySelector('.viewer');
const vStage = document.getElementById('viewer-stage');
const vImg = document.getElementById('viewer-img');
const vEmpty = document.getElementById('viewer-empty');
const vTitle = document.getElementById('viewer-title');
const vPlay = document.getElementById('viewer-play');
const vVid = document.getElementById('viewer-vid');
let vi = 0, playing = false, slideTimer = null;
vVid._wanted = false;
if (reduceMotion) vVid.controls = true; // no autoplay, but the video can still be started by hand
videoSeen.observe(vVid);
vVid.addEventListener('ended', () => { showThumb(vVid); schedule(); });

function showPhoto(i, dir = 1, animate = true) {
  if (!photos.length) {
    vEmpty.innerHTML = '<span>No photos yet</span>';
    vEmpty.hidden = false;
    vImg.hidden = vVid.hidden = true;
    return;
  }
  vi = (i + photos.length) % photos.length;
  const p = photos[vi];
  vTitle.textContent = `${p.src.split('/').pop()} - Photo Viewer`;
  document.getElementById('viewer-caption').textContent = p.name;
  document.getElementById('viewer-count').textContent = `${vi + 1} / ${photos.length}`;
  if (p.video) {
    vVid.poster = p.poster;
    vVid.src = p.src;
    vVid.setAttribute('aria-label', p.name);
    vVid._wanted = true;
    vVid._done = false; // each time a video slide comes up, it plays once
    if (vVid._visible && !reduceMotion) vVid.play().catch(() => {});
  } else {
    vImg.src = p.src;
    vImg.alt = p.name;
    vVid._wanted = false;
    vVid.pause();
    vVid.removeAttribute('src'); // stop downloading the previous video
    vVid.load();
  }
  vImg.hidden = p.video;
  vVid.hidden = !p.video;
  vEmpty.hidden = true;
  schedule();
  if (animate) {
    run(p.video ? vVid : vImg, [
      { clipPath: dir > 0 ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)' },
      { clipPath: 'inset(0 0 0 0)' }
    ], { duration: 320, easing: 'steps(8, end)' }).then((d) => d());
  }
}

// Photos stay up 4.5s. Videos play to the end, then their thumbnail stays up 2.5s.
// The 30s fallback keeps the slideshow moving if a video never starts (e.g. autoplay blocked).
function schedule() {
  clearTimeout(slideTimer);
  slideTimer = null;
  if (!playing || photos.length < 2) return;
  const ms = !photos[vi].video ? 4500 : vVid._done ? 2500 : 30000;
  slideTimer = setTimeout(() => showPhoto(vi + 1, 1), ms);
}
function setPlaying(on) {
  playing = on && !reduceMotion;
  schedule();
  vPlay.innerHTML = playing ? ICONS.pause : ICONS.play;
  vPlay.setAttribute('aria-label', playing ? 'Pause slideshow' : 'Play slideshow');
}
const step = (dir) => showPhoto(vi + dir, dir); // also restarts the slideshow timer

async function openInViewer(i, fromEl) {
  setPlaying(false);
  showPhoto(i, 1, isMax(viewer));
  if (isMax(viewer)) return;
  // bring the viewer back instantly if it was closed or minimized, then zoom it out of the clicked photo
  if (viewer._icon) viewer._icon.hidden = true;
  if (viewer._task) { viewer._task.remove(); viewer._task = null; }
  viewer.hidden = false;
  viewer.classList.add('in');
  await guard(viewer, () => maximize(viewer, fromEl.getBoundingClientRect()));
}

document.getElementById('viewer-prev').addEventListener('click', () => step(-1));
document.getElementById('viewer-next').addEventListener('click', () => step(1));
vPlay.addEventListener('click', () => setPlaying(!playing));

// Tap / click the photo to maximize; swipe to browse
let swipeX = null;
vStage.addEventListener('pointerdown', (e) => { swipeX = e.clientX; });
vStage.addEventListener('pointerup', (e) => {
  if (swipeX === null) return;
  const dx = e.clientX - swipeX;
  swipeX = null;
  if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
  else if (!isMax(viewer)) guard(viewer, () => maximize(viewer));
});

document.addEventListener('keydown', (e) => {
  const maxed = document.querySelector('.window.maximized');
  if (e.key === 'Escape' && maxed) guard(maxed, () => unmaximize(maxed));
  const viewerActive = maxed === viewer || viewer.contains(document.activeElement);
  if (viewerActive && e.key === 'ArrowRight') step(1);
  if (viewerActive && e.key === 'ArrowLeft') step(-1);
});

tilesReady.then(() => {
  showPhoto(0, 1, false);
  setPlaying(true);
});

// Learn more: the tile zooms open to fill the screen, then the project page loads
document.querySelector('.tiles').addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="/projects/"]');
  if (!a || reduceMotion || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
  e.preventDefault();
  const r = a.closest('.tile').getBoundingClientRect();
  const ghost = document.createElement('div');
  ghost.className = 'zoom-ghost';
  Object.assign(ghost.style, { left: '0px', top: '0px', width: innerWidth + 'px', height: innerHeight + 'px' });
  document.body.append(ghost);
  const to = { left: 0, top: 0, width: innerWidth, height: innerHeight };
  ghost.animate([{ transform: flip(r, to) }, { transform: 'none' }], { duration: 260, easing: 'steps(5, end)', fill: 'forwards' })
    .finished.then(() => { location.href = a.href; });
});
// Coming back with the browser's Back button: clear the zoom box left from leaving
addEventListener('pageshow', () => document.querySelectorAll('.zoom-ghost').forEach((g) => g.remove()));

/* ---------- Sprite sheets: rabbit and raccoon ---------- */
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const BUN = { w: 22, h: 18, sit: [0, 1], hop: [2, 3, 4], graze: [5, 6], alert: 7, scratch: [8, 9], run: [10, 11, 12], flop: 13 };
const RAC = { w: 28, h: 25, run: [0, 1, 2], sniff: [3, 4], stand: 5, reach: 6, carry: [7, 8, 9], look: 10, wash: [11, 12] };
let bu = 3, ru = 3; // screen pixels per art pixel
function setSpriteScale() {
  const px = window.innerWidth / PX_W;
  bu = Math.max(2, Math.round(px * 0.6));
  ru = Math.max(2, Math.round(px * 0.75));
  document.documentElement.style.setProperty('--bu', bu + 'px');
  document.documentElement.style.setProperty('--ru', ru + 'px');
}
setSpriteScale();

/* ---------- Bunnies living on the hill ---------- */
const bunnies = [];
const tr = (p) => `translate(${p.x}px, ${p.y}px)`;
function groundPos(b) {
  const sx = window.innerWidth / PX_W, sy = window.innerHeight / sceneH;
  const x = Math.max(0, Math.min(PX_W - 1, Math.round(b.x)));
  return { x: b.x * sx - (BUN.w * bu) / 2, y: (sceneTops[x] + b.depth) * sy - BUN.h * bu };
}
function placeBunnies() { setSpriteScale(); bunnies.forEach((b) => { b.el.style.transform = tr(groundPos(b)); }); }
const bf = (b, f) => b.spr.style.setProperty('--f', f);
// a wait that ends early when the raccoon shows up
async function nap(b, ms) { const end = performance.now() + ms; while (performance.now() < end && !b.scared) await wait(100); }
async function hopOnce(b, dist, running) {
  const seq = running ? BUN.run : BUN.hop;
  let nx = b.x + b.dir * dist;
  if (nx < 8 || nx > PX_W - 8) { b.dir *= -1; nx = b.x + b.dir * dist; }
  b.spr.classList.toggle('flip', b.dir < 0);
  bf(b, seq[0]); await wait(running ? 70 : 150);
  const from = groundPos(b), old = b.x;
  b.x = (old + nx) / 2; const mid = groundPos(b);
  b.x = nx; const to = groundPos(b);
  mid.y -= (running ? 4 : 7) * window.innerWidth / PX_W;
  bf(b, seq[1]);
  const a = b.el.animate([{ transform: tr(from) }, { transform: tr(mid) }, { transform: tr(to) }], { duration: running ? 300 : 440, easing: 'steps(6, end)', fill: 'forwards' });
  await a.finished.catch(() => {});
  b.el.style.transform = tr(to); a.cancel();
  bf(b, seq[2]); await wait(running ? 60 : 160);
  bf(b, BUN.sit[0]);
}
async function bunnyLife(b) {
  for (;;) {
    if (b.scared) { // freeze, ears up, then bolt
      bf(b, BUN.alert); await wait(500 + Math.random() * 400);
      for (let i = 0; i < 5; i++) await hopOnce(b, 9 + Math.random() * 5, true);
      b.scared = false;
      continue;
    }
    const r = Math.random();
    if (r < 0.45) {
      const n = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n && !b.scared; i++) { await hopOnce(b, 5 + Math.random() * 6); await wait(120); }
      if (Math.random() < 0.25) b.dir *= -1;
    } else if (r < 0.72) { // graze
      const end = performance.now() + 2500 + Math.random() * 3500;
      while (performance.now() < end && !b.scared) { bf(b, BUN.graze[0]); await wait(280); bf(b, BUN.graze[1]); await wait(280); }
    } else if (r < 0.84) { // scratch an ear
      for (let i = 0; i < 6; i++) { bf(b, BUN.scratch[i % 2]); await wait(110); }
    } else if (r < 0.94) { // look around
      bf(b, BUN.alert); await nap(b, 1200 + Math.random() * 1200);
    } else { // flop over in the sun
      bf(b, BUN.flop); await nap(b, 4000 + Math.random() * 5000);
    }
    if (b.scared) continue;
    bf(b, BUN.sit[0]);
    const idle = 800 + Math.random() * 2400;
    await nap(b, idle * 0.6); bf(b, BUN.sit[1]); await wait(160); bf(b, BUN.sit[0]); await nap(b, idle * 0.4);
  }
}
(function makeBunnies() {
  const layer = document.getElementById('sky-layer');
  const count = window.innerWidth < 640 ? 2 : 4;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'bunny';
    el.innerHTML = '<div class="bunny-sprite"></div>';
    layer.appendChild(el);
    const b = { el, spr: el.firstChild, x: 20 + (i * (PX_W - 40)) / Math.max(1, count - 1) + Math.random() * 10, depth: 4 + Math.random() * 14, dir: Math.random() < 0.5 ? 1 : -1, scared: false };
    b.spr.classList.toggle('flip', b.dir < 0);
    bunnies.push(b);
  }
  placeBunnies();
  if (!reduceMotion) bunnies.forEach((b, i) => setTimeout(() => bunnyLife(b), 400 + i * 700));
})();

/* ---------- Notification balloon ---------- */
const balloon = document.getElementById('balloon');
let balloonTimer;
function showBalloon(title, body, ms = 6000) {
  document.getElementById('balloon-title').textContent = title;
  document.getElementById('balloon-body').textContent = body;
  balloon.hidden = false;
  run(balloon, [{ transform: 'translateY(14px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 220, easing: 'steps(3, end)' }).then((d) => d());
  clearTimeout(balloonTimer);
  balloonTimer = setTimeout(() => { balloon.hidden = true; }, ms);
}
document.getElementById('balloon-x').addEventListener('click', () => { balloon.hidden = true; });

/* ---------- Start button: slow auto-scroll tour ---------- */
const startBtn = document.querySelector('.start');
const startLabel = startBtn.querySelector('.start-label');
let tour = null;
function stopTour() {
  if (!tour) return;
  cancelAnimationFrame(tour.raf);
  tour = null;
  startLabel.textContent = 'start';
  startBtn.classList.remove('touring');
}
function startTour() {
  const maxed = document.querySelector('.window.maximized');
  if (maxed) unmaximize(maxed, false);
  if (reduceMotion) { document.getElementById('projects').scrollIntoView(); return; }
  window.scrollTo({ top: 0, behavior: 'instant' });
  const stops = ['projects', 'about', 'contact'].map((id) => document.getElementById(id).getBoundingClientRect().top + window.scrollY - 12);
  const end = document.documentElement.scrollHeight - window.innerHeight;
  const speed = Math.max(90, window.innerHeight * 0.15); // pixels per second
  let y = 0, next = 0, last = performance.now(), pauseUntil = last + 1500;
  tour = {};
  startLabel.textContent = 'stop';
  startBtn.classList.add('touring');
  showBalloon('Auto-tour', 'Sit back while the site scrolls itself. Scroll, tap, or press any key to take over.', 5000);
  const frame = (now) => {
    if (!tour) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (now >= pauseUntil) {
      y = Math.min(end, y + speed * dt);
      if (next < stops.length && y >= stops[next]) { y = Math.min(end, stops[next]); next++; pauseUntil = now + 2200; }
      window.scrollTo({ top: y, behavior: 'instant' });
      if (y >= end) { stopTour(); return; }
    }
    tour.raf = requestAnimationFrame(frame);
  };
  tour.raf = requestAnimationFrame(frame);
}
startBtn.addEventListener('click', (e) => { e.preventDefault(); tour ? stopTour() : startTour(); });
['wheel', 'touchstart', 'keydown'].forEach((ev) => window.addEventListener(ev, stopTour, { passive: true }));
window.addEventListener('pointerdown', (e) => { if (!e.target.closest('.start')) stopTour(); });

/* ---------- Shutdown transition into the blue screen ---------- */
const contactEl = document.getElementById('contact');
const boot = contactEl.querySelector('.boot');
let bootState = 'off';
async function typeLine(el, text, ms) {
  el.hidden = false;
  for (let i = 1; i <= text.length; i++) { el.textContent = text.slice(0, i); await wait(ms); }
}
async function bootBsod() {
  if (bootState !== 'off') return;
  bootState = 'running';
  if (reduceMotion) { contactEl.classList.add('booted'); bootState = 'done'; return; }
  const lines = [...boot.querySelectorAll('.boot-line')];
  const bar = boot.querySelector('.boot-bar'), fill = bar.firstElementChild, pct = boot.querySelector('.boot-pct');
  await wait(250);
  for (const l of lines.slice(0, -1)) {
    await typeLine(l, l.dataset.text, 22);
    await wait(140);
    l.textContent += ' done';
    await wait(120);
  }
  await typeLine(lines[lines.length - 1], lines[lines.length - 1].dataset.text, 22);
  bar.hidden = false; pct.hidden = false;
  for (let p = 0; p <= 99; p += 9) { fill.style.setProperty('--p', Math.min(p, 99)); pct.textContent = Math.min(p, 99) + '%'; await wait(90); }
  fill.style.setProperty('--p', 99); pct.textContent = '99%';
  await wait(600);                       // stuck at 99%...
  boot.classList.add('glitch');          // ...then it crashes
  await wait(450);
  boot.classList.remove('glitch');
  boot.classList.add('dark');
  await wait(220);
  boot.classList.add('crt');             // CRT flickers back on, blue
  await wait(560);
  contactEl.classList.add('booted');
  bootState = 'done';
}
// once the desktop is fully off screen, drop the hills so overscroll shows blue, not grass
const syncBsodBg = () => document.documentElement.classList.toggle('at-bsod', contactEl.getBoundingClientRect().top <= 1);
addEventListener('scroll', syncBsodBg, { passive: true });
addEventListener('resize', syncBsodBg);
syncBsodBg();
new IntersectionObserver((entries, obs) => {
  if (entries.some((e) => e.isIntersecting)) { obs.disconnect(); bootBsod(); }
}, { threshold: 0.3 }).observe(contactEl);

/* ---------- Easter egg: the raccoon in the Recycle Bin ---------- */
const raccoon = document.getElementById('raccoon');
const racSpr = raccoon.firstChild;
const rf = (f) => racSpr.style.setProperty('--f', f);
const bin = document.getElementById('recycle-bin');
const binSpr = bin.querySelector('.bin-sprite');
const binF = (f) => binSpr.style.setProperty('--f', f);
const clockWrap = document.getElementById('clock-wrap');
const raccoonLines = [
  ['Recycle Bin', 'Something in the Recycle Bin was alive. It has taken the clock. It will be returned eventually.'],
  ['Raccoon.exe', 'Raccoon is rummaging through your recycle bin. Do not attempt to make eye contact.'],
  ['Raccoon.exe', 'Raccoon has borrowed the clock again. Time is a social construct anyway.'],
  ['Raccoon.exe', 'Raccoon would like you to know it has been here the whole time.']
];
const racGround = () => Math.min(document.querySelector('.taskbar').getBoundingClientRect().top, window.innerHeight) - RAC.h * ru + ru;
const racStop = () => { const cr = clockWrap.getBoundingClientRect(); return cr.width ? cr.left - RAC.w * ru * 0.6 : window.innerWidth - RAC.w * ru - 40; };
// run in a straight line, cycling the given frames, in choppy pixel steps
async function racRun(x0, x1, y, speed, frames) {
  raccoon.classList.toggle('left', x1 < x0);
  let i = 0; rf(frames[0]);
  const iv = setInterval(() => rf(frames[++i % frames.length]), 100);
  const dur = Math.abs(x1 - x0) / speed * 1000;
  const done = await run(raccoon, [{ transform: tr({ x: x0, y }) }, { transform: tr({ x: x1, y }) }], { duration: dur, easing: `steps(${Math.max(4, Math.round(dur / 60))}, end)` });
  clearInterval(iv);
  raccoon.style.transform = tr({ x: x1, y });
  done();
}
async function cycle(frames, times, ms) { for (let i = 0; i < times; i++) { rf(frames[i % frames.length]); await wait(ms); } }

let raccoonCount = 0, raccoonBusy = false;
let racX = 0, racGY = 0; // where the raccoon is while it's out
// rattle, peek, pop up, then leap out of the bin to the right and land on the taskbar
async function racLeapOut(peek, pop) {
  binF(1); await wait(peek); binF(2); await wait(pop);
  const br = binSpr.getBoundingClientRect();
  const w = RAC.w * ru, h = RAC.h * ru;
  const gy = racGround();
  const start = { x: br.left + br.width / 2 - w / 2, y: br.top - h * 0.3 };
  const land = { x: Math.min(start.x + Math.max(90, w * 1.4), window.innerWidth - w), y: gy };
  binF(0);
  raccoon.classList.remove('left'); rf(RAC.run[1]);
  raccoon.style.transform = tr(start);
  raccoon.hidden = false;
  bunnies.forEach((b) => { b.scared = true; });
  const done = await run(raccoon, [{ transform: tr(start) }, { transform: tr({ x: (start.x + land.x) / 2, y: Math.min(start.y, gy) - 60 }) }, { transform: tr(land) }], { duration: 560, easing: 'steps(8, end)' });
  done();
  raccoon.style.transform = tr(land);
  rf(RAC.run[2]); await wait(140);
  racX = land.x; racGY = gy;
  return land;
}
// run back and hop into the bin (or off the left edge if the bin is scrolled away)
async function racGoHome(fromX, gy) {
  const w = RAC.w * ru, h = RAC.h * ru;
  const br = binSpr.getBoundingClientRect();
  if (br.bottom > 0 && br.top < window.innerHeight) {
    const binX = br.left + br.width / 2 - w / 2;
    const hopFrom = binX + Math.max(90, w * 1.4);
    await racRun(fromX, hopFrom, gy, 360, RAC.run);
    raccoon.classList.add('left'); rf(RAC.run[1]);
    const into = { x: binX, y: br.top - h * 0.3 };
    const done = await run(raccoon, [{ transform: tr({ x: hopFrom, y: gy }) }, { transform: tr({ x: (hopFrom + binX) / 2, y: Math.min(into.y, gy) - 60 }) }, { transform: tr(into) }], { duration: 520, easing: 'steps(8, end)' });
    raccoon.hidden = true;
    done();
    binF(2); await wait(250); binF(1); await wait(600); binF(0);
  } else {
    await racRun(fromX, -w - 20, gy, 360, RAC.run);
    raccoon.hidden = true;
  }
}

bin.addEventListener('click', async () => {
  if (raccoonBusy) return;
  raccoonBusy = true;
  const [title, body] = raccoonLines[raccoonCount++ % raccoonLines.length];
  bin.classList.remove('rattle'); void bin.offsetWidth; bin.classList.add('rattle');
  if (reduceMotion) { showBalloon(title, body); raccoonBusy = false; return; }
  await wait(500);
  bin.classList.remove('rattle');
  // 1-2. peek out, pop up, leap out to the right
  const land = await racLeapOut(800, 900);
  const gy = land.y, stopX = racStop();
  // 3. run along the taskbar to the clock, sniff it, grab it
  await racRun(land.x, stopX, gy, 330, RAC.run);
  raccoon.classList.remove('left');
  await cycle(RAC.sniff, 6, 200);
  rf(RAC.stand); await wait(350);
  rf(RAC.reach); await wait(450);
  clockStolen = true;
  clock.textContent = '--:--';
  clockWrap.classList.add('stolen');
  raccoon.classList.add('carrying');
  rf(RAC.carry[0]); await wait(250);
  // 4. make off with it to the right
  await racRun(stopX, window.innerWidth + 20, gy, 360, RAC.carry);
  raccoon.hidden = true;
  raccoon.classList.remove('carrying');
  showBalloon(title, body, 6000);
  // 5. lie low for a bit, then wander through the bunnies on the far hill with the clock
  await wait(2500);
  await racBackground();
  await wait(1500);
  await returnClock();
  raccoonBusy = false;
});

// far away on the hill: same pixel size as the bunnies, walking on the hill line like they do
const bgRac = document.createElement('div');
bgRac.className = 'raccoon carrying bg-rac';
bgRac.hidden = true;
bgRac.innerHTML = '<div class="raccoon-sprite"></div>';
document.getElementById('sky-layer').appendChild(bgRac);
const bgf = (f) => bgRac.firstChild.style.setProperty('--f', f);
let bgBusy = false;
async function racBackground({ carry = true, dir = 1 } = {}) {
  if (document.documentElement.classList.contains('at-bsod')) { await wait(4000); return; }
  while (bgBusy) await wait(200);
  bgBusy = true;
  const frames = carry ? RAC.carry : RAC.run;
  bgRac.classList.toggle('carrying', carry);
  const DEPTH = 17;
  const place = (x) => {
    const u = bu, sx = window.innerWidth / PX_W, sy = window.innerHeight / sceneH;
    const xi = Math.max(0, Math.min(PX_W - 1, Math.round(x)));
    bgRac.style.setProperty('--ru', u + 'px');
    bgRac.style.transform = tr({ x: x * sx - (RAC.w * u) / 2, y: (sceneTops[xi] + DEPTH) * sy - RAC.h * u + u });
  };
  const SPEED = 34;                       // scene px per second: a slow, sneaky crawl
  const pauseAt = PX_W * (0.35 + Math.random() * 0.2);
  const back = dir < 0;
  let x = back ? PX_W + 16 : -16, t = 0, paused = false;
  bgRac.classList.toggle('left', back);
  place(x); bgf(frames[0]);
  bgRac.hidden = false;
  while (back ? x > -16 : x < PX_W + 16) {
    if (!paused && (back ? x <= PX_W - pauseAt : x >= pauseAt)) {
      // stop and look around (sniffing the grass if it has nothing in its mouth)
      paused = true;
      bgf(carry ? frames[0] : RAC.sniff[0]); await wait(700);
      bgRac.classList.toggle('left', !back); if (!carry) bgf(RAC.sniff[1]); await wait(800);
      bgRac.classList.toggle('left', back); await wait(600);
    }
    x += dir * SPEED * 0.08; t++;
    if (t % 2 === 0) bgf(frames[(t / 2) % 3]);
    place(x);
    // bunnies it gets close to bolt away from it
    bunnies.forEach((b) => {
      if (!b.racSeen && Math.abs(b.x - x) < 26) { b.racSeen = true; b.dir = b.x >= x ? 1 : -1; b.scared = true; }
    });
    await wait(80);
  }
  bgRac.hidden = true;
  bunnies.forEach((b) => { b.racSeen = false; });
  bgBusy = false;
}

/* ---------- Screensaver: fullscreen hills, the raccoon wanders past every 3-5 minutes ---------- */
const saverBtn = document.getElementById('saver-btn');
const saverHint = document.getElementById('saver-hint');
let saverOn = false, saverTimer = null, hintTimer = null;
function saverSchedule(first) {
  clearTimeout(saverTimer);
  saverTimer = setTimeout(async () => {
    if (!saverOn) return;
    await racBackground({ carry: false, dir: Math.random() < 0.5 ? 1 : -1 });
    if (saverOn) saverSchedule();
  }, first ? 20000 : (180 + Math.random() * 120) * 1000);
}
function startSaver() {
  saverOn = true;
  saverBtn.blur();
  saverBtn.setAttribute('aria-label', 'Exit screensaver');
  saverBtn.title = 'Exit screensaver';
  window.scrollTo({ top: 0, behavior: 'instant' });
  document.documentElement.classList.add('screensaver');
  document.documentElement.requestFullscreen?.().catch(() => {});
  saverHint.hidden = false;
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => { saverHint.hidden = true; }, 3500);
  if (!reduceMotion) saverSchedule(true); // first visit after 20s, then every 3-5 minutes
}
function stopSaver() {
  if (!saverOn) return;
  saverOn = false;
  clearTimeout(saverTimer); clearTimeout(hintTimer);
  saverHint.hidden = true;
  saverBtn.setAttribute('aria-label', 'Start screensaver');
  saverBtn.title = 'Screensaver';
  document.documentElement.classList.remove('screensaver');
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
}
saverBtn.addEventListener('click', () => (saverOn ? stopSaver() : startSaver()));
// the other taskbar buttons still work: they bring the site back first
document.querySelector('.taskbar').addEventListener('click', (e) => {
  if (saverOn && e.target.closest('a, button') && !e.target.closest('#saver-btn')) stopSaver();
}, true);
// Esc in fullscreen is eaten by the browser, so watch for fullscreen ending too
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) stopSaver(); });

// the raccoon brings the clock back, cleans its paws, and goes home to the bin
async function returnClock() {
  const W = window.innerWidth;
  const gy = racGround(), stopX = racStop();
  raccoon.classList.add('carrying');
  raccoon.hidden = false;
  await racRun(W + 20, stopX, gy, 300, RAC.carry);
  raccoon.classList.remove('left');
  rf(RAC.stand); await wait(300);
  rf(RAC.reach);
  raccoon.classList.remove('carrying');
  clockStolen = false;
  tick();
  clockWrap.classList.remove('stolen', 'returned');
  void clockWrap.offsetWidth;
  clockWrap.classList.add('returned');
  setTimeout(() => clockWrap.classList.remove('returned'), 1700);
  await wait(600);
  await cycle(RAC.wash, 8, 170);
  rf(RAC.look); await wait(900);
  await racGoHome(stopX, gy);
  showBalloon('Raccoon.exe', 'The clock has been returned. It is slightly sticky.', 4000);
}

/* ---------- Fruit files: drag one around and the raccoon comes out for it ---------- */
const fruitLines = {
  apple: 'Raccoon ate Apple, core and all. A fresh one has been restored from backup.',
  banana: 'Raccoon ate Banana. The peel was also eaten. A fresh one has been restored from backup.'
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// paw (reach frame) and mouth (wash frames) points, in screen px, mirrored when facing left
const racPoint = (ax, ay) => ({ x: racX + (raccoon.classList.contains('left') ? RAC.w - ax : ax) * ru, y: racGY + ay * ru });
const racPaw = () => racPoint(22.5, 10);
const racMouth = () => racPoint(19.5, 13.5);
// move the dragged fruit so its centre sits at (cx, cy), scaled by k
async function fruitTo(st, cx, cy, k, dur) {
  const x = cx - st.S / 2, y = cy - st.S / 2, to = `translate(${x}px, ${y}px) scale(${k})`;
  if (dur) {
    const done = await run(st.ghost, [{ transform: st.ghost.style.transform }, { transform: to }], { duration: dur, easing: `steps(${Math.max(3, Math.round(dur / 50))}, end)` });
    st.ghost.style.transform = to; done();
  } else st.ghost.style.transform = to;
  Object.assign(st, { x, y, k });
}
function beginFruit(st) {
  st.el.classList.add('taken');
  const g = document.createElement('div');
  g.className = 'fruit-ghost';
  g.innerHTML = `<span class="fruit-sprite" style="--f:${st.el.dataset.f};--bn:${st.S / 24}px"></span>`;
  g.style.transform = `translate(${st.x}px, ${st.y}px)`;
  document.body.appendChild(g);
  st.ghost = g; st.k = 1;
  if (raccoonBusy || reduceMotion) return;
  raccoonBusy = true;
  bin.classList.remove('rattle'); void bin.offsetWidth; bin.classList.add('rattle');
  st.summon = racLeapOut(350, 300).then(() => { bin.classList.remove('rattle'); if (!st.dropped) followFruit(st); });
}
// while the fruit is held up, the raccoon trails it along the taskbar and begs with its paws up
function followFruit(st) {
  let t = 0;
  st.follow = setInterval(() => {
    const w = RAC.w * ru, d = clamp(st.x + st.S / 2 - w / 2, 0, window.innerWidth - w) - racX;
    t++;
    if (Math.abs(d) > 6) {
      raccoon.classList.toggle('left', d < 0);
      racX += Math.sign(d) * Math.min(Math.abs(d), 22 * ru / 3);
      if (t % 2 === 0) rf(RAC.run[(t / 2) % 3]);
    } else {
      rf(Math.floor(t / 5) % 2 ? RAC.stand : RAC.reach);
    }
    raccoon.style.transform = tr({ x: racX, y: racGY });
  }, 60);
}
async function fruitHome(st) {
  const r = st.el.querySelector('.fruit-sprite').getBoundingClientRect();
  await fruitTo(st, r.left + r.width / 2, r.top + r.height / 2, 1, 260);
  st.ghost.remove();
  st.el.classList.remove('taken');
}
async function dropFruit(st) {
  st.dropped = true;
  if (!st.summon) {
    await fruitHome(st);
    if (reduceMotion) showBalloon('Raccoon.exe', 'Something in the Recycle Bin is very interested in that ' + st.el.dataset.fruit + '.', 4000);
    else { st.el.classList.remove('nope'); void st.el.offsetWidth; st.el.classList.add('nope'); setTimeout(() => st.el.classList.remove('nope'), 500); }
    return;
  }
  await st.summon;
  clearInterval(st.follow);
  const w = RAC.w * ru, h = RAC.h * ru, gy = racGY;
  const k = 11 * ru / st.S;
  const cx = st.x + st.S / 2, cy = st.y + st.S / 2;
  const paw = racPaw();
  if (Math.abs(cx - paw.x) < w * 0.45 && cy < paw.y) {
    // 1a. caught it, right in the paws
    rf(RAC.reach);
    await fruitTo(st, paw.x, paw.y - 3 * ru, k, clamp((paw.y - cy) * 1.2, 150, 450));
  } else {
    // 1b. it falls to the grass; the raccoon trots over, sniffs it, and scoops it up
    const fx = clamp(cx, w / 2, window.innerWidth - w / 2);
    const fy = gy + h - ru - st.S * k / 2;
    await fruitTo(st, fx, fy, k, clamp(Math.abs(fy - cy) * 1.1, 150, 500));
    await fruitTo(st, fx, fy - 2 * ru, k, 90);
    await fruitTo(st, fx, fy, k, 90);
    const tx = fx > racX + w / 2 ? fx - 25 * ru : fx - 3 * ru;
    await racRun(racX, tx, gy, 330, RAC.run);
    racX = tx;
    await cycle(RAC.sniff, 4, 180);
    rf(RAC.reach);
    const p = racPaw();
    await fruitTo(st, p.x, p.y - 3 * ru, k, 200);
  }
  // 2. hold it up, then eat it in four bites
  st.el.classList.remove('taken');
  st.el.classList.add('eaten');
  await wait(550);
  const m = racMouth();
  for (let i = 0; i < 4; i++) {
    await fruitTo(st, m.x, m.y, k * (1 - i * 0.24), 0);
    await cycle(RAC.wash, 4, 150);
  }
  st.ghost.remove();
  rf(RAC.look); await wait(700);
  showBalloon('Raccoon.exe', fruitLines[st.el.dataset.fruit], 5000);
  // 3. home to the bin, and the fruit file restores itself
  await racGoHome(racX, gy);
  st.el.classList.remove('eaten');
  st.el.classList.add('respawn');
  setTimeout(() => st.el.classList.remove('respawn'), 600);
  raccoonBusy = false;
}
document.querySelectorAll('.fruit-file').forEach((el) => {
  el.draggable = false;
  let dragged = false;
  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || el.classList.contains('taken') || el.classList.contains('eaten')) return;
    const r = el.querySelector('.fruit-sprite').getBoundingClientRect();
    const st = { el, S: r.width, x: r.left, y: r.top, ox: e.clientX - r.left, oy: e.clientY - r.top, x0: e.clientX, y0: e.clientY, started: false };
    dragged = false;
    el.setPointerCapture(e.pointerId);
    const move = (ev) => {
      if (!st.started) {
        if (Math.hypot(ev.clientX - st.x0, ev.clientY - st.y0) < 6) return;
        st.started = dragged = true;
        beginFruit(st);
      }
      st.x = ev.clientX - st.ox; st.y = ev.clientY - st.oy;
      st.ghost.style.transform = `translate(${st.x}px, ${st.y}px)`;
    };
    const up = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      if (st.started) dropFruit(st);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  });
  // a plain click or Enter tosses the fruit out next to the bin
  el.addEventListener('click', () => {
    if (dragged) { dragged = false; return; }
    if (el.classList.contains('taken') || el.classList.contains('eaten')) return;
    const r = el.querySelector('.fruit-sprite').getBoundingClientRect();
    const st = { el, S: r.width, x: r.left, y: r.top };
    beginFruit(st);
    dropFruit(st);
  });
});
