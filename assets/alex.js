/* 🌌 A.L.E.X. design system — behaviour shared by alex-desk-public and every PIR® desk portal.
   Nothing here talks to a server: no analytics, no cookies, no questions leave the browser.
   Pages may set window.ALEX_PALETTE (extra palette items) and window.ALEX_LAB (demo scenarios) before loading. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  /* theme (shared key with the PIR hub) */
  function setTheme(t) { root.dataset.theme = t; try { localStorage.setItem('pir-theme', t); } catch (e) {} }
  $$('[data-theme-toggle]').forEach(function (b) {
    b.addEventListener('click', function () { setTheme(root.dataset.theme === 'light' ? 'dark' : 'light'); });
  });

  /* toast */
  var toast = document.createElement('div'); toast.className = 'toast'; toast.setAttribute('role', 'status'); document.body.appendChild(toast);
  var tt; function say(msg) { toast.textContent = msg; toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(function () { toast.classList.remove('show'); }, 1800); }

  /* copy chips */
  function copy(text, el) {
    var done = function () { if (el) { el.classList.add('copied'); var cp = el.querySelector('.cp'); if (cp) { cp.textContent = 'copied'; setTimeout(function () { cp.textContent = 'copy'; el.classList.remove('copied'); }, 1600); } } say('Copied ' + text + '. Paste it in PIR\'s Discord'); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, done); else done();
  }
  $$('.chip[data-copy]').forEach(function (c) { c.addEventListener('click', function () { copy(c.dataset.copy, c); }); });

  /* neural-nexus starfield: stars drift; constellations form near the pointer */
  var cv = $('#nexus');
  if (cv && cv.getContext) {
    var cx = cv.getContext('2d'), W, H, dpr = Math.min(window.devicePixelRatio || 1, 2), stars = [], px = -1e4, py = -1e4;
    var size = function () {
      W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr; cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
      var n = Math.min(260, Math.round(innerWidth * innerHeight / 7000)); stars = [];
      for (var i = 0; i < n; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .06 * dpr, vy: (Math.random() - .5) * .06 * dpr, r: (Math.random() * 1.25 + .25) * dpr, p: Math.random() * 6.28, c: i % 9 === 0 ? 2 : i % 6 === 0 ? 1 : 0 });
    };
    addEventListener('pointermove', function (e) { px = e.clientX * dpr; py = e.clientY * dpr; }, { passive: true });
    addEventListener('pointerleave', function () { px = py = -1e4; });
    var palettes = { dark: ['255,255,255', '180,140,255', '111,227,255'], light: ['91,56,190', '107,63,209', '15,127,168'] };
    var draw = function (t) {
      var light = root.dataset.theme === 'light', col = palettes[light ? 'light' : 'dark'], reach = 150 * dpr;
      cx.clearRect(0, 0, W, H);
      var near = [];
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        if (!reduce) { s.x += s.vx; s.y += s.vy; if (s.x < 0) s.x = W; if (s.x > W) s.x = 0; if (s.y < 0) s.y = H; if (s.y > H) s.y = 0; }
        var a = (.35 + .65 * Math.abs(Math.sin(s.p + t * .00045))) * (light ? .45 : 1);
        var d = Math.hypot(s.x - px, s.y - py);
        if (d < reach) { near.push(s); a = Math.min(1, a + .4); }
        cx.globalAlpha = a; cx.fillStyle = 'rgb(' + col[s.c] + ')';
        cx.beginPath(); cx.arc(s.x, s.y, s.r * (d < reach ? 1.5 : 1), 0, 6.283); cx.fill();
      }
      cx.lineWidth = dpr * .7;
      for (var j = 0; j < near.length; j++) for (var k = j + 1; k < near.length; k++) {
        var dd = Math.hypot(near[j].x - near[k].x, near[j].y - near[k].y);
        if (dd < 110 * dpr) { cx.globalAlpha = (1 - dd / (110 * dpr)) * (light ? .35 : .55); cx.strokeStyle = 'rgb(' + col[1] + ')'; cx.beginPath(); cx.moveTo(near[j].x, near[j].y); cx.lineTo(near[k].x, near[k].y); cx.stroke(); }
      }
      if (!reduce && !document.hidden) requestAnimationFrame(draw);
    };
    size(); addEventListener('resize', size); requestAnimationFrame(draw);
    document.addEventListener('visibilitychange', function () { if (!document.hidden && !reduce) requestAnimationFrame(draw); });
  }

  /* scroll: progress bar, journey line, reveals */
  var bar = $('.progress'), journey = $('.journey');
  var onScroll = function () {
    var h = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.setProperty('--p', h > 0 ? Math.min(1, scrollY / h) : 0);
    if (journey) { var r = journey.getBoundingClientRect(); var v = (innerHeight * .75 - r.top) / (r.height || 1); journey.style.setProperty('--j', Math.max(0, Math.min(1, v))); }
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .12 });
    $$('.reveal').forEach(function (el, i) { el.style.transitionDelay = ((i % 4) * .07) + 's'; io.observe(el); });
  } else $$('.reveal').forEach(function (el) { el.classList.add('in'); });

  /* card spotlight + portal parallax */
  $$('.spot').forEach(function (c) {
    c.addEventListener('pointermove', function (e) { var r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); });
  });
  var portal = $('.portal');
  if (portal && !reduce && matchMedia('(pointer:fine)').matches) {
    addEventListener('pointermove', function (e) {
      var rx = (e.clientY / innerHeight - .5) * -8, ry = (e.clientX / innerWidth - .5) * 10;
      portal.style.transform = 'perspective(900px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
    }, { passive: true });
  }

  /* poem: twelve-syllable markers + reveal */
  var poem = $('#poemtext');
  if (poem) {
    $$('span', poem).forEach(function (s, i) { s.style.transitionDelay = (i * .16) + 's'; var m = document.createElement('i'); m.textContent = '12'; m.title = 'twelve syllables'; s.appendChild(m); });
    if ('IntersectionObserver' in window && !reduce) new IntersectionObserver(function (e, o) { if (e[0].isIntersecting) { poem.classList.add('lit'); o.disconnect(); } }, { threshold: .3 }).observe(poem);
    else poem.classList.add('lit');
  }

  /* table of contents scrollspy */
  var tocLinks = $$('.toc a');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var map = {}; tocLinks.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { tocLinks.forEach(function (a) { a.classList.remove('on'); }); var a = map[e.target.id]; if (a) a.classList.add('on'); } });
    }, { rootMargin: '-20% 0px -70% 0px' });
    Object.keys(map).forEach(function (id) { var h = document.getElementById(id); if (h) spy.observe(h); });
  }

  /* ── "/" quick-jump palette ── */
  var items = (window.ALEX_PALETTE || []).concat([
    { e: 'lifebuoy', t: 'Need help right now? Crisis resources', k: 'help', href: 'https://psychedelicsinrecovery.github.io/alex-desk-public/#lifeline' },
    { e: 'planet', t: 'A.L.E.X. home', k: 'page', href: 'https://psychedelicsinrecovery.github.io/alex-desk-public/' },
    { e: 'compass', t: 'How to use A.L.E.X. and the helpdesks', k: 'page', href: 'https://psychedelicsinrecovery.github.io/alex-desk-public/howto.html' },
    { e: 'lock-key', t: 'Privacy notice', k: 'page', href: 'https://psychedelicsinrecovery.github.io/alex-desk-public/privacy.html' },
    { e: 'scroll', t: 'Terms of service', k: 'page', href: 'https://psychedelicsinrecovery.github.io/alex-desk-public/terms.html' },
    { e: 'scroll', t: 'LitCom desk', k: 'desk', href: 'https://psychedelicsinrecovery.github.io/litcom-desk-public/' },
    { e: 'desktop', t: 'TechCom desk', k: 'desk', href: 'https://psychedelicsinrecovery.github.io/techcom-desk-public/' },
    { e: 'github-logo', t: 'GitHubDesk', k: 'desk', href: 'https://psychedelicsinrecovery.github.io/github-desk-public/' },
    { e: 'megaphone', t: 'PR desk', k: 'desk', href: 'https://psychedelicsinrecovery.github.io/pr-desk-public/' },
    { e: 'chat-circle-dots', t: 'Copy /ask', k: 'copy', copy: '/ask' },
    { e: 'ticket', t: 'Copy /techcom', k: 'copy', copy: '/techcom' },
    { e: 'scroll', t: 'Copy /litcom', k: 'copy', copy: '/litcom' },
    { e: 'shield-check', t: 'Copy /mod', k: 'copy', copy: '/mod' },
    { e: 'discord-logo', t: "Join PIR's Discord", k: 'link', href: 'https://discord.gg/MyprTq8w95' },
    { e: 'house', t: 'PIR® GitHub hub', k: 'link', href: 'https://psychedelicsinrecovery.github.io/' },
    { e: 'globe', t: 'psychedelicsinrecovery.org', k: 'link', href: 'https://www.psychedelicsinrecovery.org' },
    { e: 'circle-half', t: 'Toggle light / dark', k: 'action', run: function () { setTheme(root.dataset.theme === 'light' ? 'dark' : 'light'); } }
  ]);
  var pal = document.createElement('div'); pal.className = 'palette'; pal.setAttribute('role', 'dialog'); pal.setAttribute('aria-modal', 'true'); pal.setAttribute('aria-label', 'Jump anywhere');
  pal.innerHTML = '<div class="box"><input type="text" placeholder="Jump to a section, desk or page… or copy a command" aria-label="Search" aria-controls="pal-list" autocomplete="off"><ul id="pal-list" role="listbox"></ul><div class="foot"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>↵</kbd> open</span><span><kbd>esc</kbd> close</span></div></div>';
  document.body.appendChild(pal);
  var inp = $('input', pal), list = $('ul', pal), sel = 0, shown = [], lastFocus;
  var score = function (q, s) { s = s.toLowerCase(); if (!q) return 1; if (s.indexOf(q) >= 0) return 2; var i = 0; for (var c = 0; c < s.length && i < q.length; c++) if (s[c] === q[i]) i++; return i === q.length ? 1 : 0; };
  var render = function () {
    var q = inp.value.trim().toLowerCase();
    shown = items.map(function (it) { return { it: it, s: score(q, it.t + ' ' + it.k) }; }).filter(function (x) { return x.s; }).sort(function (a, b) { return b.s - a.s; }).map(function (x) { return x.it; });
    sel = Math.min(sel, Math.max(0, shown.length - 1));
    list.innerHTML = shown.map(function (it, i) { return '<li role="option" id="pal-' + i + '" aria-selected="' + (i === sel) + '"><span class="e"><i class="ph-fill ph-' + it.e + '" aria-hidden="true"></i></span>' + it.t.replace(/</g, '&lt;') + '<span class="k">' + it.k + '</span></li>'; }).join('') || '<li>Nothing matches. Try “desk”, “privacy” or “ask”.</li>';
    inp.setAttribute('aria-activedescendant', 'pal-' + sel);
    var on = $('[aria-selected=true]', list); if (on) on.scrollIntoView({ block: 'nearest' });
  };
  var open = function () { lastFocus = document.activeElement; pal.classList.add('open'); inp.value = ''; sel = 0; render(); inp.focus(); };
  var close = function () { pal.classList.remove('open'); if (lastFocus && lastFocus.focus) lastFocus.focus(); };
  var go = function (it) {
    if (!it) return; close();
    if (it.copy) copy(it.copy); else if (it.run) it.run();
    else if (it.href) { if (it.href.charAt(0) === '#') { var t = document.querySelector(it.href); if (t) t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); history.replaceState(null, '', it.href); } else location.href = it.href; }
  };
  inp.addEventListener('input', function () { sel = 0; render(); });
  inp.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { sel = Math.min(shown.length - 1, sel + 1); render(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); render(); e.preventDefault(); }
    else if (e.key === 'Enter') { go(shown[sel]); e.preventDefault(); }
    else if (e.key === 'Escape') close();
  });
  list.addEventListener('click', function (e) { var li = e.target.closest('li[id]'); if (li) go(shown[+li.id.slice(4)]); });
  pal.addEventListener('click', function (e) { if (e.target === pal) close(); });
  $$('[data-palette]').forEach(function (b) { b.addEventListener('click', open); });
  addEventListener('keydown', function (e) {
    var typing = /INPUT|TEXTAREA|SELECT/.test((e.target.tagName || '')) || e.target.isContentEditable;
    if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing && !pal.classList.contains('open'))) { e.preventDefault(); pal.classList.contains('open') ? close() : open(); }
  });

  /* ── follow a question through the engine (pure illustration) ── */
  var lab = window.ALEX_LAB, stagesEl = $('#stages');
  if (lab && stagesEl) {
    var order = ['in', 'guard', 'vis', 'search', 'fuse', 'conf', 'llm', 'out'], timers = [], comp = $('#composer-text'), reply = $('#reply');
    var el = function (k) { return $('.stage[data-k="' + k + '"]'); };
    var run = function (key) {
      timers.forEach(clearTimeout); timers = []; var sc = lab[key];
      $$('.stage').forEach(function (s) { s.className = 'stage'; $('.st', s).textContent = ''; });
      reply.className = 'reply'; $('.body', reply).innerHTML = '<span class="muted">A.L.E.X. is thinking…</span>';
      var q = sc.q, typeStep = reduce ? 0 : 22, base = reduce ? 0 : q.length * typeStep + 250, step = reduce ? 0 : 480;
      comp.textContent = '';
      for (var c = 0; c <= q.length; c++) (function (c) { timers.push(setTimeout(function () { comp.textContent = q.slice(0, c); }, c * typeStep)); })(c);
      order.forEach(function (k, idx) {
        timers.push(setTimeout(function () {
          if (sc.stop && order.indexOf(sc.stop) < idx) { el(k).classList.add('skipped'); return; }
          if (idx > 0) { var p = el(order[idx - 1]); if (!p.classList.contains('stop')) { p.classList.remove('on'); p.classList.add('done'); } }
          var e = el(k); e.classList.add('on'); $('.st', e).textContent = sc.label[k] || '';
          if (k === sc.stop) { e.classList.remove('on'); e.classList.add('stop'); }
        }, base + idx * step));
      });
      timers.push(setTimeout(function () {
        if (!sc.stop) { var l = el('out'); l.classList.remove('on'); l.classList.add('done'); }
        reply.className = 'reply show' + (sc.cls ? ' ' + sc.cls : ''); $('.body', reply).innerHTML = sc.res;
      }, base + order.length * step));
    };
    $$('.ask').forEach(function (b) {
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () { $$('.ask').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); }); b.setAttribute('aria-pressed', 'true'); run(b.dataset.s); });
    });
  }
})();
