(function () {
  const MOON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/></svg>`;
  const SUN  = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;

  const NAV_ITEMS = [
    { label: 'Wave',  href: '/wave/' },
    { label: 'Typo',  href: '/typo/' },
    { label: 'Mesh',  href: '/mesh/' },
    { label: 'Trail', href: '/trail/' },
  ];

  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300..700&display=swap';
  document.head.prepend(fontLink);

  const style = document.createElement('style');
  style.textContent = `
    :root { --header-h: 48px; }

    #site-nav {
      position: relative; z-index: 2147483647;
      background: color-mix(in srgb, var(--pg-bg) 80%, transparent);
      backdrop-filter: blur(12px) saturate(180%);
      transition: background .4s ease, backdrop-filter .4s ease;
      font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
    }
    #site-nav.menu-open {
      background: var(--pg-bg);
      backdrop-filter: none;
    }

    .header-bar {
      height: var(--header-h); box-sizing: border-box;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 24px;
    }
    @media (max-width: 639px) {
      .header-bar { padding: 0 16px; }
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
      position: fixed; top: var(--header-h); left: 0; right: 0; bottom: 0; z-index: 2147483646;
      background: color-mix(in srgb, var(--pg-bg) 80%, transparent);
      backdrop-filter: blur(12px) saturate(180%);
      opacity: 0; pointer-events: none;
      transition: opacity .4s ease, background .4s ease, backdrop-filter .4s ease;
      font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
    }
    #site-menu.is-open {
      opacity: 1; pointer-events: auto;
      background: var(--pg-bg);
      backdrop-filter: none;
    }

    #site-menu nav {
      height: 100%;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 32px;
      padding-bottom: var(--header-h); box-sizing: border-box;
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
  menu.innerHTML = `<nav>${NAV_ITEMS.map((item, i) => `<a href="${item.href}" style="transition-delay:${((i + 1) * .05).toFixed(2)}s">${item.label}</a>`).join('')}</nav>`;

  document.body.prepend(nav);
  document.body.insertBefore(menu, nav.nextSibling);

  const themeBtn = document.getElementById('theme-toggle');
  const menuBtn  = document.getElementById('menu-toggle');
  const menuIcon = menuBtn.querySelector('.menu-icon');

  function isDark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }

  function applyTheme(dark) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    themeBtn.innerHTML = dark ? SUN : MOON;
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  }

  function setMenuOpen(open) {
    menu.classList.toggle('is-open', open);
    menuIcon.classList.toggle('is-open', open);
    nav.classList.toggle('menu-open', open);
    menu.setAttribute('aria-hidden', !open);
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menuBtn.setAttribute('aria-expanded', open);
  }

  themeBtn.addEventListener('click', function () {
    const dark = isDark();
    const cover = document.createElement('div');
    cover.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:' + (dark ? '#fdfdfb' : '#1c1917') + ';pointer-events:none;opacity:0;transition:opacity .15s ease';
    document.body.appendChild(cover);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { cover.style.opacity = '1'; });
    });
    setTimeout(function () {
      nav.style.transition = 'none';
      applyTheme(!dark);
      cover.style.transition = 'opacity .6s ease';
      cover.style.opacity = '0';
      setTimeout(function () { cover.remove(); nav.style.transition = ''; }, 600);
    }, 150);
  });

  menuBtn.addEventListener('click', function () {
    setMenuOpen(!menu.classList.contains('is-open'));
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) setMenuOpen(false);
  });

  applyTheme(isDark());
})();
