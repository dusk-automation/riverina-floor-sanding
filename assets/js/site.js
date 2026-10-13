/* Riverina Floor Sanding: design preview by Dusk. Visuals only, nothing is sent anywhere. */
(function () {
  'use strict';
  window.__rfs = true;

  var root = document.documentElement;
  var motion = root.classList.contains('motion');
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var smooth = function (a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  /* the page's own width and height: on a phone these stay right even if the browser has zoomed out */
  var vw = function () { return root.clientWidth || window.innerWidth; };
  var vh = function () { return root.clientHeight || window.innerHeight; };
  var wide = function () { return window.matchMedia('(min-width: 901px)').matches; };

  /* ---------- moving between pages: no intro, one quick pass across the screen ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank' || e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
    var h = a.getAttribute('href') || '';
    if (/^(tel:|mailto:|https?:|#)/.test(h)) return;
    try { sessionStorage.setItem('rfs-nav', '1'); } catch (err) { /* private mode */ }
    var same = false;
    try { var u = new URL(a.href, location.href); same = u.pathname === location.pathname && !!u.hash; } catch (err2) { /* old browser */ }
    if (same || !motion) return;
    e.preventDefault();
    root.classList.remove('arriving');
    root.classList.add('leaving');
    setTimeout(function () { location.href = a.href; }, 340);
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted) root.classList.remove('leaving'); });

  /* ---------- intro: the growth rings draw, the R slides out, then the screen is sanded off in passes ---------- */
  function runIntro(done) {
    var el = $('#intro');
    if (!el || !root.classList.contains('has-intro')) { if (el && el.parentNode) el.parentNode.removeChild(el); done(); return; }
    var over = false, timer = 0;
    function finish() {
      if (over) return;
      over = true;
      clearTimeout(timer);
      el.classList.add('out');
      root.classList.remove('intro-lock');
      setTimeout(done, 260);
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
        root.classList.remove('has-intro');
        root.classList.add('no-intro');
      }, 1700);
    }
    function play() {
      if (over) return;
      el.classList.add('play');
      timer = setTimeout(finish, 2750);
    }
    el.addEventListener('click', finish);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' || e.key === 'Enter') finish(); });
    var started = false;
    var go = function () { if (!started) { started = true; play(); } };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go);
    setTimeout(go, 450);
  }

  /* ---------- headings rise word by word ---------- */
  $$('[data-split]').forEach(function (el) {
    var w = 0;
    (function walk(node) {
      $$slice(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var o = document.createElement('span'); o.className = 'split-w';
            var i = document.createElement('span'); i.textContent = part; i.style.setProperty('--w', w++);
            o.appendChild(i); frag.appendChild(o);
          });
          node.replaceChild(frag, c);
        } else if (c.nodeType === 1) { walk(c); }
      });
    })(el);
  });
  function $$slice(list) { return Array.prototype.slice.call(list); }

  /* ---------- things appear as they scroll into view ---------- */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -7% 0px', threshold: 0.08 }) : null;
  function watch() {
    $$('[data-rv], [data-split], .map').forEach(function (el) {
      if (el.closest('.hero, .phero')) { el.classList.add('in'); return; }
      if (io) io.observe(el); else el.classList.add('in');
    });
  }

  /* ---------- header, menu, phone call bar ---------- */
  var hdr = $('.hdr'), mbar = $('.mbar'), burger = $('.burger'), menu = $('#menu');
  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    if (burger) { burger.setAttribute('aria-expanded', open ? 'true' : 'false'); burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); }
    if (menu) { if (open) menu.removeAttribute('inert'); else menu.setAttribute('inert', ''); }
  }
  if (burger && menu) {
    setMenu(false);
    burger.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('menu-open')) { setMenu(false); burger.focus(); } });
    window.addEventListener('resize', function () { if (vw() > 1180) setMenu(false); });
  }

  /* ---------- scroll-driven pieces ---------- */
  var reveal = $('.reveal'), rvSteps = reveal ? $$('.rv-steps li', reveal) : [], rvTagA = reveal ? $('.rv-tag.a', reveal) : null, rvTagB = reveal ? $('.rv-tag.b', reveal) : null;
  var big = $('.big'), track = $('.big-track'), bigDist = 0;
  var rails = $$('.steps, .cure');
  function prog(el) {
    var r = el.getBoundingClientRect(), span = r.height - vh();
    return span > 0 ? clamp(-r.top / span, 0, 1) : 0;
  }
  function layout() {
    if (reveal) reveal.classList.toggle('live', motion && vh() >= 520);
    if (big && track) {
      var live = motion && wide() && vh() >= 560;
      big.classList.toggle('live', live);
      if (live) {
        bigDist = Math.max(0, track.scrollWidth - vw());
        big.style.height = (vh() + bigDist) + 'px';
      } else {
        big.style.height = '';
        track.style.transform = '';
      }
    }
    onScroll();
  }
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = window.pageYOffset || 0;
      if (hdr) hdr.classList.toggle('solid', y > 30);
      if (mbar) mbar.classList.toggle('on', y > 460);
      if (reveal && reveal.classList.contains('live')) {
        var pr = prog(reveal), p = smooth(0.1, 0.82, pr);
        reveal.style.setProperty('--p', p.toFixed(4));
        var step = pr < 0.26 ? 0 : pr < 0.7 ? 1 : 2;
        rvSteps.forEach(function (li, i) { li.classList.toggle('on', i === step); });
        if (rvTagA) rvTagA.style.opacity = p < 0.16 ? 0 : 1;
        if (rvTagB) rvTagB.style.opacity = p > 0.84 ? 0 : 1;
        reveal.classList.toggle('end', p < 0.015 || p > 0.985);
      }
      if (big && big.classList.contains('live')) {
        var pb = prog(big);
        track.style.transform = 'translate3d(' + (-pb * bigDist).toFixed(1) + 'px,0,0)';
        big.style.setProperty('--p', Math.max(0.04, pb).toFixed(4));
      }
      rails.forEach(function (el) {
        var r = el.getBoundingClientRect(), h = vh();
        el.style.setProperty('--p', motion ? smooth(h * 0.9, h * 0.35, r.top).toFixed(4) : 1);
      });
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', layout);
  window.addEventListener('load', layout);
  if (track) track.addEventListener('scroll', function () {
    if (big.classList.contains('live')) return;
    var max = track.scrollWidth - track.clientWidth;
    big.style.setProperty('--p', max > 0 ? Math.max(0.04, track.scrollLeft / max).toFixed(4) : 1);
  }, { passive: true });

  /* ---------- drag to compare ---------- */
  function dragP(el, host, locked) {
    var input = $('input[type=range]', el), dragging = false;
    function set(p) {
      p = clamp(p, 0.03, 0.97);
      host.style.setProperty('--p', p.toFixed(4));
      if (input) input.value = Math.round(p * 100);
    }
    function at(e) { var r = el.getBoundingClientRect(); set((e.clientX - r.left) / r.width); }
    el.addEventListener('pointerdown', function (e) {
      if (locked && locked()) return;
      dragging = true;
      el.dataset.touched = '1';
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* fine */ }
      if (e.pointerType === 'mouse') at(e);
    });
    el.addEventListener('pointermove', function (e) { if (dragging) at(e); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) { el.addEventListener(t, function () { dragging = false; }); });
    if (input) input.addEventListener('input', function () { el.dataset.touched = '1'; set(input.value / 100); });
    return set;
  }
  $$('.ba').forEach(function (el) {
    var set = dragP(el, el);
    if (!motion || !io) return;
    /* a small nudge the first time it is seen, so it reads as something to drag */
    var seen = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      seen.disconnect();
      var t0 = performance.now();
      (function tick(now) {
        if (el.dataset.touched) return;
        var t = clamp((now - t0 - 500) / 1500, 0, 1);
        set(0.5 + Math.sin(t * Math.PI * 2) * 0.16 * (1 - t * 0.35));
        if (t < 1) requestAnimationFrame(tick); else set(0.5);
      })(t0);
    }, { threshold: 0.55 });
    seen.observe(el);
  });
  if (reveal) dragP($('.rv-stage', reveal), reveal, function () { return reveal.classList.contains('live'); });

  /* ---------- finish picker ---------- */
  $$('.fin').forEach(function (fin) {
    var floor = $('.fin-floor', fin), outSheen = $('[data-out=sheen]', fin), outTone = $('[data-out=tone]', fin);
    fin.addEventListener('change', function (e) {
      var t = e.target;
      if (!t || t.type !== 'radio') return;
      var label = t.getAttribute('data-label') || '';
      if (t.name === 'sheen') { floor.style.setProperty('--g', t.value); if (outSheen) outSheen.textContent = label; }
      if (t.name === 'tone') { floor.setAttribute('data-tone', t.value); if (outTone) outTone.textContent = label; }
    });
  });

  /* ---------- services list: the photo follows the row ---------- */
  var svcView = $('.svc-view');
  if (svcView) {
    var items = $$('.svc-item'), cap = $('figcaption', svcView);
    var pics = items.map(function (it, i) {
      if (i === 0) return $('img', svcView);
      var im = document.createElement('img');
      im.src = $('img', it).getAttribute('src'); im.alt = ''; im.loading = 'lazy'; im.decoding = 'async';
      svcView.insertBefore(im, cap);
      return im;
    });
    var pick = function (i) {
      items.forEach(function (x, k) { x.classList.toggle('on', k === i); pics[k].classList.toggle('on', k === i); });
      if (cap) cap.textContent = $('img', items[i]).getAttribute('data-cap') || '';
    };
    items.forEach(function (it, i) {
      it.addEventListener('mouseenter', function () { pick(i); });
      it.addEventListener('focus', function () { pick(i); });
    });
    pick(0);
  }

  /* ---------- reviews: two columns drifting past each other ---------- */
  var cols = $('.rev-cols');
  if (cols && motion) {
    $$('.rev-col', cols).forEach(function (col) {
      $$slice(col.children).forEach(function (card) {
        var copy = card.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        col.appendChild(copy);
      });
    });
    cols.classList.add('live');
  }

  /* ---------- numbers count up ---------- */
  if (motion && io) {
    var counter = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        counter.unobserve(en.target);
        var el = en.target, end = parseFloat(el.getAttribute('data-count')), dec = (el.getAttribute('data-count').split('.')[1] || '').length, t0 = performance.now();
        (function tick(now) {
          var t = clamp((now - t0) / 1400, 0, 1), v = end * (1 - Math.pow(1 - t, 3));
          el.textContent = v.toFixed(dec);
          if (t < 1) requestAnimationFrame(tick);
        })(t0);
      });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach(function (el) { counter.observe(el); });
  }

  /* ---------- gallery: filter and full-size viewer ---------- */
  var filters = $('.filters'), gal = $('.gal');
  if (filters && gal) {
    var figs = $$('figure', gal);
    filters.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      var f = b.getAttribute('data-f'), n = 0;
      $$('button', filters).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      figs.forEach(function (fig) {
        var show = f === 'all' || (' ' + fig.getAttribute('data-t') + ' ').indexOf(' ' + f + ' ') > -1;
        fig.classList.toggle('hide', !show);
        fig.classList.remove('pop');
        fig.classList.add('in');
        if (show) { void fig.offsetWidth; fig.style.animationDelay = (n++ * 40) + 'ms'; fig.classList.add('pop'); }
      });
    });
  }
  var lb = $('.lb');
  if (lb && gal) {
    var lbImg = $('img', lb), lbTag = $('.lb-cap small', lb), lbTxt = $('.lb-cap span', lb), cur = 0, list = [];
    var showAt = function (i) {
      cur = (i + list.length) % list.length;
      var fig = list[cur], im = $('img', fig), c = $('figcaption', fig);
      lbImg.src = im.getAttribute('src');
      lbImg.alt = im.alt;
      lbTag.textContent = c ? ($('small', c) || {}).textContent || '' : '';
      lbTxt.textContent = c ? c.lastChild.textContent : '';
    };
    gal.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      list = $$('figure:not(.hide)', gal);
      showAt(list.indexOf(btn.closest('figure')));
      if (lb.showModal) lb.showModal(); else lb.setAttribute('open', '');
    });
    var close = function () { if (lb.close) lb.close(); else lb.removeAttribute('open'); };
    $('.x', lb).addEventListener('click', close);
    $('.pv', lb).addEventListener('click', function () { showAt(cur - 1); });
    $('.nx', lb).addEventListener('click', function () { showAt(cur + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb-img')) close(); });
    lb.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') showAt(cur - 1); if (e.key === 'ArrowRight') showAt(cur + 1); });
    var sx = 0;
    lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) showAt(cur + (dx < 0 ? 1 : -1)); }, { passive: true });
  }

  /* ---------- quote form: three short steps, and nothing is sent ---------- */
  $$('.qf').forEach(function (qf) {
    var form = $('form', qf), steps = $$('.qf-step', qf), bar = $('.qf-bar i', qf), count = $('.qf-top b', qf), err = $('.qf-err', qf), at = 0;
    function show(n, focus) {
      at = n;
      steps.forEach(function (s, k) { s.classList.toggle('on', k === n); });
      if (bar) bar.style.transform = 'scaleX(' + ((n + 1) / steps.length) + ')';
      if (count) count.textContent = 'Step ' + (n + 1) + ' of ' + steps.length;
      if (focus) { var h = $('h3', steps[n]); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } }
    }
    function valid(n) {
      var ok = true, step = steps[n];
      if ($('[data-need-one]', step)) {
        var any = $$('input[type=checkbox]', step).some(function (c) { return c.checked; });
        if (err) err.classList.toggle('on', !any);
        if (!any) ok = false;
      }
      $$('.fld', step).forEach(function (f) {
        var inp = $('input, textarea', f), v = (inp.value || '').trim(), bad = false;
        if (inp.required && !v) bad = true;
        if (!bad && v && inp.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) bad = true;
        f.classList.toggle('bad', bad);
        inp.setAttribute('aria-invalid', bad ? 'true' : 'false');
        if (bad && ok) { ok = false; inp.focus(); }
      });
      return ok;
    }
    qf.addEventListener('click', function (e) {
      if (e.target.closest('[data-back]')) { e.preventDefault(); show(Math.max(0, at - 1), true); }
      if (e.target.closest('[data-again]')) { form.reset(); qf.classList.remove('sent'); show(0, true); }
    });
    qf.addEventListener('change', function (e) { if (e.target.type === 'checkbox' && err) err.classList.remove('on'); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!valid(at)) return;
      if (at < steps.length - 1) { show(at + 1, true); return; }
      var name = ((form.elements.name && form.elements.name.value) || '').trim().split(/\s+/)[0];
      var who = $('.qf-name', qf);
      if (who) who.textContent = name ? ', ' + name : '';
      qf.classList.add('sent');
      var done = $('.qf-done h3', qf);
      if (done) { done.setAttribute('tabindex', '-1'); done.focus({ preventScroll: true }); }
    });
    show(0, false);
  });

  /* ---------- the short clip of the sander at work ---------- */
  $$('.vid').forEach(function (box) {
    var v = $('video', box), btn = $('.vid-btn', box), use = btn ? $('use', btn) : null;
    if (!v || !btn) return;
    var paint = function () { var p = v.paused; btn.setAttribute('aria-label', p ? 'Play the clip' : 'Pause the clip'); if (use) use.setAttribute('href', p ? '#i-play' : '#i-pause'); };
    btn.addEventListener('click', function () { box.dataset.user = '1'; if (v.paused) v.play(); else v.pause(); });
    v.addEventListener('play', paint);
    v.addEventListener('pause', paint);
    paint();
    if (motion && io) {
      new IntersectionObserver(function (es) {
        if (box.dataset.user) return;
        if (es[0].isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () { /* autoplay refused */ }); } else { v.pause(); }
      }, { threshold: 0.5 }).observe(box);
    }
  });

  /* ---------- services page: the jump bar follows the reader ---------- */
  var jump = $('.jump');
  if (jump && io) {
    var links = $$('a', jump);
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) {
          var on = a.getAttribute('href') === '#' + en.target.id;
          a.classList.toggle('on', on);
          if (on && a.parentNode.scrollTo) a.parentNode.scrollTo({ left: a.offsetLeft - 24, behavior: motion ? 'smooth' : 'auto' });
        });
      });
    }, { rootMargin: '-40% 0px -50% 0px' });
    links.forEach(function (a) { var t = $(a.getAttribute('href')); if (t) spy.observe(t); });
  }

  /* ---------- opening hours: today, and open or closed right now (Albury time) ---------- */
  try {
    var parts = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    var get = function (t) { var f = parts.filter(function (p) { return p.type === t; })[0]; return f ? f.value : ''; };
    var day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday')), mins = (parseInt(get('hour'), 10) % 24) * 60 + parseInt(get('minute'), 10);
    $$('.hours [data-d]').forEach(function (el) { if (el.getAttribute('data-d').split(',').indexOf(String(day)) > -1) el.classList.add('now'); });
    var open = day >= 1 && day <= 5 && mins >= 510 && mins < 1050;
    $$('.open-now').forEach(function (el) {
      el.classList.toggle('yes', open);
      $('span', el).textContent = open ? 'Open now, until 5:30 pm' : 'Closed right now. Leave a message or send the form.';
    });
  } catch (err) { /* older browser: the plain hours table is enough */ }
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- go ---------- */
  layout();
  runIntro(function () {
    var began = false;
    var begin = function () {
      if (began) return;
      began = true;
      root.classList.add('ready');
      watch();
      if (root.classList.contains('arriving')) setTimeout(function () { root.classList.remove('arriving'); }, 750);
    };
    requestAnimationFrame(begin);
    setTimeout(begin, 300); /* a tab opened in the background gets no animation frames */
  });
})();
