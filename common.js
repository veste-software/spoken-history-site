/* every page: theme toggle, reading progress */
(function () {
  'use strict';
  var root = document.documentElement;
  function stored() { try { return localStorage.getItem('sh-theme'); } catch (e) { return null; } }
  function store(v) { try { localStorage.setItem('sh-theme', v); } catch (e) { /* private mode */ } }
  function current() {
    var t = root.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  var btn = document.getElementById('theme');
  if (btn) btn.addEventListener('click', function () {
    var n = current() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', n); store(n);
    document.dispatchEvent(new CustomEvent('themechange', { detail: n }));
  });
  var bar = document.getElementById('prog'), art = document.querySelector('.article');
  if (bar && art) {
    var tick = false;
    function upd() {
      var r = art.getBoundingClientRect(), h = art.offsetHeight - window.innerHeight * 0.5;
      var p = Math.max(0, Math.min(1, (-r.top + window.innerHeight * 0.2) / Math.max(1, h)));
      bar.style.width = (p * 100).toFixed(1) + '%'; tick = false;
    }
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }
})();
/* click-to-load YouTube: swap the thumbnail for the player when the visitor presses play (nothing from YouTube loads before that) */
(function () {
  document.addEventListener('click', function (ev) {
    var box = ev.target.closest && ev.target.closest('.lite');
    if (!box || box.querySelector('iframe')) return;
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + box.getAttribute('data-vid') + '?autoplay=1&rel=0';
    f.title = box.getAttribute('data-title') || 'Video';
    f.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture'; f.allowFullscreen = true;
    box.innerHTML = ''; box.appendChild(f);
  });
})();
