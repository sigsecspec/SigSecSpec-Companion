// Global shared JS: theme toggle, ripple, safe utilities
(function(){
  const THEME_KEY = 'sss_theme';
  const LARGE_KEY = 'sss_large';

  function getSavedTheme(){ try{ return localStorage.getItem(THEME_KEY) || ''; }catch{ return ''; } }
  function saveTheme(v){ try{ localStorage.setItem(THEME_KEY, v); }catch{} }

  function setThemeColorMeta(hex){
    try {
      let meta = document.querySelector('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'theme-color');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', hex);
    } catch {}
  }

  function applyTheme(theme){
    const html = document.documentElement;
    if (!theme) {
      // Follow system
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      html.removeAttribute('data-theme');
      html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      setThemeColorMeta(prefersDark ? '#0f0f0f' : '#f7f7f5');
      return prefersDark ? 'dark' : 'light';
    }
    html.setAttribute('data-theme', theme);
    setThemeColorMeta(theme === 'dark' ? '#0f0f0f' : '#f7f7f5');
    return theme;
  }

  function initTheme(){
    const saved = getSavedTheme();
    const active = applyTheme(saved);
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
      toggle.setAttribute('aria-pressed', active === 'dark');
      toggle.textContent = active === 'dark' ? '☾' : '☀';
    }
  }

  function toggleTheme(){
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    saveTheme(next);
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
      toggle.setAttribute('aria-pressed', next === 'dark');
      toggle.textContent = next === 'dark' ? '☾' : '☀';
    }
  }

  function toggleLarge(){
    document.body.classList.toggle('text-lg');
    try{ localStorage.setItem(LARGE_KEY, document.body.classList.contains('text-lg')); }catch{}
  }

  function restoreLarge(){
    try{ if(localStorage.getItem(LARGE_KEY)==='true') document.body.classList.add('text-lg'); }catch{}
  }

  function attachRipple(e){
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = size + 'px';
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left - size / 2;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top - size / 2;
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    container.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }

  function bindRippleScope(scope){
    (scope || document).querySelectorAll('.ripple-container').forEach(el => {
      el.addEventListener('click', attachRipple, { passive: true });
      el.addEventListener('touchstart', attachRipple, { passive: true });
    });
  }

  // Expose small API
  window.SSS = {
    toggleTheme,
    initTheme,
    toggleLarge,
    attachRipple,
    bindRippleScope,
  };

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    restoreLarge();
    bindRippleScope(document);

    // Listen to system theme changes if user follows system
    try {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener?.('change', () => {
        if (!localStorage.getItem(THEME_KEY)) applyTheme('');
      });
    } catch {}

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(()=>{});
    }
  });
})();
