(() => {
  const track = (name, detail = {}) => {
    try {
      const key = 'cb-demo-v1:events';
      const events = JSON.parse(localStorage.getItem(key)) || [];
      events.push({ name, at: new Date().toISOString(), ...detail });
      localStorage.setItem(key, JSON.stringify(events.slice(-100)));
    } catch {}
  };
  track(globalThis.CB_PAGES_PATH().includes('ring-gear') ? 'application_view' : 'home_view', { path: globalThis.CB_PAGES_PATH() });
  document.querySelectorAll('a[href^="/cbmachinery-demo-preview/request/"]').forEach(link => link.addEventListener('click', () => track('intake_cta_click', { source: globalThis.CB_PAGES_PATH() })));
  const menu = document.querySelector('.site-menu');
  const nav = document.querySelector('.site-nav');
  menu?.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    nav.dataset.open = String(open);
  });
  nav?.addEventListener('click', event => {
    if (event.target.closest('a')) {
      nav.dataset.open = 'false';
      menu?.setAttribute('aria-expanded', 'false');
      menu?.setAttribute('aria-label', 'Open navigation');
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav?.dataset.open === 'true') {
      nav.dataset.open = 'false';
      menu.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-label', 'Open navigation');
      menu.focus();
    }
  });
  const tabs = [...document.querySelectorAll('[role=tab]')];
  const activate = tab => {
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
    });
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      activate(tabs[next]);
      tabs[next].focus();
    });
  });
})();

document.addEventListener('error', ev => { if(ev.target?.tagName === 'IMG') { const fallback=document.createElement('span'); fallback.className='image-fallback'; fallback.textContent=ev.target.alt || 'Image unavailable'; ev.target.replaceWith(fallback); } }, true);
