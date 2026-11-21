/* Home page: tabs, search, one period slider, topic filter, timeline, map. Data comes inline (#eps-data). */
(function () {
  'use strict';
  var D = JSON.parse(document.getElementById('eps-data').textContent);
  var EP = D.episodes, MIN = D.min, MAX = D.max;
  var TABS = ['episodes', 'timeline', 'map', 'topics', 'production'];
  var state = { q: '', from: MIN, to: MAX, topic: '' };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function fmt(y) { return y < 0 ? (-y) + ' B.C.' : y === 0 ? '0' : 'A.D. ' + y; }
  function span(a, b) { return a === b ? fmt(a) : fmt(a) + ' – ' + fmt(b); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function norm(s) { return (s || '').toLowerCase(); }

  EP.forEach(function (e) {
    e._t = norm(e.title + ' ' + e.summary + ' ' + e.tags.join(' ') + ' ' + e.places.map(function (p) { return p.name; }).join(' '));
  });
  function match(e) {
    if (state.q && e._t.indexOf(norm(state.q)) < 0) return false;
    if (e.ye < state.from || e.ys > state.to) return false;
    if (state.topic && e.tagSlugs.indexOf(state.topic) < 0) return false;
    return true;
  }

  /* ---------- period slider (one control, two handles) ---------- */
  var rf = $('#from'), rt = $('#to'), rng = $('.range'), STEP = 10;
  rf.min = rt.min = MIN; rf.max = rt.max = MAX; rf.step = rt.step = STEP;
  function pct(y) { return (y - MIN) / (MAX - MIN); }
  function drawSlider() {
    rf.value = state.from; rt.value = state.to;
    rng.style.setProperty('--p1', pct(state.from)); rng.style.setProperty('--p2', pct(state.to));
    rf.style.zIndex = state.from > (MIN + MAX) / 2 ? 3 : 2; rt.style.zIndex = 2;
    $('#pv').textContent = span(state.from, state.to);
    $$('#hist i').forEach(function (b) { b.classList.toggle('on', +b.dataset.hi >= state.from && +b.dataset.lo <= state.to); });
    $$('.presets .chip[data-from]').forEach(function (c) { c.setAttribute('aria-pressed', +c.dataset.from === state.from && +c.dataset.to === state.to); });
  }
  (function buildHistAndTicks() {
    var N = 40, w = (MAX - MIN) / N, h = $('#hist'), counts = [], mx = 1, i;
    for (i = 0; i < N; i++) {
      var lo = MIN + i * w, hi = lo + w, c = EP.filter(function (e) { return e.ye >= lo && e.ys < hi; }).length;
      counts.push([lo, hi, c]); mx = Math.max(mx, c);
    }
    counts.forEach(function (b) {
      var s = document.createElement('i'); s.style.height = (b[2] ? 14 + 86 * b[2] / mx : 0) + '%'; if (!b[2]) s.style.height = '2px';
      s.dataset.lo = b[0]; s.dataset.hi = b[1]; h.appendChild(s);
    });
    var nice = [50, 100, 200, 250, 500, 1000], step = nice[nice.length - 1];
    for (i = 0; i < nice.length; i++) if ((MAX - MIN) / nice[i] <= 7) { step = nice[i]; break; }
    var t = $('#ticks');
    for (var y = Math.ceil(MIN / step) * step; y <= MAX; y += step) {
      var s = el('span', null, y === 0 ? '0' : y < 0 ? (-y) + ' B.C.' : String(y)); s.style.left = (pct(y) * 100) + '%'; t.appendChild(s);
    }
  })();
  rf.addEventListener('input', function () { state.from = Math.min(+rf.value, state.to - STEP); update(); });
  rt.addEventListener('input', function () { state.to = Math.max(+rt.value, state.from + STEP); update(); });
  $$('.presets .chip[data-from]').forEach(function (c) {
    c.addEventListener('click', function () { state.from = +c.dataset.from; state.to = +c.dataset.to; update(); });
  });

  /* ---------- search and topic ---------- */
  var q = $('#q');
  q.addEventListener('input', function () { state.q = q.value.trim(); update(); });
  function setTopic(s) { state.topic = state.topic === s ? '' : s; update(); }
  function drawTopics() {
    var bar = $('#topicbar'); $$('.chip', bar).forEach(function (c) { c.remove(); });
    var shown = D.topics.filter(function (t) { return t.n >= 2; }).slice(0, 8);
    if (state.topic && !shown.some(function (t) { return t.slug === state.topic; })) {
      var cur = D.topics.filter(function (t) { return t.slug === state.topic; })[0]; if (cur) shown.push(cur);
    }
    shown.forEach(function (t) {
      var b = el('button', 'chip', t.name); b.type = 'button'; b.setAttribute('aria-pressed', state.topic === t.slug);
      b.addEventListener('click', function () { setTopic(t.slug); }); bar.appendChild(b);
    });
    var m = el('button', 'chip more', 'All ' + D.topics.length + ' topics →'); m.type = 'button';
    m.addEventListener('click', function () { go('topics'); }); bar.appendChild(m);
  }

  /* ---------- views ---------- */
  var cards = $$('#cards .card');
  function drawCards(list) {
    var ok = {}; list.forEach(function (e) { ok[e.slug] = 1; });
    cards.forEach(function (c) { c.hidden = !ok[c.dataset.slug]; });
    $('#none').hidden = list.length > 0;
    $('#count').textContent = list.length === EP.length ? 'All ' + EP.length + ' episodes' : list.length + ' of ' + EP.length + ' episodes';
    $('#reset').hidden = list.length === EP.length && !state.q && !state.topic && state.from === MIN && state.to === MAX;
  }
  function eraOf(y) { return y < 500 ? 'Antiquity' : y < 1500 ? 'The Middle Ages' : 'The Early Modern World'; }
  function drawTimeline(list) {
    var box = $('#tl'); box.innerHTML = '';
    var sorted = list.slice().sort(function (a, b) { return a.ys - b.ys || a.ye - b.ye; }), last = '', side = 0;
    sorted.forEach(function (e) {
      var era = eraOf(e.ys);
      if (era !== last) { var h = el('div', 'tl-era'); h.appendChild(el('span', null, era)); box.appendChild(h); last = era; }
      var it = el('div', 'tl-item ' + (side++ % 2 ? 'l' : 'r'));
      var y = el('div', 'tl-year'); y.appendChild(el('b', null, fmt(e.ys))); y.appendChild(el('span', null, e.ye !== e.ys ? 'to ' + fmt(e.ye) : ''));
      var a = el('a', 'tl-card'); a.href = e.slug + '/';
      var im = el('div', 'im'), img = new Image(); img.alt = ''; img.loading = 'lazy'; img.src = e.slug + '/thumb-sm.jpg'; im.appendChild(img); a.appendChild(im);
      var tx = el('div', 'txt'); tx.appendChild(el('h3', null, e.title)); tx.appendChild(el('p', null, e.summary)); a.appendChild(tx);
      it.appendChild(y); it.appendChild(a); box.appendChild(it);
    });
    $('#tl-none').hidden = list.length > 0; box.hidden = !list.length;
  }

  var L = window.L, maps = {}, lastList = EP;
  function initMap(id) {
    if (maps[id] || !L || !$('#' + id)) return maps[id];
    var m = L.map(id, { scrollWheelZoom: false, worldCopyJump: true }).setView([46, 12], 4);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 12, attribution: '&copy; OpenStreetMap contributors' }).addTo(m);
    m.on('focus', function () { m.scrollWheelZoom.enable(); }); m.on('blur', function () { m.scrollWheelZoom.disable(); });
    return (maps[id] = { map: m, layer: L.layerGroup().addTo(m) });
  }
  function drawMapOn(id, list) {
    var M = initMap(id); if (!M) return;
    M.layer.clearLayers(); var b = [];
    list.forEach(function (e) {
      e.places.forEach(function (p) {
        var s = p.role === 'setting', sz = s ? 18 : 12;
        var m = L.marker([p.lat, p.lon], { icon: L.divIcon({ className: '', html: '<span class="pin' + (s ? ' s' : '') + '"></span>', iconSize: [sz, sz], iconAnchor: [sz / 2, sz / 2] }), title: p.name }).addTo(M.layer);
        var d = el('div'); d.appendChild(el('b', null, p.name));
        d.appendChild(el('span', null, (p.year != null ? fmt(p.year) + ': ' : '') + (p.note || ''))); d.appendChild(document.createElement('br'));
        var l = el('a', null, e.title + ' \u2192'); l.href = e.slug + '/'; d.appendChild(l); m.bindPopup(d, { maxWidth: 300 });
        b.push([p.lat, p.lon]);
      });
    });
    if (b.length) M.map.fitBounds(b, { padding: [40, 40], maxZoom: 6 });
    return b.length;
  }
  function drawMap(list) {
    lastList = list;
    var tab = document.body.dataset.tab;
    if (tab === 'episodes') drawMapOn('map-home', list);
    if (tab === 'map') { var n = drawMapOn('map', list); $('#map-none').hidden = n > 0; }
    $('.homemap').hidden = !list.some(function (e) { return e.places.length; });
  }

  /* ---------- state, URL, tabs ---------- */
  function sync() {
    var p = new URLSearchParams();
    if (state.q) p.set('q', state.q); if (state.from > MIN) p.set('from', state.from); if (state.to < MAX) p.set('to', state.to); if (state.topic) p.set('topic', state.topic);
    try { history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : '') + location.hash); } catch (e) { /* file:// */ }
  }
  function update() {
    var list = EP.filter(match);
    drawSlider(); drawTopics(); drawCards(list); drawTimeline(list); drawMap(list); sync();
  }
  var tabs = $$('nav.tabs a'), panels = {};
  TABS.forEach(function (t) { panels[t] = $('#p-' + t); });
  function go(tab, noscroll) {
    if (TABS.indexOf(tab) < 0) tab = 'episodes';
    document.body.dataset.tab = tab;
    TABS.forEach(function (t) { panels[t].classList.toggle('on', t === tab); });
    tabs.forEach(function (a) { var on = a.dataset.tab === tab; a.setAttribute('aria-selected', on); a.tabIndex = on ? 0 : -1; });
    drawMap(lastList);
    setTimeout(function () { Object.keys(maps).forEach(function (k) { maps[k].map.invalidateSize(); }); }, 80);
    if (history.replaceState) { try { history.replaceState(null, '', location.pathname + location.search + '#' + tab); } catch (e) { /* ignore */ } }
    if (!noscroll && window.scrollY > 120) window.scrollTo({ top: 0 });
  }
  tabs.forEach(function (a, i) {
    a.addEventListener('click', function (ev) { ev.preventDefault(); go(a.dataset.tab); });
    a.addEventListener('keydown', function (ev) {
      var k = ev.key === 'ArrowRight' ? 1 : ev.key === 'ArrowLeft' ? -1 : 0; if (!k) return;
      var n = tabs[(i + k + tabs.length) % tabs.length]; n.focus(); go(n.dataset.tab); ev.preventDefault();
    });
  });
  window.addEventListener('hashchange', function () { go(location.hash.slice(1), true); });
  $('#reset').addEventListener('click', function () { state = { q: '', from: MIN, to: MAX, topic: '' }; q.value = ''; update(); });
  $$('[data-go]').forEach(function (a) { a.addEventListener('click', function (ev) { ev.preventDefault(); go(a.dataset.go); }); });

  /* ---------- topics tab: type to filter ---------- */
  var tq = $('#tq');
  function filterTopics() {
    var v = norm(tq.value.trim());
    $$('.topic-row').forEach(function (r) { r.hidden = !!v && norm(r.textContent).indexOf(v) < 0; });
    $$('.az-grp').forEach(function (g) {
      var any = false; $$('a', g).forEach(function (a) { var h = !!v && norm(a.textContent).indexOf(v) < 0; a.hidden = h; if (!h) any = true; });
      g.hidden = !any;
    });
    if (v) { var d = $('#az'); d.open = true; }
  }
  if (tq) tq.addEventListener('input', filterTopics);

  /* ---------- start ---------- */
  var u = new URLSearchParams(location.search);
  if (u.get('q')) { state.q = u.get('q'); q.value = state.q; }
  if (u.get('from')) state.from = Math.max(MIN, +u.get('from')); if (u.get('to')) state.to = Math.min(MAX, +u.get('to'));
  state.topic = u.get('topic') || u.get('tag') || '';
  document.body.classList.add('js');
  update(); go(location.hash.slice(1), true);
  document.addEventListener('themechange', function () { setTimeout(function () { Object.keys(maps).forEach(function (k) { maps[k].map.invalidateSize(); }); }, 50); });
})();
