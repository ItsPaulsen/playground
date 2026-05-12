(function () {
  const MOON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/></svg>`;
  const SUN  = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;

  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300..700&display=swap';
  document.head.prepend(fontLink);

  const style = document.createElement('style');
  style.textContent = `
    :root { --header-h: 48px; }
    body  { padding-top: var(--header-h); }

    #site-header {
      position: fixed; top: 0; left: 0; right: 0;
      height: var(--header-h); z-index: 200;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 24px; box-sizing: border-box;
      background: rgba(245,245,244,.80);
      backdrop-filter: blur(6px) saturate(180%);
      font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
    }
    @media (max-width: 639px) {
      #site-header { padding: 0 16px; }
    }
    html[data-theme="dark"] #site-header {
      background: rgba(12,10,9,.80);
    }

    html[data-page="wave"] #site-header {
      background: transparent;
      backdrop-filter: none;
    }

    .site-logo {
      font-size: 18px; font-weight: 500; letter-spacing: -0.01em;
      color: #1c1917; text-decoration: none;
    }
    html[data-theme="dark"] .site-logo { color: #fafaf9; }

    #theme-toggle {
      width: 36px; height: 36px; border: 0; border-radius: 12px;
      background: transparent; color: rgba(28,25,23,.80);
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: color .15s;
      margin-right: -10px;
    }
    #theme-toggle:hover { color: #1c1917; }
    html[data-theme="dark"] #theme-toggle { color: rgba(250,250,249,.80); }
    html[data-theme="dark"] #theme-toggle:hover { color: #fafaf9; }
  `;
  document.head.appendChild(style);

  const header = document.createElement('header');
  header.id = 'site-header';
  header.innerHTML = `<a class="site-logo" href="/">Paulsen</a><button id="theme-toggle"></button>`;
  document.body.prepend(header);

  function isDark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }

  function applyTheme(dark) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('pg-theme', dark ? 'dark' : 'light');
    const btn = document.getElementById('theme-toggle');
    btn.innerHTML = dark ? SUN : MOON;
    btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  }

  document.getElementById('theme-toggle').addEventListener('click', function () {
    applyTheme(!isDark());
  });

  applyTheme(isDark());
})();
