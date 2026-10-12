(function () {
  'use strict';
  var doc = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  doc.classList.add('js');

  /* Theme toggle */
  var themeColor = $('#theme-color');
  function syncThemeColor() {
    themeColor.setAttribute('content', doc.getAttribute('data-theme') === 'light' ? '#f6f7fc' : '#0b0e19');
  }
  syncThemeColor();
  $('#theme-toggle').addEventListener('click', function () {
    var next = doc.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    doc.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    syncThemeColor();
  });

  /* Mobile menu */
  var menuBtn = $('#menu-btn');
  var links = $('#nav-links');
  function setMenu(open) {
    links.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  menuBtn.addEventListener('click', function () { setMenu(!links.classList.contains('open')); });
  $$('a', links).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* Scroll: header state, progress bar, back-to-top */
  var header = $('#header');
  var progress = $('#progress');
  var toTop = $('#to-top');
  function onScroll() {
    var y = window.scrollY;
    var max = doc.scrollHeight - window.innerHeight;
    header.classList.toggle('scrolled', y > 10);
    toTop.classList.toggle('show', y > 600);
    progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

  /* Active nav link */
  var navAnchors = $$('.nav-links a');
  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        navAnchors.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id); });
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(function (s) { spy.observe(s); });

  /* Reveal on scroll (with stagger inside grids) */
  $$('.skill-grid, .project-grid, .edu-grid, .stats, .contact-info, .facts, .hero-copy').forEach(function (g) {
    $$('.reveal', g).forEach(function (el, i) { el.style.setProperty('--d', (i * 0.09) + 's'); });
  });
  var revealer = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      revealer.unobserve(en.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(function (el) { revealer.observe(el); });

  /* Counters */
  var start = new Date(2024, 5, 1); // June 2024, start of current role
  var now = new Date();
  var years = Math.max(1, Math.floor((now - start) / (365.25 * 24 * 3600 * 1000)));
  var yEl = $('[data-years]');
  yEl.setAttribute('data-count', years);
  yEl.textContent = '0';
  yEl.nextElementSibling.textContent = 'Years in production';
  function animateCount(el) {
    var target = +el.getAttribute('data-count');
    if (reduce) { el.textContent = target + (el.hasAttribute('data-years') ? '+' : ''); return; }
    var t0 = performance.now(), dur = 1400;
    (function tick(t) {
      var p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + (p === 1 && el.hasAttribute('data-years') ? '+' : '');
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
  var counter = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { animateCount(en.target); counter.unobserve(en.target); }
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(function (el) { counter.observe(el); });

  /* Typing effect */
  var typed = $('#typed');
  var roles = ['Full-Stack Developer', 'Angular Developer', 'Hapi.js & Node.js Engineer', 'PostgreSQL Database Designer'];
  if (!reduce) {
    var r = 0, c = roles[0].length, del = true;
    (function loop() {
      var word = roles[r];
      typed.textContent = word.slice(0, c);
      var delay = del ? 45 : 85;
      if (del && c > 0) { c--; }
      else if (del) { del = false; r = (r + 1) % roles.length; delay = 300; }
      else if (c < roles[r].length) { c++; }
      else { del = true; delay = 1800; }
      setTimeout(loop, delay);
    })();
  }

  /* Cursor glow (fine pointers only) */
  var glow = $('#glow');
  if (!reduce && matchMedia('(pointer: fine)').matches) {
    window.addEventListener('pointermove', function (e) {
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
    }, { passive: true });
  }

  /* 3D tilt on project cards */
  if (!reduce && matchMedia('(pointer: fine)').matches) {
    $$('.tilt').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var b = card.getBoundingClientRect();
        var x = (e.clientX - b.left) / b.width - 0.5;
        var y = (e.clientY - b.top) / b.height - 0.5;
        card.style.transition = 'border-color .3s, box-shadow .3s';
        card.style.transform = 'perspective(900px) rotateY(' + (x * 6) + 'deg) rotateX(' + (-y * 6) + 'deg) translateY(-4px)';
      });
      card.addEventListener('pointerleave', function () {
        card.style.transition = '';
        card.style.transform = '';
      });
    });
  }

  /* Contact form -> mailto (no backend on GitHub Pages) */
  var form = $('#contact-form');
  var note = $('#form-note');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    ['name', 'email', 'message'].forEach(function (n) {
      var f = form.elements[n];
      var bad = !f.value.trim() || (n === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value));
      f.classList.toggle('invalid', bad);
      if (bad) ok = false;
    });
    if (!ok) { note.textContent = 'Please fill in all fields with a valid email.'; return; }
    var name = form.elements.name.value.trim();
    var body = form.elements.message.value.trim() + '\n\n— ' + name + ' (' + form.elements.email.value.trim() + ')';
    window.location.href = 'mailto:mjsarkarmj454@gmail.com?subject=' +
      encodeURIComponent('Portfolio inquiry from ' + name) + '&body=' + encodeURIComponent(body);
    note.textContent = 'Opening your email app… if nothing happens, email me directly at mjsarkarmj454@gmail.com.';
  });
  $$('input, textarea', form).forEach(function (f) { f.addEventListener('input', function () { f.classList.remove('invalid'); }); });

  /* Footer year */
  $('#year').textContent = new Date().getFullYear();
})();
