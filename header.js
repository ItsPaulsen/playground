(function () {
  const MOON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/></svg>`;
  const SUN  = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
  const HAMBURGER = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>`;
  const CLOSE    = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;

  const NAV_ITEMS = [
    { label: 'Wave',  href: '/wave/' },
    { label: 'Typo',  href: '/typo/' },
    { label: 'Mesh',  href: '/mesh/' },
  ];

  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300..700&display=swap';
  document.head.prepend(fontLink);

  const style = document.createElement('style');
  style.textContent = `
    :root { --header-h: 48px; }

    #site-header {
      position: relative; z-index: 300;
      width: 100%; box-sizing: border-box;
      height: var(--header-h);
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 24px;
      background: transparent;
      font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
    }
    @media (max-width: 639px) {
      #site-header { padding: 0 16px; }
    }

    .site-logo {
      font-size: 19px; font-weight: 500; letter-spacing: -0.01em;
      color: var(--pg-primary); text-decoration: none;
    }

    .header-right {
      display: flex; align-items: center; gap: 0;
      margin-right: -10px;
    }

    #theme-toggle, #menu-toggle {
      width: 36px; height: 36px; border: 0; border-radius: 12px;
      background: transparent; color: rgba(28,25,23,.80);
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: color .15s;
    }
    #theme-toggle:hover, #menu-toggle:hover { color: var(--pg-primary); }
    html[data-theme="dark"] #theme-toggle,
    html[data-theme="dark"] #menu-toggle { color: rgba(250,250,249,.80); }

    #site-menu {
      position: fixed; inset: 0; z-index: 299;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      background: rgba(255,255,255,.8);
      backdrop-filter: blur(20px) saturate(180%);
      opacity: 0; pointer-events: none;
      transition: opacity .3s ease;
      font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
    }
    html[data-theme="dark"] #site-menu {
      background: rgba(28,25,23,.8);
    }
    #site-menu.is-open {
      opacity: 1; pointer-events: auto;
    }

    #site-menu nav {
      display: flex; flex-direction: column;
      align-items: center; gap: 32px;
    }

    #site-menu nav a {
      font-size: 48px; font-weight: 500; letter-spacing: -0.02em; line-height: 1.1;
      color: var(--pg-primary); text-decoration: none;
      opacity: 0; transform: translateY(12px);
      transition: opacity .3s ease, transform .3s ease, color .15s;
    }
    #site-menu.is-open nav a { opacity: .8; transform: translateY(0); }
    #site-menu nav a:nth-child(1) { transition-delay: .05s; }
    #site-menu nav a:nth-child(2) { transition-delay: .10s; }
    #site-menu nav a:nth-child(3) { transition-delay: .15s; }
    #site-menu nav a:hover { opacity: 1; }

    @media (max-width: 639px) {
      #site-menu nav a { font-size: 36px; }
      #site-menu.is-open nav a { opacity: 1; }
      #site-menu nav a:hover { opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  const header = document.createElement('header');
  header.id = 'site-header';
  header.innerHTML = `
    <a class="site-logo" href="/">Paulsen</a>
    <div class="header-right">
      <button id="theme-toggle"></button>
      <button id="menu-toggle" aria-label="Open menu" aria-expanded="false">${HAMBURGER}</button>
    </div>
  `;
  document.body.prepend(header);

  const menu = document.createElement('div');
  menu.id = 'site-menu';
  menu.setAttribute('aria-hidden', 'true');
  menu.innerHTML = `<nav>${NAV_ITEMS.map(i => `<a href="${i.href}">${i.label}</a>`).join('')}</nav>`;
  document.body.appendChild(menu);

  function isDark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }

  function applyTheme(dark) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('pg-theme', dark ? 'dark' : 'light');
    const btn = document.getElementById('theme-toggle');
    btn.innerHTML = dark ? SUN : MOON;
    btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  }

  function setMenuOpen(open) {
    const btn = document.getElementById('menu-toggle');
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', !open);
    btn.innerHTML = open ? CLOSE : HAMBURGER;
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    btn.setAttribute('aria-expanded', open);
    if (open) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = scrollbarWidth + 'px';
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.paddingRight = '';
      document.body.style.overflow = '';
    }
  }

  document.getElementById('theme-toggle').addEventListener('click', function () {
    applyTheme(!isDark());
  });

  document.getElementById('menu-toggle').addEventListener('click', function () {
    setMenuOpen(!menu.classList.contains('is-open'));
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) setMenuOpen(false);
  });

  applyTheme(isDark());
})();
