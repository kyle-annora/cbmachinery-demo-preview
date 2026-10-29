(() => {
  const track = (name, detail = {}) => {
    try {
      const key = 'cb-demo-v1:events';
      const stored = JSON.parse(localStorage.getItem(key)) || [];
      const events = Array.isArray(stored) ? stored : [];
      events.push({ name, at: new Date().toISOString(), ...detail });
      localStorage.setItem(key, JSON.stringify(events.slice(-100)));
    } catch {}
  };
  track(globalThis.CB_PAGES_PATH().startsWith('/machines/') ? 'machine_view' : globalThis.CB_PAGES_PATH() === '/' ? 'home_view' : globalThis.CB_PAGES_PATH().startsWith('/applications/') ? 'application_view' : 'site_page_view', { path: globalThis.CB_PAGES_PATH() });
  let homeExplorerEngaged = false;
  const markExplorerEngaged = event => { if (event.target.closest?.('[data-machine-presentation]')) homeExplorerEngaged = true; };
  document.addEventListener('pointerdown', markExplorerEngaged, true);
  document.addEventListener('click', markExplorerEngaged, true);
  document.addEventListener('keydown', event => { if (['Enter',' '].includes(event.key)) markExplorerEngaged(event); }, true);
  document.addEventListener('cb:explorer-focus', event => {
    if (globalThis.CB_PAGES_PATH() === '/' && !homeExplorerEngaged) return;
    const href = event.detail?.href;
    if (!href?.startsWith('/request/?')) return;
    window.CB_SITE_QUOTE = href;
    document.querySelectorAll('[data-context-quote], .nav-quote, .app-quote a[href^="/cbmachinery-demo-preview/request/"], .cb-footer a[href^="/cbmachinery-demo-preview/request/"]').forEach(link => link.href = globalThis.CB_PAGES_URL(href));
  });
  document.addEventListener('click', event => {
    if (event.target.closest('a[href^="/cbmachinery-demo-preview/request/"]')) track('intake_cta_click', { source: globalThis.CB_PAGES_PATH() });
  });
  const $ = selector => document.querySelector(selector);
  const announcementClose = $('.announcement-close');
  announcementClose?.addEventListener('click', () => $('.announcement')?.remove());
  // The sf navigation owns its menu behavior; tracking/context above remains shared.
  if (document.querySelector('[data-site-header]') && window.CB_SITE_SECTION !== undefined) return;
  const trigger = $('[data-menu="machines"]');
  const menu = $('#machines-menu');
  const searchTrigger = $('.search-trigger');
  const searchPanel = $('#search-panel');
  const mobileTrigger = $('.mobile-menu');
  const nav = $('#main-nav');
  if (!trigger || !menu || !searchTrigger || !searchPanel || !mobileTrigger || !nav) return;
  const setNav = open => {
    nav.classList.toggle('open', open);
    mobileTrigger.setAttribute('aria-expanded', String(open));
    mobileTrigger.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  };
  const closePanels = () => {
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    searchPanel.hidden = true;
    searchTrigger.setAttribute('aria-expanded', 'false');
  };
  const machineFocus = () => (matchMedia('(max-width:1000px)').matches ? mobileTrigger : trigger).focus();
  trigger.addEventListener('click', () => {
    const open = menu.hidden;
    closePanels(); setNav(false);
    menu.hidden = !open; trigger.setAttribute('aria-expanded', String(open));
    if (open && matchMedia('(max-width:1000px)').matches) menu.querySelector('a').focus();
  });
  $('.menu-close').addEventListener('click', () => { closePanels(); machineFocus(); });
  mobileTrigger.addEventListener('click', () => { const open = !nav.classList.contains('open'); closePanels(); setNav(open); });
  const pages = window.CB_SITE_PAGES || [
    ['Explore the robotic double-disc system','Interactive machine explorer','/machines/robotic-double-disc/','robot robotic machine explorer 3d double disc equipment automation'],
    ['Ring gear face grinding','Application','/applications/ring-gear-grinding/','ring gear surfaces part'],
    ['Request a quote','Guided inquiry','/request/?application=ring-gear&source=ring-gear','request quote inquiry price contact'],
    ['Double-disc grinding machines','Official C&B website','https://www.cbmachinery.com/machines/double-disc/','double disc machine grinding automation horizontal vertical'],
    ['Clamp-bore face grinders','Official C&B website','https://www.cbmachinery.com/machines/clamp-bore/','clamp bore spindle machine'],
    ['Machine rebuilding','Official C&B website','https://www.cbmachinery.com/machines/rebuilds/','rebuild remanufacture gardner'],
    ['Machine services','Official C&B website','https://www.cbmachinery.com/services/','support repair service retrofit'],
    ['Contact C&B Machinery','Official C&B website','https://www.cbmachinery.com/contact-us/','contact phone email address']
  ];
  const results = $('#search-results');
  function search(value) {
    const terms = value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const matches = pages.filter(page => terms.every(term => `${page[0]} ${page[3]}`.toLowerCase().includes(term)));
    results.replaceChildren();
    if (!matches.length) {
      const empty = document.createElement('p'); empty.className = 'no-results'; empty.textContent = 'No matching page. Try “grinding”, “rebuild” or “contact”.'; results.append(empty); return;
    }
    matches.forEach(([title, category, url]) => {
      const a = document.createElement('a'); a.className = 'search-result'; a.href = globalThis.CB_PAGES_URL(title === 'Request a quote' ? ($('.nav-quote')?.getAttribute('href') || url) : url);
      const text = document.createElement('span'); text.append(title);
      const small = document.createElement('small'); small.textContent = category; text.append(small);
      const icon = document.createElement('img'); icon.className = 'icon'; icon.alt = ''; icon.src = '/cbmachinery-demo-preview/review-kit/icons/arrow-up-right.svg';
      a.append(text, icon); results.append(a);
    });
  }
  searchTrigger.addEventListener('click', () => {
    const open = searchPanel.hidden; closePanels(); setNav(false);
    if (open) { searchPanel.hidden = false; searchTrigger.setAttribute('aria-expanded','true'); search($('#site-search').value); $('#site-search').focus(); }
  });
  $('.search-close').addEventListener('click', () => { closePanels(); searchTrigger.focus(); });
  $('#site-search').addEventListener('input', event => search(event.target.value));
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (!searchPanel.hidden) { closePanels(); searchTrigger.focus(); }
    else if (!menu.hidden) { closePanels(); machineFocus(); }
    else if (nav.classList.contains('open')) { setNav(false); mobileTrigger.focus(); }
  });
  document.addEventListener('click', event => { if (!event.target.closest('.site-header')) { closePanels(); setNav(false); } });
})();
