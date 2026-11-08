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
})();
