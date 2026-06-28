(function () {

  // ── pg-select ─────────────────────────────────────────────────────────────
  function initSelect(wrap) {
    var dropdown = wrap.querySelector('.pg-select-dropdown');
    var valEl = wrap.querySelector('.pg-select-val');
    if (!dropdown) return;

    function close() {
      dropdown.classList.remove('is-open');
      dropdown.classList.remove('show-selected');
    }

    wrap.addEventListener('click', function (e) {
      var opt = e.target.closest('.pg-select-option');
      if (opt) {
        dropdown.querySelectorAll('.pg-select-option').forEach(function (o) {
          o.classList.toggle('is-selected', o === opt);
        });
        if (valEl) valEl.textContent = opt.dataset.val || opt.textContent.trim();
        close();
        wrap.dispatchEvent(new CustomEvent('pg-select', { detail: { value: opt.dataset.val, option: opt }, bubbles: true }));
        return;
      }
      var opening = !dropdown.classList.contains('is-open');
      dropdown.classList.toggle('is-open');
      if (opening) {
        dropdown.classList.add('show-selected');
        dropdown.querySelectorAll('.pg-select-option').forEach(function (o) {
          o.addEventListener('mouseenter', function clearSelected() {
            if (!o.classList.contains('is-selected')) dropdown.classList.remove('show-selected');
            o.removeEventListener('mouseenter', clearSelected);
          });
        });
      }
    });

    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) close();
    });
  }

  // ── pg-bar ────────────────────────────────────────────────────────────────
  function initBar(bar) {
    function setVal(pct) {
      pct = Math.max(0, Math.min(100, Math.round(pct)));
      bar.setAttribute('aria-valuenow', pct);
      var fill = bar.querySelector('.pg-bar-fill');
      var valFill = bar.querySelector('.pg-bar-val--fill');
      var valTrack = bar.querySelector('.pg-bar-val--track');
      if (fill) fill.style.width = pct + '%';
      if (valFill) { valFill.style.clipPath = 'inset(0 ' + (100 - pct) + '% 0 0)'; valFill.textContent = pct; }
      if (valTrack) { valTrack.style.clipPath = 'inset(0 0 0 ' + pct + '%)'; valTrack.textContent = pct; }
      bar.dispatchEvent(new CustomEvent('pg-bar-change', { detail: { value: pct }, bubbles: true }));
    }

    function pctFromEvent(e) {
      var rect = bar.getBoundingClientRect();
      var clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : rect.left);
      return ((clientX - rect.left) / rect.width) * 100;
    }

    var dragging = false;
    bar.addEventListener('pointerdown', function (e) {
      dragging = true;
      bar.setPointerCapture(e.pointerId);
      setVal(pctFromEvent(e));
    });
    bar.addEventListener('pointermove', function (e) { if (dragging) setVal(pctFromEvent(e)); });
    bar.addEventListener('pointerup', function () { dragging = false; });
    bar.addEventListener('keydown', function (e) {
      var v = parseInt(bar.getAttribute('aria-valuenow') || '50', 10);
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp')   { setVal(v + 1); e.preventDefault(); }
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowDown') { setVal(v - 1); e.preventDefault(); }
    });
  }

  // ── pg-switch ─────────────────────────────────────────────────────────────
  function initSwitch(sw) {
    sw.addEventListener('click', function () {
      var on = sw.getAttribute('data-on') === '1';
      sw.setAttribute('data-on', on ? '0' : '1');
      sw.setAttribute('aria-pressed', String(!on));
      sw.dispatchEvent(new CustomEvent('pg-switch-change', { detail: { value: !on }, bubbles: true }));
    });
  }

  // ── Auto-init ─────────────────────────────────────────────────────────────
  function init() {
    document.querySelectorAll('.pg-select-wrap').forEach(function (el) {
      if (el.dataset.pgInit === '1') return;
      el.dataset.pgInit = '1';
      initSelect(el);
    });
    document.querySelectorAll('.pg-bar').forEach(function (el) {
      if (el.dataset.pgInit === '1') return;
      el.dataset.pgInit = '1';
      initBar(el);
    });
    document.querySelectorAll('.pg-switch').forEach(function (el) {
      if (el.dataset.pgInit === '1') return;
      el.dataset.pgInit = '1';
      initSwitch(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.pgComponents = { initSelect: initSelect, initBar: initBar, initSwitch: initSwitch, init: init };

})();
