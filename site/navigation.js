/* Live shared navigation derived from the approved site-foundation master. */
(() => {
  const mount = document.querySelector('[data-site-header]');
  if (!mount || mount.dataset.sfMounted === 'true') return;
  mount.dataset.sfMounted = 'true';
  mount.style.display = 'contents';
  const icon = name => globalThis.CB_PAGES_HTML(`<img class="sf-nav-icon" src="/cbmachinery-demo-preview/review-kit/icons/${name}.svg" alt="">`);
  const machineFamilies = [
    { title: 'Double-disc grinding', caption: 'Horizontal and vertical configurations.', href: '/machines/double-disc/', image: '/cbmachinery-demo-preview/assets/nav-double-disc.webp', width: 693, height: 520 },
    { title: 'Clamp-bore face grinding', caption: 'Single- and double-spindle configurations.', href: '/machines/clamp-bore/', image: '/cbmachinery-demo-preview/assets/nav-clamp-bore.webp', width: 537, height: 520 }
  ];
  const machineCards = () => machineFamilies.map(machine => globalThis.CB_PAGES_HTML(`<a class="sf-machine-link" href="${machine.href}"><span class="sf-machine-image"><img src="${machine.image}" alt="" width="${machine.width}" height="${machine.height}"></span><span class="sf-machine-copy"><strong>${machine.title}${icon('arrow-right')}</strong><small>${machine.caption}</small></span></a>`)).join('');
  const configurationGroups = [
    { title: 'Double-disc', links: [
      ['Horizontal', '/machines/double-disc/horizontal/'],
      ['Vertical', '/machines/double-disc/vertical/']
    ] },
    { title: 'Clamp-bore', links: [
      ['Single spindle', '/machines/clamp-bore/single-spindle/'],
      ['Double spindle', '/machines/clamp-bore/double-spindle/']
    ] }
  ];
  const configurationLinks = () => globalThis.CB_PAGES_HTML(`<div class="sf-configuration-groups">${configurationGroups.map(group => globalThis.CB_PAGES_HTML(`<div class="sf-configuration-group"><h3>${group.title}</h3><ul class="sf-configuration-links">${group.links.map(([title, href]) => globalThis.CB_PAGES_HTML(`<li><a href="${href}">${title}</a></li>`)).join('')}</ul></div>`)).join('')}</div>`);
  const quote = window.CB_SITE_QUOTE || '/request/?source=website&sitePage=home';
  const social = (mobile = false) => [
    ['Facebook', 'facebook-f', 'https://www.facebook.com/cbmachinery/'],
    ['X', 'x-twitter', 'https://twitter.com/cbmachinery'],
    ['Instagram', 'instagram', 'https://www.instagram.com/cbmachinery/'],
    ['YouTube', 'youtube', 'https://www.youtube.com/@cbmachinery']
  ].map(([label, name, href]) => globalThis.CB_PAGES_HTML(`<a${mobile ? ' class="sf-control sf-icon-control"' : ''} href="${href}" aria-label="C&B on ${label}">${icon(name)}</a>`)).join('');
  const links = [
    ['machines', 'Machines', '/machines/'],
    ['services', 'Services', '/services/'],
    ['applications', 'Applications', '/applications/'],
    ['inventory', 'Inventory', '/inventory/'],
    ['resources', 'Resources', '/resources/']
  ];
  const pages = [...(window.CB_SITE_PAGES || [])];
  const searchField = id => `<label class="sf-search-field" for="${id}">${icon('search')}<input id="${id}" type="search" placeholder="Search C&B…" aria-label="Search machines, applications and services" autocomplete="off"></label>`;
  mount.innerHTML = globalThis.CB_PAGES_HTML(`<header class="sf-header" aria-label="C&B site header">
    <div class="sf-utility"><div class="sf-nav-inner sf-utility-inner">
      <div class="sf-utility-group"><a href="tel:+12482649800">${icon('phone')}+1 248.264.9800</a><a href="mailto:sales@cbmachinery.com">${icon('mail')}sales@cbmachinery.com</a></div>
      <div class="sf-utility-group"><div class="sf-utility-group sf-utility-socials">${social()}</div><a href="/cbmachinery-demo-preview/about-us/">About Us</a><a href="/cbmachinery-demo-preview/contact-us/">Contact Us</a></div>
    </div></div>
    <div class="sf-nav-inner sf-nav-row">
      <a class="sf-nav-logo" href="/cbmachinery-demo-preview/" aria-label="C&B Machinery home"><img src="/cbmachinery-demo-preview/assets/logo.webp" width="164" height="40" alt="C&B Machinery"></a>
      <nav class="sf-main-nav" aria-label="Main navigation">
        <button class="sf-control sf-navitem" type="button" data-section-link="machines" data-toggle="machines" aria-expanded="false" aria-controls="sf-machine-menu">Machines${icon('chevron-down')}</button>
        ${links.slice(1).map(([section, label, href]) => globalThis.CB_PAGES_HTML(`<a class="sf-control sf-navitem" data-section-link="${section}" href="${href}">${label}</a>`)).join('')}
      </nav>
      <div class="sf-nav-actions">
        <button class="sf-control sf-icon-control sf-desktop-search" type="button" data-toggle="search" aria-label="Search" aria-expanded="false" aria-controls="sf-search-menu">${icon('search')}</button>
        <a class="sf-control sf-projects" data-section-link="projects" href="/cbmachinery-demo-preview/projects/">${icon('file-text')}<span>My projects</span></a>
        <a class="sf-control sf-quote" data-context-quote href="${quote}"><span class="sf-quote-full">Request a Quote</span><span class="sf-quote-short">Quote</span></a>
        <button class="sf-control sf-icon-control sf-mobile-toggle" type="button" data-toggle="mobile" aria-label="Open navigation" aria-expanded="false" aria-controls="sf-mobile-menu">${icon('menu')}</button>
      </div>
    </div>
    <section class="sf-panel sf-machine-panel" id="sf-machine-menu" data-panel="machines" aria-labelledby="sf-machine-title" hidden>
      <div class="sf-panel-heading"><h2 id="sf-machine-title">Grinding machines</h2><div class="sf-machine-heading-actions"><a class="sf-control sf-machine-overview" href="/cbmachinery-demo-preview/machines/">All machines${icon('arrow-right')}</a><button class="sf-control sf-icon-control" type="button" data-close aria-label="Close machines menu">${icon('x')}</button></div></div>
      <div class="sf-directory">${machineCards()}<nav class="sf-configuration-column" aria-label="Machine configurations"><p class="sf-configuration-label">Browse configurations</p>${configurationLinks()}</nav></div>
    </section>
    <section class="sf-panel sf-search-panel" id="sf-search-menu" data-panel="search" aria-labelledby="sf-search-title" hidden>
      <div class="sf-panel-heading"><h2 id="sf-search-title">Search C&B</h2><button class="sf-control sf-icon-control" type="button" data-close aria-label="Close search">${icon('x')}</button></div>
      ${searchField('sf-desktop-search')}<div class="sf-search-results" data-search-results="desktop" aria-live="polite"></div>
    </section>
    <div class="sf-panel sf-mobile-panel" id="sf-mobile-menu" data-panel="mobile" hidden>
      ${searchField('sf-mobile-search')}<div class="sf-search-results" data-search-results="mobile" aria-live="polite" hidden></div>
      <nav class="sf-mobile-links" aria-label="Mobile navigation"><div class="sf-mobile-machine-group"><a class="sf-control sf-navitem sf-mobile-machines-overview" data-section-link="machines" href="/cbmachinery-demo-preview/machines/">Machines<span>View all${icon('arrow-right')}</span></a><div class="sf-mobile-machine-list">${machineCards()}</div><details class="sf-mobile-configurations"><summary>Browse configurations${icon('chevron-down')}</summary>${configurationLinks()}</details></div>${links.slice(1).map(([section, label, href]) => globalThis.CB_PAGES_HTML(`<a class="sf-control sf-navitem" data-section-link="${section}" href="${href}">${label}${icon('chevron-right')}</a>`)).join('')}</nav>
      <div class="sf-mobile-contact"><a class="sf-control" href="tel:+12482649800">${icon('phone')}+1 248.264.9800</a><a class="sf-control" href="mailto:sales@cbmachinery.com">${icon('mail')}sales@cbmachinery.com</a></div>
      <div class="sf-mobile-company"><a class="sf-control" href="/cbmachinery-demo-preview/about-us/">About Us</a><a class="sf-control" href="/cbmachinery-demo-preview/contact-us/">Contact Us</a></div>
      <div class="sf-mobile-socials" aria-label="C&B social channels">${social(true)}</div>
    </div>
  </header>`);
  const header = mount.querySelector('.sf-header');
  const mobile = matchMedia('(max-width: 1100px)');
  let open = null;
  let opener = null;
  function applySection(value) {
    const aliases = { machine: 'machines', application: 'applications', service: 'services', 'swing-arm': 'machines', powertrain: 'applications', 'spindle-rebuild': 'services', rebuilds: 'services' };
    const section = aliases[value] || value || '';
    header.querySelectorAll('[data-section-link]').forEach(control => {
      const current = control.dataset.sectionLink === section;
      control.dataset.current = String(current);
      if (current) control.setAttribute('aria-current', globalThis.CB_PAGES_PATH(control.getAttribute('href')) === globalThis.CB_PAGES_PATH() ? 'page' : 'location');
      else control.removeAttribute('aria-current');
    });
    header.querySelector('.sf-quote').href = globalThis.CB_PAGES_URL(window.CB_SITE_QUOTE || quote);
  }
  function updateAvailable() {
    const bottom = header.getBoundingClientRect().bottom;
    const viewport = window.visualViewport?.height || window.innerHeight;
    header.style.setProperty('--sf-panel-available', `${Math.max(120, viewport - bottom - 12)}px`);
  }
  function closePanel(restore = false) {
    header.querySelectorAll('[data-panel]').forEach(panel => { panel.hidden = true; });
    header.querySelectorAll('[data-toggle]').forEach(button => button.setAttribute('aria-expanded', 'false'));
    const toggle = header.querySelector('.sf-mobile-toggle');
    toggle.setAttribute('aria-label', 'Open navigation');
    toggle.querySelector('img').src = '/cbmachinery-demo-preview/review-kit/icons/menu.svg';
    const previous = opener;
    open = null; opener = null;
    if (restore && previous?.getClientRects().length) previous.focus();
  }
  function renderSearch(input, target, showAll = false) {
    const terms = input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    target.replaceChildren();
    target.hidden = !showAll && !terms.length;
    if (target.hidden) return;
    const matches = pages.filter(page => terms.every(term => `${page[0]} ${page[1]} ${page[3]}`.toLowerCase().includes(term)));
    if (!matches.length) {
      const p = document.createElement('p'); p.className = 'sf-search-empty'; p.textContent = 'No matching pages. Try “grinding”, “powertrain” or “spindle”.'; target.append(p); return;
    }
    const visibleMatches = terms.length ? matches : matches.filter(page => ['/', '/machines/', '/applications/', '/services/', '/projects/'].includes(page[2]));
    visibleMatches.forEach(([title, type, href]) => {
      const a = document.createElement('a'); a.className = 'sf-search-result'; a.href = globalThis.CB_PAGES_URL(href === '/request/' ? (window.CB_SITE_QUOTE || href) : href);
      const text = document.createElement('span');
      const strong = document.createElement('strong'); strong.textContent = title;
      const small = document.createElement('small'); small.textContent = type;
      const arrow = document.createElement('img'); arrow.className = 'sf-nav-icon'; arrow.src = '/cbmachinery-demo-preview/review-kit/icons/arrow-right.svg'; arrow.alt = '';
      text.append(strong, small); a.append(text, arrow); target.append(a);
    });
  }
  function openPanel(name, trigger) {
    const wasOpen = open === name;
    closePanel();
    if (wasOpen) return;
    open = name; opener = trigger;
    const panel = header.querySelector(`[data-panel="${name}"]`);
    panel.hidden = false; trigger.setAttribute('aria-expanded', 'true'); updateAvailable();
    if (name === 'search') {
      const input = panel.querySelector('input'); renderSearch(input, panel.querySelector('[data-search-results]'), true); input.focus();
    } else if (name === 'mobile') {
      trigger.setAttribute('aria-label', 'Close navigation'); trigger.querySelector('img').src = '/cbmachinery-demo-preview/review-kit/icons/x.svg';
      const input = panel.querySelector('input'); input.value = '';
      renderSearch(input, panel.querySelector('[data-search-results]'));
      panel.querySelector('.sf-mobile-links').hidden = false;
      panel.querySelector('.sf-mobile-links a').focus();
    }
  }
  header.addEventListener('click', event => {
    const trigger = event.target.closest('[data-toggle]');
    if (trigger) {
      openPanel(trigger.dataset.toggle, trigger);
      if (open === 'machines' && event.detail === 0) header.querySelector('#sf-machine-menu .sf-machine-link').focus();
    }
    else if (event.target.closest('[data-close]')) closePanel(true);
    else if (event.target.closest('a')) closePanel();
  });
  header.addEventListener('keydown', event => {
    const trigger = event.target.closest('[data-toggle="machines"]');
    if (trigger && event.key === 'ArrowDown') {
      event.preventDefault(); if (open !== 'machines') openPanel('machines', trigger);
      header.querySelector('#sf-machine-menu .sf-machine-link').focus();
    }
  });
  ['desktop', 'mobile'].forEach(kind => {
    const input = header.querySelector(`#sf-${kind}-search`);
    const results = header.querySelector(`[data-search-results="${kind}"]`);
    input.addEventListener('input', () => {
      renderSearch(input, results, kind === 'desktop');
      if (kind === 'mobile') header.querySelector('.sf-mobile-links').hidden = Boolean(input.value.trim());
      updateAvailable();
    });
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && open) { event.preventDefault(); closePanel(true); } });
  document.addEventListener('pointerdown', event => { if (open && !header.contains(event.target)) closePanel(); });
  document.addEventListener('focusin', event => { if (open && !header.contains(event.target)) closePanel(); });
  window.addEventListener('resize', updateAvailable, { passive: true });
  window.addEventListener('scroll', () => { if (open) updateAvailable(); }, { passive: true });
  window.visualViewport?.addEventListener('resize', updateAvailable, { passive: true });
  mobile.addEventListener('change', () => {
    const focused = header.contains(document.activeElement); closePanel();
    if (focused) (mobile.matches ? header.querySelector('.sf-mobile-toggle') : header.querySelector('[data-toggle="machines"]')).focus();
  });
  applySection(window.CB_SITE_SECTION);
  const workflow = /^\/request(?:\.html|\/|$)/.test(globalThis.CB_PAGES_PATH());
  if (workflow) {
    header.querySelector('.sf-quote-full').textContent = 'Your inquiry';
    header.querySelector('.sf-quote-short').textContent = 'Inquiry';
    header.querySelector('.sf-quote').href = '#workspace';
  }
  fetch('/cbmachinery-demo-preview/site/navigation-index.json').then(response => {
    if (!response.ok) throw new Error('Navigation index unavailable');
    return response.json();
  }).then(index => {
    if (!Array.isArray(index.pages)) return;
    pages.splice(0, pages.length, ...index.pages.filter(page => Array.isArray(page) && page.length >= 4 && typeof page[2] === 'string' && page[2].startsWith('/') && !page[2].startsWith('//')));
    window.CB_SITE_PAGES = pages;
    if (open === 'search') renderSearch(header.querySelector('#sf-desktop-search'), header.querySelector('[data-search-results="desktop"]'), true);
    if (open === 'mobile') renderSearch(header.querySelector('#sf-mobile-search'), header.querySelector('[data-search-results="mobile"]'));
  }).catch(() => { /* The compact local fallback remains searchable. */ });
})();
