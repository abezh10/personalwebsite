/* Shared behavior for every projects/*.html page:
   - photos are shown full size, top to bottom (see .photos in styles.css)
   - each video plays once when it scrolls into view, then shows its first frame (poster)
   - ✕, "Back to projects" and Esc return to the desktop, where you left it */
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HOME = '/#projects';

  // ---------- Back to the desktop ----------
  // Came here from the desktop? Step back in history so it reopens scrolled to the same tile.
  function cameFromDesktop() {
    try {
      const ref = new URL(document.referrer);
      return ref.origin === location.origin && (ref.pathname === '/' || ref.pathname === '/index.html') && history.length > 1;
    } catch (_) { return false; }
  }
  function goHome(e) {
    if (e) e.preventDefault();
    if (cameFromDesktop()) history.back();
    else location.href = HOME;
  }
  document.querySelectorAll('[data-home]').forEach((a) => a.addEventListener('click', goHome));

  // ---------- Pending photo: swaps in once the file exists in /media ----------
  document.querySelectorAll('.placeholder[data-src]').forEach((ph) => {
    const img = new Image();
    img.onload = () => {
      img.alt = ph.dataset.alt || '';
      img.style.setProperty('--r', img.naturalWidth / img.naturalHeight);
      ph.replaceWith(img);
    };
    img.src = ph.dataset.src;
  });

  // ---------- Videos: play once while on screen, then back to the poster ----------
  const seen = new IntersectionObserver((entries) => entries.forEach((e) => {
    const v = e.target;
    if (e.isIntersecting && !v._done && !reduceMotion) v.play().catch(() => {});
    else if (!e.isIntersecting) v.pause();
  }), { threshold: 0.5 });
  document.querySelectorAll('video.play-once').forEach((v) => {
    v.addEventListener('ended', () => { v._done = true; v.load(); });
    seen.observe(v);
  });

  // Esc goes back to the desktop
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') goHome(e);
  });
})();
