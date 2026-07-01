(function () {

  // ── pg-select ─────────────────────────────────────────────────────────────
  function initSelect(wrap) {
    var dropdown = wrap.querySelector('.pg-select-dropdown');
    var valEl = wrap.querySelector('.pg-select-val');
    if (!dropdown) return;
    dropdown.querySelectorAll('.pg-select-option').forEach(function (o) { o.setAttribute('tabindex', '-1'); });

    function close() {
      dropdown.classList.remove('is-open');
      dropdown.classList.remove('show-selected');
      dropdown.style.position = '';
      dropdown.style.top = '';
      dropdown.style.left = '';
      dropdown.style.right = '';
    }

    function open() {
      var wrapRect = wrap.getBoundingClientRect();
      dropdown.style.position = 'fixed';
      dropdown.style.top = (wrapRect.bottom + 6) + 'px';
      dropdown.style.left = wrapRect.left + 'px';
      dropdown.style.right = '';
      dropdown.classList.add('is-open');
      dropdown.classList.add('show-selected');
      var rect = dropdown.getBoundingClientRect();
      if (rect.right > window.innerWidth - 8) {
        dropdown.style.left = '';
        dropdown.style.right = (window.innerWidth - wrapRect.right) + 'px';
      }
      dropdown.querySelectorAll('.pg-select-option').forEach(function (o) {
        o.addEventListener('mouseenter', function clearSelected() {
          if (!o.classList.contains('is-selected')) dropdown.classList.remove('show-selected');
          o.removeEventListener('mouseenter', clearSelected);
        });
      });
    }

    window.addEventListener('scroll', function () {
      if (dropdown.classList.contains('is-open')) close();
    }, { passive: true });

    wrap.addEventListener('keydown', function (e) {
      var opts = Array.from(dropdown.querySelectorAll('.pg-select-option'));
      var isOpen = dropdown.classList.contains('is-open');
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (isOpen) {
          var focused = dropdown.querySelector('.pg-select-option:focus');
          if (focused) { focused.click(); } else { close(); }
        } else {
          open();
        }
      } else if (e.key === 'Escape') {
        close(); wrap.focus();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!isOpen) { open(); }
        dropdown.classList.remove('show-selected');
        var focused = dropdown.querySelector('.pg-select-option:focus');
        var idx = opts.indexOf(focused);
        if (idx === -1) {
          var selIdx = opts.indexOf(dropdown.querySelector('.pg-select-option.is-selected'));
          idx = selIdx !== -1 ? selIdx : (e.key === 'ArrowDown' ? -1 : opts.length);
        }
        var next = e.key === 'ArrowDown' ? Math.min(idx + 1, opts.length - 1) : Math.max(idx - 1, 0);
        opts[next].focus();
      }
    });

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
      if (dropdown.classList.contains('is-open')) { close(); } else { open(); }
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
