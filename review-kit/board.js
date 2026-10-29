(() => {
  const $ = selector => document.querySelector(selector);
  const tabs = [...document.querySelectorAll('[data-view]')];
  const panels = [...document.querySelectorAll('[role="tabpanel"]')];
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function showView(name, updateHash = true) {
    if (!tabs.some(tab => tab.dataset.view === name)) name = 'homepage';
    tabs.forEach(tab => { const active = tab.dataset.view === name; tab.setAttribute('aria-selected', active); tab.tabIndex = active ? 0 : -1; });
    panels.forEach(panel => panel.hidden = panel.id !== 'panel-' + name);
    closeMenus();
    if (updateHash) globalThis.CB_PAGES_REPLACE_STATE(null, '', '#' + name);
    document.title = 'C&B Machinery — ' + tabs.find(tab => tab.dataset.view === name).querySelector('span').textContent + ' review';
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => showView(tab.dataset.view));
    tab.addEventListener('keydown', event => {
      let target;
      if (event.key === 'ArrowRight') target = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') target = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') target = 0;
      else if (event.key === 'End') target = tabs.length - 1;
      else return;
      event.preventDefault(); showView(tabs[target].dataset.view); tabs[target].focus();
    });
  });
  window.addEventListener('hashchange', () => showView(location.hash.slice(1), false));

  const machineTrigger = $('[data-menu="machines"]');
  const machineMenu = $('#machines-menu');
  const searchTrigger = $('.search-trigger');
  const searchPanel = $('#search-panel');
  const mobileTrigger = $('.mobile-menu');
  function closeMenus() {
    machineMenu.hidden = true; machineTrigger.setAttribute('aria-expanded', 'false');
    searchPanel.hidden = true; searchTrigger.setAttribute('aria-expanded', 'false');
  }
  function openMachines() {
    closeMenus(); machineMenu.hidden = false; machineTrigger.setAttribute('aria-expanded', 'true');
    $('#main-nav').classList.remove('open'); mobileTrigger.setAttribute('aria-expanded', 'false'); mobileTrigger.setAttribute('aria-label', 'Open navigation');
  }
  machineTrigger.addEventListener('click', () => { const wasOpen = !machineMenu.hidden; closeMenus(); if (!wasOpen) openMachines(); });
  $('[data-open-machines]')?.addEventListener('click', () => { openMachines(); $('.site-header').scrollIntoView({block:'start'}); machineMenu.querySelector('a').focus({preventScroll:true}); });
  function returnMachineFocus() { (matchMedia('(max-width: 800px)').matches ? mobileTrigger : machineTrigger).focus(); }
  $('.menu-close').addEventListener('click', () => { closeMenus(); returnMachineFocus(); });
  mobileTrigger.addEventListener('click', () => { closeMenus(); const open = !$('#main-nav').classList.contains('open'); $('#main-nav').classList.toggle('open', open); mobileTrigger.setAttribute('aria-expanded', open); mobileTrigger.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); });
  $('.announcement-close').addEventListener('click', () => $('.announcement').hidden = true);
  const pages = [
    {title:'Ring gear face grinding',category:'Local demo · Application',url:'/applications/ring-gear-grinding/',keywords:'ring gear part face surfaces application'},
    {title:'Request a quote',category:'Local demo · Guided inquiry',url:'/request/?source=home',keywords:'request quote price inquiry contact project'},
    {title:'Double-disc grinding machines',category:'Official C&B website · Machines',url:'https://www.cbmachinery.com/machines/double-disc/',keywords:'double disc grinder machine horizontal vertical automation'},
    {title:'Clamp-bore face grinders',category:'Official C&B website · Machines',url:'https://www.cbmachinery.com/machines/clamp-bore/',keywords:'clamp bore single double spindle face machine'},
    {title:'Machine rebuilding',category:'Official C&B website · Rebuilds',url:'https://www.cbmachinery.com/machines/rebuilds/',keywords:'rebuild remanufacture restoration gardner besly mattison'},
    {title:'Machine services',category:'Official C&B website · Services',url:'https://www.cbmachinery.com/services/',keywords:'service support spindle automation retrofits repair'},
    {title:'Contact C&B Machinery',category:'Official C&B website · Company',url:'https://www.cbmachinery.com/contact-us/',keywords:'contact email phone michigan address'}
  ];
  function search(query) {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const matches = pages.filter(page => terms.every(term => (page.title + ' ' + page.keywords).toLowerCase().includes(term)));
    $('#search-results').innerHTML = matches.length ? matches.map(page => globalThis.CB_PAGES_HTML(`<a class="search-result" href="${esc(page.url)}"><span>${esc(page.title)}<small>${esc(page.category)}</small></span><img class="icon" src="/cbmachinery-demo-preview/review-kit/icons/arrow-up-right.svg" alt=""></a>`)).join('') : '<p class="no-results">No matching page in this review. Try “grinding”, “rebuild” or “contact”.</p>';
  }
  searchTrigger.addEventListener('click', () => { const wasOpen = !searchPanel.hidden; closeMenus(); if (!wasOpen) { searchPanel.hidden = false; searchTrigger.setAttribute('aria-expanded', 'true'); search($('#site-search').value); $('#site-search').focus(); } });
  $('.search-close').addEventListener('click', () => { closeMenus(); searchTrigger.focus(); });
  $('#site-search').addEventListener('input', event => search(event.target.value));
  document.addEventListener('keydown', event => { if (event.key !== 'Escape') return; if (!searchPanel.hidden) { closeMenus(); searchTrigger.focus(); } else if (!machineMenu.hidden) { closeMenus(); returnMachineFocus(); } else if ($('#main-nav').classList.contains('open')) { $('#main-nav').classList.remove('open'); mobileTrigger.setAttribute('aria-expanded', 'false'); mobileTrigger.setAttribute('aria-label', 'Open navigation'); mobileTrigger.focus(); } });
  document.addEventListener('click', event => { if (!event.target.closest('.site-header') && !event.target.closest('[data-open-machines]')) closeMenus(); });

  showView(location.hash.slice(1), false);
})();
