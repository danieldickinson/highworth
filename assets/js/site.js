// Discover Highworth — shared navigation behaviour
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('nav.mainnav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Dropdown groups: click to toggle; close when clicking elsewhere or pressing Escape
  var groups = Array.prototype.slice.call(document.querySelectorAll('.navgroup'));
  groups.forEach(function (group) {
    var btn = group.querySelector('button');
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var wasOpen = group.classList.contains('open');
      groups.forEach(function (g) { g.classList.remove('open'); });
      if (!wasOpen) group.classList.add('open');
      btn.setAttribute('aria-expanded', !wasOpen ? 'true' : 'false');
    });
  });
  document.addEventListener('click', function () {
    groups.forEach(function (g) { g.classList.remove('open'); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') groups.forEach(function (g) { g.classList.remove('open'); });
  });

  // On desktop, open dropdowns on hover as well
  if (window.matchMedia('(min-width: 981px)').matches) {
    groups.forEach(function (group) {
      group.addEventListener('mouseenter', function () { group.classList.add('open'); });
      group.addEventListener('mouseleave', function () { group.classList.remove('open'); });
    });
  }

  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
