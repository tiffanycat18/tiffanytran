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

  /* ---------- Project captions ----------
     Write a caption once, inside the project's <figure>:
       <p class="project__caption">…</p>
     Desktop / tablet: it's moved under the project title (left column).
     Phones: it stays centred under the image. */
  var phone = window.matchMedia('(max-width: 767px)');
  function placeCaptions() {
    document.querySelectorAll('.project').forEach(function (project) {
      var caption = project.querySelector('.project__caption');
      if (!caption) return;
      var figure = project.querySelector('.project__media');
      var title = project.querySelector('.project__title');
      var left = project.querySelector('.project__left');
      if (!left && title) {               // wrap the title so the caption can sit under it
        left = document.createElement('div');
        left.className = 'project__left';
        title.parentNode.insertBefore(left, title);
        left.appendChild(title);
      }
      if (phone.matches) figure.appendChild(caption);
      else if (left) left.appendChild(caption);
    });
  }
  placeCaptions();
  if (phone.addEventListener) phone.addEventListener('change', placeCaptions);
  else if (phone.addListener) phone.addListener(placeCaptions);

  /* ---------- Underline ABOUT while the About section is in view ---------- */
  var about = document.getElementById('about');
  var aboutLink = document.querySelector('.nav-about');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      aboutLink.classList.toggle('is-active', entries[0].isIntersecting);
    }, { threshold: 0.5 }).observe(about);
  }
})();
