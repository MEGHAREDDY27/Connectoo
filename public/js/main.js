// public/js/main.js
(function () {
  'use strict';

  // ---- Hype toggle (detail view) ----
  document.querySelectorAll('.hype-btn').forEach(function (btn) {
    var id = btn.getAttribute('data-id');
    var tip = document.getElementById('hype-login-tip-' + id);

    btn.addEventListener('click', function (e) {
      e.preventDefault();

      if (btn.getAttribute('data-authenticated') !== 'true') {
        if (tip) {
          tip.classList.remove('hidden');
          setTimeout(function () { tip.classList.add('hidden'); }, 4000);
        }
        return;
      }

      btn.disabled = true;
      fetch('/reports/' + id + '/hype', { method: 'POST', headers: { 'X-Requested-With': 'XMLHttpRequest' } })
        .then(function (res) {
          if (res.status === 401 && tip) tip.classList.remove('hidden');
          return res.ok ? res.json() : null;
        })
        .then(function (data) {
          if (!data) return;
          var counter = document.getElementById('hype-count-' + id);
          if (counter) counter.textContent = data.count;
          btn.setAttribute('data-hyped', data.hyped ? 'true' : 'false');
        })
        .catch(function (err) { console.error('Hype failed', err); })
        .then(function () { btn.disabled = false; });
    });
  });

  // ---- Reply form toggles ----
  document.addEventListener('click', function (e) {
    var toggle = e.target.closest('.reply-toggle');
    if (!toggle) return;
    var form = document.getElementById(toggle.getAttribute('data-target'));
    if (!form) return;
    form.classList.toggle('hidden');
    if (!form.classList.contains('hidden')) {
      var ta = form.querySelector('textarea');
      if (ta) ta.focus();
    }
  });

  // ---- Confirm before destructive form submits ----
  document.querySelectorAll('form[data-confirm]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      if (!window.confirm(form.getAttribute('data-confirm'))) e.preventDefault();
    });
  });

  // ---- Portfolio tabs ----
  var tabs = document.querySelectorAll('.portfolio-tab');
  if (tabs.length) {
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var name = tab.getAttribute('data-tab');
        tabs.forEach(function (t) {
          var active = t === tab;
          t.classList.toggle('border-blue-500', active);
          t.classList.toggle('text-white', active);
          t.classList.toggle('border-transparent', !active);
          t.classList.toggle('text-slate-400', !active);
        });
        document.querySelectorAll('.portfolio-panel').forEach(function (p) {
          p.classList.toggle('hidden', p.id !== 'portfolio-panel-' + name);
        });
      });
    });
  }

  // ---- Dashboard: sortable table + status filter ----
  var table = document.getElementById('dashboard-table');
  if (table) {
    var headers = table.querySelectorAll('th.sortable');
    headers.forEach(function (th) {
      th.addEventListener('click', function () {
        var col = parseInt(th.getAttribute('data-col'), 10);
        var type = th.getAttribute('data-sort');
        var asc = th.getAttribute('data-dir') !== 'asc';
        headers.forEach(function (h) { h.removeAttribute('data-dir'); });
        th.setAttribute('data-dir', asc ? 'asc' : 'desc');

        var tbody = table.tBodies[0];
        var rows = Array.prototype.slice.call(tbody.rows).filter(function (r) { return r.cells.length > col; });

        function val(row) {
          var cell = row.cells[col];
          var raw = cell.getAttribute('data-value') || cell.textContent.trim();
          return type === 'number' ? parseFloat(raw) || 0 : raw.toLowerCase();
        }

        rows.sort(function (a, b) {
          var x = val(a), y = val(b);
          if (x < y) return asc ? -1 : 1;
          if (x > y) return asc ? 1 : -1;
          return 0;
        });
        rows.forEach(function (r) { tbody.appendChild(r); });
      });
    });

    var filters = document.querySelectorAll('.filter-tab');
    filters.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var f = btn.getAttribute('data-filter');
        filters.forEach(function (b) {
          var active = b === btn;
          b.classList.toggle('bg-blue-600', active);
          b.classList.toggle('border-blue-500', active);
          b.classList.toggle('text-white', active);
          b.classList.toggle('border-slate-600', !active);
          b.classList.toggle('text-slate-300', !active);
        });
        Array.prototype.forEach.call(table.tBodies[0].rows, function (row) {
          var status = row.getAttribute('data-status');
          if (!status) return;
          row.classList.toggle('hidden', f !== 'all' && status !== f);
        });
      });
    });
  }
})();
