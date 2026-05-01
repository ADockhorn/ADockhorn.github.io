/**
 * site.js — navigation, mobile menu, active link highlighting
 */
(function () {

  function setupNav() {
    /* ── Hamburger toggle ───────────────────────────────── */
    var toggle  = document.querySelector('.nav-toggle');
    var navList = document.getElementById('nav-links');

    if (toggle && navList && !toggle.dataset.bound) {
      toggle.dataset.bound = '1';
      toggle.addEventListener('click', function () {
        var open = navList.classList.toggle('open');
        toggle.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', open);
      });

      // Close menu when a link is clicked (mobile)
      navList.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          if (window.innerWidth <= 768) {
            navList.classList.remove('open');
            toggle.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
          }
        });
      });
    }

    /* ── Dropdown: click on mobile, hover handled by CSS ── */
    document.querySelectorAll('.has-dropdown').forEach(function (item) {
      var trigger = item.querySelector('.dropdown-toggle');
      if (!trigger || trigger.dataset.bound) return;
      trigger.dataset.bound = '1';
      trigger.addEventListener('click', function (e) {
        if (window.innerWidth <= 768) {
          e.preventDefault();
          item.classList.toggle('open');
          var arrow = trigger.querySelector('.dropdown-arrow');
          if (arrow) arrow.style.transform = item.classList.contains('open') ? 'rotate(180deg)' : '';
        }
      });
    });

    /* ── Active nav link ────────────────────────────────── */
    var page = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href) return;
      var linkPage = href.split('/').pop();
      if (linkPage === page || (page === '' && linkPage === 'index.html')) {
        a.classList.add('active');
        var parent = a.closest('.has-dropdown');
        if (parent) {
          var dt = parent.querySelector('.dropdown-toggle');
          if (dt) dt.classList.add('active');
        }
      }
    });
  }

  function setupGlobal() {
    // Close dropdowns when clicking outside
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.has-dropdown')) {
        document.querySelectorAll('.has-dropdown.open').forEach(function (d) {
          d.classList.remove('open');
        });
      }
    });

    /* ── Smooth scroll for in-page anchors ─────────────── */
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var target = document.querySelector(a.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupGlobal();
    setupNav();
  });
  document.addEventListener('partials:loaded', setupNav);

}());
