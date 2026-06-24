(function () {
  const MOON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/></svg>`;
  const SUN  = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;

  const NAV_ITEMS = [
    { label: 'Wave',  href: '/wave/' },
    { label: 'Typo',  href: '/typo/' },
    { label: 'Mesh',  href: '/mesh/' },
    { label: 'Trail', href: '/trail/' },
  ];

  const style = document.createElement('style');
  style.textContent = `
    :root { --header-h: calc(48px + env(safe-area-inset-top, 0px)); }

    .skip-link {
      position: fixed;
      top: -100%;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2147483647;
      padding: 8px 20px;
      background: var(--pg-primary);
      color: var(--pg-bg);
      font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
      font-size: 14px;
      font-weight: 500;
      border-radius: 10px;
      text-decoration: none;
      white-space: nowrap;
      transition: top .2s ease;
    }
    .skip-link:focus-visible {
      top: 12px;
      outline: 2px solid var(--pg-primary);
      outline-offset: 2px;
    }

    #site-nav {
      position: relative; z-index: 2147483646;
      background: var(--nav-bg, transparent);
      backdrop-filter: var(--nav-filter, none);
      font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
    }

    .header-bar {
      height: var(--header-h); box-sizing: border-box;
      display: flex; align-items: center; justify-content: space-between;
      padding: env(safe-area-inset-top, 0px) 24px 0;
    }
    @media (max-width: 639px) {
      .header-bar { padding: env(safe-area-inset-top, 0px) 16px 0; }
    }

    .site-logo {
      font-size: 19px; font-weight: 500; letter-spacing: -0.01em;
      color: var(--pg-primary); text-decoration: none;
      transition: opacity .3s ease;
    }
    #site-nav.menu-open .site-logo,
    #site-nav.menu-open #theme-toggle { opacity: 0; pointer-events: none; }

    .header-right {
      display: flex; align-items: center;
      margin-right: -10px;
    }

    #theme-toggle, #menu-toggle {
      width: 36px; height: 36px; border: 0; border-radius: 12px;
      background: transparent; color: rgba(28,25,23,.80);
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: color .15s, opacity .3s ease;
    }
    #theme-toggle:hover, #menu-toggle:hover { color: var(--pg-primary); }
    html[data-theme="dark"] #theme-toggle,
    html[data-theme="dark"] #menu-toggle { color: rgba(250,250,249,.80); }

    .menu-icon {
      width: 16px;
      display: flex; flex-direction: column; gap: 4px;
      pointer-events: none;
    }
    .menu-icon span {
      display: block; width: 100%; height: 1.5px;
      background: currentColor; border-radius: 1px;
      transition: transform .35s cubic-bezier(.22,1,.36,1), opacity .2s ease;
      transform-origin: center;
    }
    .menu-icon.is-open span:nth-child(1) { transform: translateY(5.5px) rotate(45deg); }
    .menu-icon.is-open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
    .menu-icon.is-open span:nth-child(3) { transform: translateY(-5.5px) rotate(-45deg); }

    #site-menu {
      position: fixed; inset: 0; z-index: 2147483645;
      background: var(--nav-bg, color-mix(in srgb, var(--pg-bg) 80%, transparent));
      backdrop-filter: var(--nav-filter, blur(12px) saturate(180%));
      opacity: 0; pointer-events: none;
      transition: opacity .4s ease, background .4s ease, backdrop-filter .4s ease;
      font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
    }
    #site-menu.is-open {
      opacity: 1; pointer-events: auto;
      background: var(--nav-bg-open, var(--pg-bg));
      backdrop-filter: none;
    }

    #site-menu nav {
      height: 100%;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 32px;
      padding-top: var(--header-h); box-sizing: border-box;
    }

    #site-menu nav a {
      font-size: 48px; font-weight: 500; letter-spacing: -0.02em; line-height: 1.1;
      color: var(--pg-primary); text-decoration: none;
      opacity: 0; transform: translateY(-8px);
      transition: opacity .3s ease, transform .3s ease;
    }
    #site-menu.is-open nav a { opacity: .8; transform: translateY(0); }
    #site-menu nav a:hover { opacity: 1; }

    @media (max-width: 639px) {
      #site-menu nav a { font-size: 36px; }
      #site-menu.is-open nav a { opacity: 1; }
    }

    :root { color-scheme: light; }
    html[data-theme="dark"] { color-scheme: dark; }
    @media (max-width: 639px) { #theme-toggle { display: none; } }

    .pg-theme-fab {
      display: none;
      position: fixed;
      bottom: calc(24px + env(safe-area-inset-bottom, 0px));
      right: 24px;
      width: 48px; height: 48px;
      border-radius: 50%;
      border: 1px solid var(--pg-border);
      background: color-mix(in srgb, var(--pg-bg) 80%, transparent);
      backdrop-filter: blur(20px) saturate(180%);
      color: var(--pg-primary);
      cursor: pointer;
      align-items: center; justify-content: center;
      z-index: 9999;
      box-shadow: 0 2px 16px rgba(0,0,0,.1);
      transition: color .15s;
    }
    @media (max-width: 639px) {
      html:not([data-page]) .pg-theme-fab { display: flex; }
    }

  `;
  document.head.appendChild(style);

  const nav = document.createElement('div');
  nav.id = 'site-nav';
  nav.innerHTML = `
    <div class="header-bar">
      <a class="site-logo" href="/">Paulsen</a>
      <div class="header-right">
        <button id="theme-toggle"></button>
        <button id="menu-toggle" aria-label="Open menu" aria-expanded="false">
          <span class="menu-icon"><span></span><span></span><span></span></span>
        </button>
      </div>
    </div>
  `;

  const menu = document.createElement('div');
  menu.id = 'site-menu';
  menu.setAttribute('aria-hidden', 'true');
  menu.setAttribute('inert', '');
  menu.innerHTML = `<nav>${NAV_ITEMS.map((item, i) => `<a href="${item.href}" style="transition-delay:${((i + 1) * .05).toFixed(2)}s">${item.label}</a>`).join('')}</nav>`;

  document.body.prepend(nav);
  document.body.insertBefore(menu, nav.nextSibling);

  if (document.documentElement.dataset.page !== 'style') {
    const skipLink = document.createElement('a');
    skipLink.className = 'skip-link';
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to content';
    function handleSkip(e) {
      if (e.type === 'keydown' && e.key !== 'Enter') return;
      e.preventDefault();
      const main = document.getElementById('main-content');
      if (main) {
        const first = main.querySelector('a, button, [tabindex="0"]');
        if (first) { first.focus(); return; }
        main.focus(); return;
      }
      const reopenBtn = document.querySelector('.twk-reopen');
      if (reopenBtn) { reopenBtn.focus(); return; }
      const tweaksPanel = document.querySelector('.twk-panel');
      if (tweaksPanel) {
        const first = tweaksPanel.querySelector('button, input, [tabindex="0"]');
        if (first) { first.focus(); return; }
      }
      const firstSlider = document.querySelector('[role="slider"]');
      if (firstSlider) { firstSlider.focus(); return; }
      const root = document.getElementById('root');
      if (root) root.focus();
    }
    skipLink.addEventListener('keydown', handleSkip);
    skipLink.addEventListener('click', handleSkip);
    document.body.prepend(skipLink);
  }

  const fab = document.createElement('button');
  fab.className = 'pg-theme-fab';
  fab.setAttribute('aria-label', 'Toggle theme');
  document.body.appendChild(fab);

  const themeBtn = document.getElementById('theme-toggle');
  const menuBtn  = document.getElementById('menu-toggle');
  const menuIcon = menuBtn.querySelector('.menu-icon');

  function isDark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }

  function applyTheme(dark) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    localStorage.setItem('pg-theme', dark ? 'dark' : 'light');
    const icon = dark ? SUN : MOON;
    const label = dark ? 'Switch to light mode' : 'Switch to dark mode';
    themeBtn.innerHTML = icon;
    themeBtn.setAttribute('aria-label', label);
    fab.innerHTML = icon;
    fab.setAttribute('aria-label', label);
    const bg = dark ? '#1c1917' : '#fdfdfb';
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
    meta.content = bg;
  }

  fab.addEventListener('click', function () { applyTheme(!isDark()); });

  function setMenuOpen(open) {
    menu.classList.toggle('is-open', open);
    menuIcon.classList.toggle('is-open', open);
    nav.classList.toggle('menu-open', open);
    menu.setAttribute('aria-hidden', !open);
    menu.toggleAttribute('inert', !open);
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menuBtn.setAttribute('aria-expanded', open);
    if (open) {
      const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = scrollbarW + 'px';
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
  }

  themeBtn.addEventListener('click', function () {
    applyTheme(!isDark());
  });

  menuBtn.addEventListener('click', function () {
    setMenuOpen(!menu.classList.contains('is-open'));
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) setMenuOpen(false);

    if (e.key === 'Tab') {
      const focusable = Array.from(document.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )).filter(el => !el.closest('[inert]') && el.offsetParent !== null);
      if (focusable.length < 2) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  applyTheme(isDark());

  // Blur focus before navigating away — iOS Safari otherwise scrolls to the
  // last-focused element on back navigation instead of restoring scroll position.
  if ('scrollRestoration' in history) history.scrollRestoration = 'auto';
  window.addEventListener('pagehide', function () {
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
  });
})();
