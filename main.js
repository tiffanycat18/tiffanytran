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
     placeholder). Each project plays as a gentle, looping slideshow
     while it's on screen; clicking / tapping the picture shows the
     next one, swiping goes back and forth.
     ========================================================= */

  // Timing (milliseconds). See README for the reasoning.
  var TIMING = {
    hold: 5500,         // how long a photo stays fully visible
    holdArrive: 8000,   // the first picture you see when a project scrolls into view
                        // (a little longer, to read the title and text)
    fadeAuto: 1200,     // automatic crossfade (matches styles.css)
    fadeManual: 550,    // crossfade after a click / swipe
    minVideo: 5500      // clips shorter than this play again before moving on
  };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Desktop / tablet layout: the stage height comes from CSS (fills the screen)
  var fillLayout = window.matchMedia('(min-width: 768px) and (min-height: 601px)');
  var canHover = window.matchMedia('(hover: hover)').matches;

  var ICONS = {
    play: '<svg class="i-play" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9.5-5.5z"/></svg>',
    pause: '<svg class="i-pause" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 2.5h3v11h-3zM9.5 2.5h3v11h-3z"/></svg>',
    muted: '<svg class="i-muted" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 6h2.5L8 3v10L4.5 10H2z"/><path d="M10.6 5.9l.7-.7L13 6.9l1.7-1.7.7.7L13.7 7.6l1.7 1.7-.7.7L13 8.3 11.3 10l-.7-.7 1.7-1.7z"/></svg>',
    sound: '<svg class="i-sound" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 6h2.5L8 3v10L4.5 10H2z"/><path d="M10.2 5.2l.7-.7a4.8 4.8 0 0 1 0 7l-.7-.7a3.8 3.8 0 0 0 0-5.6z"/><path d="M12.1 3.3l.7-.7a7.4 7.4 0 0 1 0 10.8l-.7-.7a6.4 6.4 0 0 0 0-9.4z"/></svg>'
  };

  function fmt(t) {
    if (!isFinite(t) || t < 0) t = 0;
    var m = Math.floor(t / 60), s = Math.floor(t % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function keyboardFocusInside(el) {
    try { return !!el.querySelector(':focus-visible'); } catch (e) { return false; }
  }

  function Carousel(fig) {
    var stage = fig.querySelector('.carousel__stage');
    var slides = Array.prototype.slice.call(stage.children);
    var n = slides.length;
    if (!n) return;

    var index = 0;
    var timer = null;
    var inView = false;
    var userPaused = reduceMotion;       // reduced motion: nothing moves until asked
    var focusPaused = false;
    var activatedAt = 0;
    var count, numEl, hint;

    /* ---------- build slides ---------- */
    slides = slides.map(function (el, i) {
      var slide = el;
      if (el.tagName === 'VIDEO') {
        slide = document.createElement('div');
        el.parentNode.insertBefore(slide, el);
        slide.appendChild(el);
        slide.classList.add('carousel__slide--video', 'is-paused');
        setupVideo(slide, el);
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
      stage.tabIndex = 0;
      stage.setAttribute('aria-label', 'Slideshow. Press Enter or the arrow keys to change the picture.');

      count = document.createElement('button');
      count.type = 'button';
      count.className = 'carousel__count';
      count.innerHTML = '<span class="carousel__num">1</span>/' + n +
        '<span class="carousel__state" aria-hidden="true"></span>';
      numEl = count.firstChild;
      stage.insertAdjacentElement('afterend', count);
      count.addEventListener('click', function () { setUserPaused(!userPaused); });
      updateCount();

      hint = document.createElement('span');
      hint.className = 'carousel__hint';
      hint.setAttribute('aria-hidden', 'true');
      hint.textContent = 'Next';
      fig.appendChild(hint);
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
        s.style.width = Math.round(w) + 'px';
        s.style.height = Math.round(w / r) + 'px';
      });
    }

    /* ---------- the slideshow ---------- */
    function current() { return slides[index]; }
    function videoOf(slide) { return slide.classList.contains('carousel__slide--video') ? slide.querySelector('video') : null; }

    function running() {
      return inView && !document.hidden && !userPaused && !focusPaused && n > 1;
    }
    function videosMayPlay() {
      return inView && !document.hidden && !(reduceMotion && userPaused);
    }

    function schedule(arriving) {
      clearTimeout(timer);
      if (!running()) return;
      var v = videoOf(current());
      // A playable video moves on by itself when it ends (see 'ended' below)
      if (v && !v._broken && !v._blocked) return;
      var wait = arriving ? TIMING.holdArrive
        : (fig.classList.contains('is-manual') ? TIMING.fadeManual : TIMING.fadeAuto) + TIMING.hold;
      timer = setTimeout(function () { go(index + 1, false); }, wait);
    }

    function go(to, manual) {
      to = (to + n) % n;
      if (to === index) return;
      var prev = current();
      var pv = videoOf(prev);
      if (pv) pv.pause();

      fig.classList.toggle('is-manual', !!manual);
      prev.classList.remove('is-active');
      index = to;
      var slide = current();
      slide.classList.add('is-active');
      activatedAt = Date.now();
      updateCount();

      var v = videoOf(slide);
      if (v) {
        v._userPaused = false;
        v._blocked = false;
        try { v.currentTime = 0; } catch (e) {}
        playVideo(v);
      }
      // warm up the next video so it starts instantly
      var nv = videoOf(slides[(index + 1) % n]);
      if (nv && nv.preload !== 'auto') nv.preload = 'auto';

      schedule(false);
    }

    function updateCount() {
      if (!count) return;
      numEl.textContent = index + 1;
      count.setAttribute('data-paused', String(userPaused));
      count.setAttribute('aria-label', (userPaused ? 'Play slideshow' : 'Pause slideshow') +
        ', picture ' + (index + 1) + ' of ' + n);
    }

    function setUserPaused(p) {
      userPaused = p;
      updateCount();
      if (p) clearTimeout(timer);
      else {
        var v = videoOf(current());
        if (v && v.paused && !v._userPaused) playVideo(v);
        schedule(false);
      }
    }

    /* ---------- videos ---------- */
    function playVideo(v) {
      if (!videosMayPlay() || v._userPaused || v._broken) return;
      v.muted = v._wantsSound ? false : true;
      var p = v.play();
      if (p && p.catch) {
        p.catch(function () {
          // Autoplay refused (e.g. iPhone Low Power Mode): show the play button
          // and let the slideshow carry on like a photo.
          if (v.paused && videoOf(current()) === v) { v._blocked = true; schedule(false); }
        });
      }
    }

    function setupVideo(slide, v) {
      v.muted = true;
      v.defaultMuted = true;
      v.playsInline = true;
      v.setAttribute('playsinline', '');
      v.setAttribute('muted', '');
      v.removeAttribute('controls');
      v.removeAttribute('autoplay');
      v.loop = false;
      if (!v.getAttribute('preload')) v.preload = 'metadata';

      var bar = document.createElement('div');
      bar.className = 'vc';
      bar.innerHTML =
        '<button class="vc__btn vc__play" type="button" aria-label="Play video">' + ICONS.play + ICONS.pause + '</button>' +
        '<div class="vc__track" role="slider" tabindex="0" aria-label="Video timeline" aria-valuemin="0" aria-valuemax="0" aria-valuenow="0">' +
          '<div class="vc__fill"></div><div class="vc__knob"></div></div>' +
        '<span class="vc__time">0:00 / 0:00</span>' +
        '<button class="vc__btn vc__mute" type="button" aria-label="Turn sound on">' + ICONS.muted + ICONS.sound + '</button>';
      slide.appendChild(bar);

      var playBtn = bar.querySelector('.vc__play');
      var muteBtn = bar.querySelector('.vc__mute');
      var track = bar.querySelector('.vc__track');
      var fill = bar.querySelector('.vc__fill');
      var knob = bar.querySelector('.vc__knob');
      var time = bar.querySelector('.vc__time');
      var raf = 0, scrubbing = false, wasPlaying = false;

      function paint() {
        var d = v.duration || 0, t = v.currentTime || 0;
        var pct = d ? Math.min(100, t / d * 100) : 0;
        fill.style.width = pct + '%';
        knob.style.left = pct + '%';
        time.textContent = fmt(t) + ' / ' + fmt(d);
        track.setAttribute('aria-valuemax', String(Math.round(d)));
        track.setAttribute('aria-valuenow', String(Math.round(t)));
        track.setAttribute('aria-valuetext', fmt(t) + ' of ' + fmt(d));
      }
      function loop() { paint(); raf = requestAnimationFrame(loop); }

      v.addEventListener('loadedmetadata', function () { fit(); paint(); });
      v.addEventListener('play', function () {
        slide.classList.remove('is-paused');
        playBtn.setAttribute('aria-label', 'Pause video');
        cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
        if (videoOf(current()) === v && v._blocked) { v._blocked = false; schedule(false); }
      });
      v.addEventListener('pause', function () {
        slide.classList.add('is-paused');
        playBtn.setAttribute('aria-label', 'Play video');
        cancelAnimationFrame(raf); paint();
      });
      v.addEventListener('ended', function () {
        if (videoOf(current()) !== v) return;
        var hovering = canHover && bar.matches(':hover');
        if (running() && !hovering && !scrubbing && Date.now() - activatedAt >= TIMING.minVideo) {
          go(index + 1, false);
        } else {
          // short clip, slideshow paused, or someone is using the controls: play again
          v.currentTime = 0;
          playVideo(v);
        }
      });
      v.addEventListener('error', markBroken);
      var source = v.querySelector('source:last-of-type');
      if (source) source.addEventListener('error', markBroken);
      function markBroken() {
        v._broken = true;
        bar.hidden = true;
        slide.classList.add('placeholder');
        if (videoOf(current()) === v) schedule(false);
      }

      playBtn.addEventListener('click', function () {
        if (v.paused) { v._userPaused = false; v._blocked = false; v.play(); }
        else { v._userPaused = true; v.pause(); clearTimeout(timer); }   // holds the slideshow
      });
      muteBtn.addEventListener('click', function () {
        v._wantsSound = v.muted;
        v.muted = !v._wantsSound;
        slide.classList.toggle('is-sound', v._wantsSound);
        muteBtn.setAttribute('aria-label', v._wantsSound ? 'Turn sound off' : 'Turn sound on');
      });

      function seekFrom(e) {
        var r = track.getBoundingClientRect();
        var x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        if (v.duration) { v.currentTime = x * v.duration; paint(); }
      }
      track.addEventListener('pointerdown', function (e) {
        scrubbing = true;
        wasPlaying = !v.paused;
        track.classList.add('is-scrubbing');
        track.setPointerCapture(e.pointerId);
        v.pause();
        seekFrom(e);
      });
      track.addEventListener('pointermove', function (e) { if (scrubbing) seekFrom(e); });
      function endScrub() {
        if (!scrubbing) return;
        scrubbing = false;
        track.classList.remove('is-scrubbing');
        if (wasPlaying) v.play();
      }
      track.addEventListener('pointerup', endScrub);
      track.addEventListener('pointercancel', endScrub);
      track.addEventListener('keydown', function (e) {
        var d = v.duration || 0, step = 0;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') step = 5;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') step = -5;
        else if (e.key === 'Home') step = -Infinity;
        else if (e.key === 'End') step = Infinity;
        else return;
        e.preventDefault();
        e.stopPropagation();
        v.currentTime = Math.min(Math.max(0, v.currentTime + step), Math.max(0, d - 0.05));
        paint();
      });
      // clicks on the controls never change the slide
      bar.addEventListener('click', function (e) { e.stopPropagation(); });
      bar.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    }

    /* ---------- click, tap, swipe, keyboard ---------- */
    var down = null, swiped = false;
    stage.addEventListener('pointerdown', function (e) {
      down = { x: e.clientX, y: e.clientY, type: e.pointerType };
      swiped = false;
    });
    stage.addEventListener('pointerup', function (e) {
      if (!down) return;
      var dx = e.clientX - down.x, dy = e.clientY - down.y;
      if (down.type !== 'mouse' && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        swiped = true;
        go(index + (dx < 0 ? 1 : -1), true);
      }
      down = null;
    });
    stage.addEventListener('click', function () {
      if (swiped) { swiped = false; return; }
      if (n > 1) go(index + 1, true);
    });
    stage.addEventListener('keydown', function (e) {
      if (e.target !== stage) return;
      if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(index + 1, true); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1, true); }
    });

    // "Next" label beside the mouse pointer
    if (hint && canHover) {
      var hx = 0, hy = 0, hraf = 0;
      stage.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var r = fig.getBoundingClientRect();
        hx = e.clientX - r.left + 14; hy = e.clientY - r.top + 14;
        hint.classList.toggle('is-on', !e.target.closest('.vc'));
        if (!hraf) hraf = requestAnimationFrame(function () {
          hraf = 0;
          hint.style.transform = 'translate(' + hx + 'px,' + hy + 'px)';
        });
      });
      stage.addEventListener('pointerleave', function () { hint.classList.remove('is-on'); });
    }

    // Pause while someone uses the keyboard inside the slideshow
    fig.addEventListener('focusin', function () {
      if (keyboardFocusInside(fig)) { focusPaused = true; clearTimeout(timer); }
    });
    fig.addEventListener('focusout', function (e) {
      if (!fig.contains(e.relatedTarget) && focusPaused) { focusPaused = false; schedule(false); }
    });

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

  document.addEventListener('visibilitychange', function () {
    carousels.forEach(function (c) { c.onVisibility(); });
  });
  var onLayoutChange = function () { carousels.forEach(function (c) { c.fit(); }); };
  if (fillLayout.addEventListener) fillLayout.addEventListener('change', onLayoutChange);
  window.addEventListener('resize', onLayoutChange);
})();
