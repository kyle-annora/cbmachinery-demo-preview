/* Isolated review master; no live site-shell styles or behavior are loaded. */
(() => {
  const mount = document.querySelector('[data-review-header]');
  if (!mount) return;
  mount.style.display = 'contents';
  const base = '/cbmachinery-demo-preview/review-kit/site-foundation/';
  const icon = name => globalThis.CB_PAGES_HTML(`<img class="sf-nav-icon" src="/cbmachinery-demo-preview/review-kit/icons/${name}.svg" alt="">`);
  const quote = '/request/?source=website&sitePage=machines';
  const social = (mobile = false) => [
    ['Facebook', 'facebook-f', 'https://www.facebook.com/cbmachinery/'],
    ['X', 'x-twitter', 'https://twitter.com/cbmachinery'],
    ['Instagram', 'instagram', 'https://www.instagram.com/cbmachinery/'],
    ['YouTube', 'youtube', 'https://www.youtube.com/@cbmachinery']
  ].map(([label, name, href]) => globalThis.CB_PAGES_HTML(`<a${mobile ? ' class="sf-control sf-icon-control"' : ''} href="${href}" aria-label="C&B on ${label}">${icon(name)}</a>`)).join('');
  const links = [
    ['machines', 'Machines', `${base}swing-arm/`],
    ['services', 'Services', `${base}spindle-rebuild/`],
    ['applications', 'Applications', `${base}powertrain/`],
    ['inventory', 'Inventory', '/inventory/'],
    ['resources', 'Resources', '/resources/']
  ];
  const pages = [
    ['Swing-arm grinding', 'Machine', `${base}swing-arm/`, 'machines swing arm double disc grinding'],
    ['Double-disc grinding', 'Machine family', '/machines/double-disc/', 'machines robotic automation double disc'],
    ['Clamp-bore grinding', 'Machine family', '/machines/clamp-bore/', 'machines clamp bore spindle'],
    ['Powertrain applications', 'Application', `${base}powertrain/`, 'powertrain automotive transmission ring gear'],
    ['Spindle rebuilds', 'Service', `${base}spindle-rebuild/`, 'services rebuild repair spindle maintenance'],
    ['Machine inventory', 'Equipment', '/inventory/', 'inventory stock available machines'],
    ['Resources & insights', 'Resources', '/resources/', 'resources videos guides grinding'],
    ['My projects', 'Saved inquiries and quotations', '/projects/', 'projects inquiry quotation saved resume'],
    ['About C&B Machinery', 'Company', '/about-us/', 'about michigan company'],
    ['Contact C&B', 'Company', '/contact-us/', 'contact sales phone email']
  ];
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
        <a class="sf-control sf-quote" href="${quote}"><span class="sf-quote-full">Request a Quote</span><span class="sf-quote-short">Quote</span></a>
        <button class="sf-control sf-icon-control sf-mobile-toggle" type="button" data-toggle="mobile" aria-label="Open navigation" aria-expanded="false" aria-controls="sf-mobile-menu">${icon('menu')}</button>
      </div>
    </div>
    <section class="sf-panel" id="sf-machine-menu" data-panel="machines" aria-labelledby="sf-machine-title" hidden>
      <div class="sf-panel-heading"><h2 id="sf-machine-title">Grinding machines</h2><button class="sf-control sf-icon-control" type="button" data-close aria-label="Close machines menu">${icon('x')}</button></div>
      <div class="sf-directory">
        <a class="sf-machine-link" href="/cbmachinery-demo-preview/machines/robotic-double-disc/"><span class="sf-machine-image"><img src="/cbmachinery-demo-preview/assets/machine.png" alt="Double-disc grinder with robotic handling" width="112" height="82"></span><span><strong>Double-disc grinding</strong><small>Explore the system and its process.</small></span></a>
        <a class="sf-machine-link" href="/cbmachinery-demo-preview/machines/clamp-bore/"><span class="sf-machine-image"><img src="/cbmachinery-demo-preview/assets/clamp-bore.png" alt="C&B clamp-bore grinder" width="112" height="82"></span><span><strong>Clamp-bore grinding</strong><small>Face grinding with part location.</small></span></a>
        <div class="sf-directory-links"><a class="sf-control" href="${base}swing-arm/">Swing-arm grinding${icon('arrow-right')}</a><a class="sf-control" href="/cbmachinery-demo-preview/machines/">All grinding machines</a><a class="sf-control" href="/cbmachinery-demo-preview/rebuilds/">Machine rebuilding</a></div>
      </div>
    </section>
    <section class="sf-panel sf-search-panel" id="sf-search-menu" data-panel="search" aria-labelledby="sf-search-title" hidden>
      <div class="sf-panel-heading"><h2 id="sf-search-title">Search C&B</h2><button class="sf-control sf-icon-control" type="button" data-close aria-label="Close search">${icon('x')}</button></div>
      ${searchField('sf-desktop-search')}<div class="sf-search-results" data-search-results="desktop" aria-live="polite"></div>
    </section>
    <div class="sf-panel sf-mobile-panel" id="sf-mobile-menu" data-panel="mobile" hidden>
      ${searchField('sf-mobile-search')}<div class="sf-search-results" data-search-results="mobile" aria-live="polite" hidden></div>
      <nav class="sf-mobile-links" aria-label="Mobile navigation">${links.map(([section, label, href]) => globalThis.CB_PAGES_HTML(`<a class="sf-control sf-navitem" data-section-link="${section}" href="${href}">${label}${icon('chevron-right')}</a>`)).join('')}</nav>
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
    const section = aliases[value] || value || 'machines';
    header.querySelectorAll('[data-section-link]').forEach(control => {
      const current = control.dataset.sectionLink === section;
      control.dataset.current = String(current);
      if (current) control.setAttribute('aria-current', globalThis.CB_PAGES_PATH(control.getAttribute('href')) === globalThis.CB_PAGES_PATH() ? 'page' : 'location');
      else control.removeAttribute('aria-current');
    });
    const origin = section === 'services' ? 'services' : section === 'applications' ? 'applications' : 'machines';
    header.querySelector('.sf-quote').href = globalThis.CB_PAGES_URL(document.body.dataset.inquiryUrl || `/request/?source=website&sitePage=${origin}`);
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
    matches.forEach(([title, type, href]) => {
      const a = document.createElement('a'); a.className = 'sf-search-result'; a.href = globalThis.CB_PAGES_URL(href);
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
    if (trigger) openPanel(trigger.dataset.toggle, trigger);
    else if (event.target.closest('[data-close]')) closePanel(true);
    else if (event.target.closest('a')) closePanel();
  });
  header.addEventListener('keydown', event => {
    const trigger = event.target.closest('[data-toggle="machines"]');
    if (trigger && event.key === 'ArrowDown') {
      event.preventDefault(); if (open !== 'machines') openPanel('machines', trigger);
      header.querySelector('[data-panel="machines"] a').focus();
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
  applySection(document.body.dataset.section);
  document.querySelectorAll('[data-sf-section]').forEach(button => {
    button.addEventListener('click', () => {
      document.body.dataset.section = button.dataset.sfSection; applySection(button.dataset.sfSection); closePanel();
      document.querySelectorAll('[data-sf-section]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      const status = document.querySelector('[data-sf-section-status]');
      if (status) status.textContent = `${button.textContent.trim()} is the current section. Open the header to review its states.`;
    });
  });
})();
