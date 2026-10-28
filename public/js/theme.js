(function () {
  'use strict';

  var key = 'connectoo-theme';
  var root = document.documentElement;
  var toggle = document.getElementById('theme-toggle');
  var moon = document.getElementById('theme-icon-moon');
  var sun = document.getElementById('theme-icon-sun');

  function apply(theme, persist) {
    var dark = theme === 'dark';
    root.classList.toggle('dark', dark);
    if (persist) {
      try { localStorage.setItem(key, theme); } catch (error) { console.warn('Theme preference could not be saved.', error); }
    }
    if (moon) moon.classList.toggle('hidden', dark);
    if (sun) sun.classList.toggle('hidden', !dark);
    if (toggle) toggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  }

  var saved = null;
  try { saved = localStorage.getItem(key); } catch (error) { console.warn('Theme preference could not be read.', error); }
  apply(saved === 'light' || saved === 'dark'
    ? saved
    : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'), false);

  if (toggle) {
    toggle.addEventListener('click', function () {
      apply(root.classList.contains('dark') ? 'light' : 'dark', true);
    });
  }
})();
