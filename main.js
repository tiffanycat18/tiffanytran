(function () {
  'use strict';

  /* ---------- INDEX: toggle the sub-page menu ---------- */
  var toggle = document.querySelector('.nav-index__toggle');
  var menu = document.getElementById('index-menu');

  function setOpen(open) {
    toggle.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
  }

  toggle.addEventListener('click', function () {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.nav-index')) setOpen(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });

  // Sub-page links are placeholders (href="#") until the pages exist.
  menu.addEventListener('click', function (e) {
    var link = e.target.closest('a');
    if (link && link.getAttribute('href') === '#') e.preventDefault();
    setOpen(false);
  });

  /* ---------- ABOUT: scroll to the end of the page ---------- */
  // Smooth scrolling comes from CSS (scroll-behavior), which already
  // respects prefers-reduced-motion. Here we only close the menu.
  document.querySelector('.nav-about').addEventListener('click', function () {
    setOpen(false);
  });

  /* ---------- Underline ABOUT while the About section is in view ---------- */
  var about = document.getElementById('about');
  var aboutLink = document.querySelector('.nav-about');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      aboutLink.classList.toggle('is-active', entries[0].isIntersecting);
    }, { threshold: 0.5 }).observe(about);
  }

  /* =========================================================
     PROJECT SLIDESHOWS
     Every child of .carousel__stage is a slide (photo, video or
     placeholder). Each project plays as a slow, looping slideshow
     while it's on screen.
       Desktop: the cursor turns into a ← / → arrow over the picture;
                click the left half to go back, the right half for next.
       Phones:  tap the left half of the picture to go back, the right
                half for next; a tap anywhere else on that project's
                screen also shows the next one. Swiping works too.
     Videos play silently, with no controls, and fade into the next
     slide when they finish.
     ========================================================= */

  // Timing (milliseconds). See README for the reasoning.
  var TIMING = {
    hold: 5500,         // how long a photo stays fully visible
    holdArrive: 8000,   // the picture showing when a project scrolls into view
                        // (a little longer, to read the title and text)
    fadeAuto: 2400,     // automatic dissolve (matches --fade-in in styles.css)
    fadeManual: 1200,   // dissolve after a click / tap (matches styles.css)
    videoWait: 1500     // longest wait for a video's first frame before fading it in
  };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Desktop / tablet layout: the stage height comes from CSS (fills the screen)
  var fillLayout = window.matchMedia('(min-width: 768px) and (min-height: 601px)');

  function Carousel(fig) {
    var stage = fig.querySelector('.carousel__stage');
    var project = fig.closest('.project') || fig;
    var slides = Array.prototype.slice.call(stage.children);
    var n = slides.length;
    if (!n) return;

    var index = 0;
    var timer = null;
    var inView = false;
    var numEl = null;

    /* ---------- build slides ---------- */
    slides = slides.map(function (el, i) {
      var slide = el;
      if (el.tagName === 'VIDEO') {
        slide = document.createElement('div');
        el.parentNode.insertBefore(slide, el);
        slide.appendChild(el);
        slide.classList.add('carousel__slide--video');
        setupVideo(el);
      }
      slide.classList.add('carousel__slide');
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', 'slide');
      slide.setAttribute('aria-label', (i + 1) + ' of ' + n);
      if (el.tagName === 'IMG' && !el.complete) el.addEventListener('load', fit);
      return slide;
    });
    slides[0].classList.add('is-active');

    stage.setAttribute('aria-roledescription', 'carousel');
    if (n > 1) {
      var count = document.createElement('p');
      count.className = 'carousel__count';
      count.setAttribute('aria-hidden', 'true');
      count.innerHTML = '<span class="carousel__num">1</span>/' + n;
      numEl = count.firstChild;
      stage.insertAdjacentElement('afterend', count);
    }

    /* ---------- sizing: every slide keeps its own shape ---------- */
    function ratioOf(slide) {
      var r = parseFloat(slide.getAttribute('data-ratio'));
      if (r > 0) return r;
      if (slide.tagName === 'IMG' && slide.naturalWidth) return slide.naturalWidth / slide.naturalHeight;
      var v = slide.querySelector && slide.querySelector('video');
      if (v && v.videoWidth) return v.videoWidth / v.videoHeight;
      return 1.543;   // same shape as the Figma image box
    }

    function fit() {
      var W = stage.clientWidth;
      if (!W) return;
      if (fillLayout.matches) {
        stage.style.height = '';
      } else {
        // phones: tall enough for the tallest slide (CSS caps it at 55% of the screen)
        var H = 0;
        slides.forEach(function (s) { H = Math.max(H, W / ratioOf(s)); });
        stage.style.height = Math.round(H) + 'px';
      }
      stage.classList.add('is-sized');
      var h = stage.clientHeight;
      slides.forEach(function (s) {
        var r = ratioOf(s);
        var w = Math.min(W, h * r);
        w = Math.round(w);
        s.style.width = w + 'px';
        s.style.height = Math.round(w / r) + 'px';
        s.style.left = Math.round((W - w) / 2) + 'px';   // whole pixels: no shimmer while fading
      });
    }

    /* ---------- the slideshow ---------- */
    function current() { return slides[index]; }
    function videoOf(slide) { return slide.classList.contains('carousel__slide--video') ? slide.querySelector('video') : null; }

    function running() {
      return inView && !document.hidden && !reduceMotion && n > 1;
    }

    function schedule(arriving) {
      clearTimeout(timer);
      if (!running()) return;
      var v = videoOf(current());
      // A playing video moves on by itself when it ends (see 'ended' below)
      if (v && !v._broken && !v._blocked) return;
      var wait = arriving ? TIMING.holdArrive
        : (fig.classList.contains('is-manual') ? TIMING.fadeManual : TIMING.fadeAuto) + TIMING.hold;
      timer = setTimeout(function () { go(index + 1, false); }, wait);
    }

    var goToken = 0;

    function go(to, manual) {
      if (n < 2) return;
      to = (to + n) % n;
      if (to === index) return;
      var token = ++goToken;
      clearTimeout(timer);

      // A video fades in only once its first frame is ready, so it never
      // appears as an empty box. Start it now (still hidden) and wait.
      var v = videoOf(slides[to]);
      if (v && !v._broken && v.readyState < 2) {
        var done = false;
        var proceed = function () {
          if (done || token !== goToken) return;
          done = true;
          show(to, manual);
        };
        v.preload = 'auto';
        try { v.currentTime = 0; } catch (e) {}
        playVideo(v);
        v.addEventListener('loadeddata', proceed, { once: true });
        setTimeout(proceed, TIMING.videoWait);
        return;
      }
      show(to, manual);
    }

    function show(to, manual) {
      var prev = current();
      var pv = videoOf(prev);
      if (pv) pv.pause();   // keeps its last frame while the next picture dissolves over it

      fig.classList.toggle('is-manual', !!manual);
      slides.forEach(function (s) { s.classList.remove('is-leaving'); });
      prev.classList.add('is-leaving');
      prev.classList.remove('is-active');
      index = to;
      current().classList.add('is-active');
      setCount(index + 1);

      var v = videoOf(current());
      if (v) {
        v._blocked = false;
        if (v.currentTime > 0.3) { try { v.currentTime = 0; } catch (e) {} }
        playVideo(v);
      }
      // warm up the next video so it starts instantly
      var nv = videoOf(slides[(index + 1) % n]);
      if (nv && nv.preload !== 'auto') nv.preload = 'auto';

      schedule(false);
    }

    // The counter number softly fades out, changes, and fades back in
    var countTimer = null;
    function setCount(k) {
      if (!numEl) return;
      var count = numEl.parentNode;
      clearTimeout(countTimer);
      count.classList.add('is-changing');
      countTimer = setTimeout(function () {
        numEl.textContent = k;
        count.classList.remove('is-changing');
      }, 450);
    }

    /* ---------- videos: silent, no controls, fade on when finished ---------- */
    function playVideo(v) {
      if (!inView || document.hidden || v._broken) return;
      v.muted = true;
      var p = v.play();
      if (p && p.catch) {
        p.catch(function () {
          // Autoplay refused (e.g. iPhone Low Power Mode):
          // the slideshow carries on as if it were a photo.
          if (v.paused && videoOf(current()) === v) { v._blocked = true; schedule(false); }
        });
      }
    }

    function setupVideo(v) {
      v.muted = true;
      v.defaultMuted = true;
      v.playsInline = true;
      v.setAttribute('playsinline', '');
      v.setAttribute('muted', '');
      v.removeAttribute('controls');
      v.removeAttribute('autoplay');
      v.loop = false;
      v.disablePictureInPicture = true;
      if (!v.getAttribute('preload')) v.preload = 'metadata';

      v.addEventListener('loadedmetadata', fit);
      v.addEventListener('ended', function () {
        if (videoOf(current()) !== v) return;
        if (running()) go(index + 1, false);
        else { v.currentTime = 0; playVideo(v); }   // e.g. reduced motion: just loop
      });
      function markBroken() {
        v._broken = true;
        v.parentNode.classList.add('placeholder');
        if (videoOf(current()) === v) schedule(false);
      }
      v.addEventListener('error', markBroken);
      var source = v.querySelector('source:last-of-type');
      if (source) source.addEventListener('error', markBroken);
    }

    /* ---------- clicks, taps, swipes, keyboard ---------- */
    // Which half of the picture is the pointer over? -1 = left, 1 = right, 0 = not on it.
    function sideOf(x, y) {
      var r = current().getBoundingClientRect();
      if (x < r.left || x > r.right || y < r.top || y > r.bottom) return 0;
      return x < r.left + r.width / 2 ? -1 : 1;
    }

    var down = null, swiped = false;
    project.addEventListener('pointerdown', function (e) {
      down = { x: e.clientX, y: e.clientY, type: e.pointerType };
      swiped = false;
    });
    project.addEventListener('pointerup', function (e) {
      if (!down) return;
      var dx = e.clientX - down.x, dy = e.clientY - down.y;
      if (down.type !== 'mouse' && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        swiped = true;
        go(index + (dx < 0 ? 1 : -1), true);
      }
    });
    project.addEventListener('click', function (e) {
      var type = down ? down.type : 'mouse';
      down = null;
      if (swiped) { swiped = false; return; }
      if (n < 2 || e.target.closest('a, button, input, textarea')) return;
      if (menu.classList.contains('is-open')) return;   // that tap just closes the INDEX menu
      var side = sideOf(e.clientX, e.clientY);
      if (side) go(index + side, true);               // on the picture: left = back, right = next
      else if (type !== 'mouse') go(index + 1, true); // phones: anywhere else on this project = next
    });

    // ← / → cursor over the picture (desktop)
    if (n > 1) {
      stage.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var side = sideOf(e.clientX, e.clientY);
        stage.classList.toggle('is-prev', side === -1);
        stage.classList.toggle('is-next', side === 1);
      });
      stage.addEventListener('pointerleave', function () {
        stage.classList.remove('is-prev', 'is-next');
      });
    }


    /* ---------- only play what's on screen ---------- */
    function setInView(v) {
      if (v === inView) return;
      inView = v;
      var vid = videoOf(current());
      if (v) {
        if (vid) playVideo(vid);
        schedule(true);
      } else {
        clearTimeout(timer);
        if (vid) vid.pause();
      }
    }

    this.setInView = setInView;
    this.onVisibility = function () {
      var vid = videoOf(current());
      if (document.hidden) { clearTimeout(timer); if (vid) vid.pause(); }
      else if (inView) { if (vid) playVideo(vid); schedule(false); }
    };
    this.fit = fit;
    this.go = function (step) { go(index + step, true); };
    this.isInView = function () { return inView; };
    this.stage = stage;

    fit();
    if (window.ResizeObserver) {
      var lastW = 0;
      new ResizeObserver(function () {
        var w = stage.clientWidth;
        if (w !== lastW || fillLayout.matches) { lastW = w; fit(); }
      }).observe(stage);
    }
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { fig.classList.add('is-ready'); });
    });
  }

  var carousels = Array.prototype.map.call(document.querySelectorAll('.carousel'), function (fig) {
    return new Carousel(fig);
  }).filter(function (c) { return c.stage; });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        carousels.forEach(function (c) {
          if (c.stage === entry.target) c.setInView(entry.isIntersecting && entry.intersectionRatio >= 0.5);
        });
      });
    }, { threshold: [0, 0.5, 0.75] });
    carousels.forEach(function (c) { io.observe(c.stage); });
  } else {
    carousels.forEach(function (c) { c.setInView(true); });
  }

  // ← / → keys change the slideshow that's on screen
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (e.altKey || e.ctrlKey || e.metaKey || e.target.closest('input, textarea, select')) return;
    var c = carousels.filter(function (c) { return c.isInView(); })[0];
    if (!c) return;
    e.preventDefault();
    c.go(e.key === 'ArrowRight' ? 1 : -1);
  });

  document.addEventListener('visibilitychange', function () {
    carousels.forEach(function (c) { c.onVisibility(); });
  });
  var onLayoutChange = function () { carousels.forEach(function (c) { c.fit(); }); };
  if (fillLayout.addEventListener) fillLayout.addEventListener('change', onLayoutChange);
  window.addEventListener('resize', onLayoutChange);
})();
