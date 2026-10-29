import { NODES, TOUR, DETAILS, quoteHref } from './explorer-content.js';

const icon = name => globalThis.CB_PAGES_HTML(`<img class="mx-icon" src="/cbmachinery-demo-preview/review-kit/icons/${name}.svg" alt="">`);
const NODE_ICONS = { machine:'mx-cube', robot:'settings-2', loading:'move-horizontal', grinding:'mx-layers', controls:'mx-panel', ring:'mx-ring', process:'mx-route', requirements:'file-text', next:'arrow-up-right' };
const MACHINE_IDS = ['machine', 'robot', 'loading', 'grinding', 'controls'];
const RING_IDS = ['ring', 'process', 'requirements', 'next'];
const track = (name, detail = {}) => {
  try {
    const stored = JSON.parse(localStorage.getItem('cb-demo-v1:events'));
    const events = Array.isArray(stored) ? stored : [];
    events.push({ name, at: new Date().toISOString(), ...detail });
    localStorage.setItem('cb-demo-v1:events', JSON.stringify(events.slice(-100)));
  } catch {}
};

export function mountMachineExplorer(host) {
  if (host.dataset.explorerMounted) return;
  host.dataset.explorerMounted = 'true';
  const hash = location.hash.slice(1);
  const initial = Object.hasOwn(NODES, hash) ? hash : Object.hasOwn(NODES, host.dataset.start || '') ? host.dataset.start : 'machine';
  const state = {
    node: initial, mode: new URLSearchParams(location.search).get('tour') === '1' && TOUR.includes(initial) ? 'tour' : 'free',
    view: 'model', isolate: false, cutaway: initial === 'grinding',
    face: 'both', process: 'grind', metric: 'diameter', expanded: false, outline: false
  };
  let machine, ring, machinePromise, ringPromise, machineStatus = 'idle', ringStatus = 'idle', activated = false;
  let previousBodyOverflow = '', lastFocused, inertElements = [];
  const uid = 'mx-' + Math.random().toString(36).slice(2, 9);
  host.classList.add('mx-explorer');
  host.setAttribute('role', 'region');
  host.setAttribute('aria-label', 'C&B machine and ring gear explorer');
  host.innerHTML = globalThis.CB_PAGES_HTML(`
    <div class="mx-topbar">
      <div class="mx-identity"><img class="mx-brandmark" src="/cbmachinery-demo-preview/assets/logo.webp" alt="C&B Machinery"><span>Machine explorer</span></div>
      <div class="mx-mode" role="group" aria-label="Explorer mode">
        <button type="button" data-mode="free">Free explore</button>
        <button type="button" data-mode="tour">${icon('play')}Guided tour</button>
      </div>
      <span class="mx-topbar-label">EXPLORE. UNDERSTAND. DEFINE.</span>
      <button type="button" class="mx-expand" aria-expanded="false" aria-label="Expand explorer">${icon('mx-expand')}<span>Expand</span></button>
    </div>
    <div class="mx-workspace">
      <button type="button" class="mx-outline-toggle" aria-expanded="false" aria-controls="${uid}-outline">${icon('menu')}<span>Explore the system</span>${icon('chevron-down')}</button>
      <nav class="mx-outline" id="${uid}-outline" aria-label="Machine components and application"></nav>
      <div class="mx-stage">
        <div class="mx-stage-top"><nav class="mx-breadcrumbs" aria-label="Current explorer location"></nav><div class="mx-view-switch" role="group" aria-label="Equipment view"><button type="button" data-view="model">${icon('mx-cube')}3D</button><button type="button" data-view="photo">${icon('mx-image')}Photo</button></div></div>
        <div class="mx-scene-area">
          <div class="mx-machine-scene" role="img" aria-label="Photo-guided 3D interpretation of a C&B double-disc grinder with a robot"><img class="mx-machine-fallback" src="/cbmachinery-demo-preview/assets/machine.png" alt="Official C&B equipment photo showing the double-disc grinder, robot, transfer area and operator panel"></div>
          <div class="mx-ring-scene" role="img" aria-label="Illustrative ring gear and its opposing faces" hidden><img class="rg-fallback" src="/cbmachinery-demo-preview/illustrations/ring-gear-fallback.svg" alt="Illustration of a ring gear and its opposing faces"></div>
          <div class="mx-official-photo" hidden><img src="/cbmachinery-demo-preview/assets/machine.png" alt="Official C&B 30-inch double-disc grinder with robotic handling"></div>
          <div class="mx-scene-tools" role="group" aria-label="Scene controls"><button type="button" data-action="reset" aria-label="Reset view" title="Reset view">${icon('mx-reset')}<span>Reset view</span></button><span class="mx-tool-separator" aria-hidden="true"></span><button type="button" data-action="zoom-out" aria-label="Zoom out" title="Zoom out">${icon('mx-zoom-out')}</button><button type="button" data-action="zoom-in" aria-label="Zoom in" title="Zoom in">${icon('mx-zoom-in')}</button></div>
          <div class="mx-render-status" role="status"></div>
        </div>
        <div class="mx-stage-bottom"><span class="mx-source-badge"></span><div class="mx-display-controls"><button type="button" data-action="isolate" aria-pressed="false">${icon('mx-isolate')}<span>Isolate component</span></button><button type="button" data-action="cutaway" aria-pressed="false">${icon('mx-layers')}<span>Show interior</span></button></div></div>
        <p class="mx-stage-hint"></p>
      </div>
      <aside class="mx-story" aria-label="About the selected component">
        <div class="mx-story-content">
        <div class="mx-detail-heading"><span class="mx-panel-label">COMPONENT DETAILS</span><span class="mx-node-code"></span></div><p class="mx-kicker"></p><h2 class="mx-title"></h2><p class="mx-intro"></p>
        <div class="mx-options" role="group"></div>
        <div class="mx-detail"></div><p class="mx-accuracy-note"></p>
        <button type="button" class="mx-follow"></button>
        </div>
        <div class="mx-story-cta"><a class="mx-quote"><span>Request a Quote</span>${icon('arrow-up-right')}</a><p>Start with your part. Leave unknowns open.</p></div>
      </aside>
    </div>
    <div class="mx-tour-footer" hidden><button type="button" data-action="previous">${icon('chevron-right')}<span>Previous</span></button><div><span class="mx-tour-count"></span><span class="mx-tour-title"></span></div><button type="button" data-action="next"><span>Next</span>${icon('chevron-right')}</button></div>
    <p class="mx-announcement mx-sr-only" aria-live="polite" aria-atomic="true"></p>`);

  const $ = selector => host.querySelector(selector);
  const $$ = selector => [...host.querySelectorAll(selector)];
  const machineHost = $('.mx-machine-scene'), ringHost = $('.mx-ring-scene');
  const stage = $('.mx-stage');
  let ringRenderMode;
  new MutationObserver(() => {
    const mode = ringHost.dataset.renderMode;
    if (mode && mode !== ringRenderMode) { ringRenderMode = mode; ringStatus = mode === 'webgl' ? 'ready' : 'fallback'; updateSceneControls(); }
  }).observe(ringHost, { attributes: true, attributeFilter: ['data-render-mode'] });
  new MutationObserver(() => {
    const mode = machineHost.dataset.renderMode;
    if (mode === 'fallback' && machineStatus !== 'fallback') { machineStatus = 'fallback'; updateSceneControls(); }
    else if (mode === 'webgl' && machineStatus !== 'ready') { machineStatus = 'ready'; updateSceneControls(); }
  }).observe(machineHost, { attributes: true, attributeFilter: ['data-render-mode'] });

  function optionKey() { return state.node === 'ring' ? 'face' : state.node === 'process' ? 'process' : 'metric'; }
  function isRing() { return NODES[state.node].kind === 'ring'; }
  function ringState() { return { step: NODES[state.node].target, face: state.face, metric: state.metric, process: state.process }; }
  function updateURL() {
    if (host.dataset.syncUrl === 'false') return;
    const url = new URL(location.href);
    url.hash = state.node;
    if (state.mode === 'tour') url.searchParams.set('tour', '1'); else url.searchParams.delete('tour');
    globalThis.CB_PAGES_REPLACE_STATE(null, '', url);
  }
  function outlineButton(id, depth = 0, number = '') {
    return `<button type="button" data-select="${id}" data-depth="${depth}" aria-current="${state.node === id ? 'step' : 'false'}">${number ? `<span class="mx-item-number">${number}</span>` : icon(NODE_ICONS[id])}<span>${NODES[id].name}</span>${state.node === id ? '<span class="mx-current-dot" aria-hidden="true"></span>' : ''}</button>`;
  }
  function renderOutline() {
    if (state.mode === 'tour') {
      $('.mx-outline').innerHTML = '<p class="mx-outline-heading">YOUR GUIDED TOUR</p>' + TOUR.map((id, i) => outlineButton(id, 0, String(i + 1).padStart(2, '0'))).join('');
    } else {
      $('.mx-outline').innerHTML = '<p class="mx-outline-heading">EXPLORE THE SYSTEM</p>' + outlineButton('machine')
        + MACHINE_IDS.slice(1).map(id => outlineButton(id, 1) + (id === 'grinding' && ['grinding', ...RING_IDS].includes(state.node) ? '<div class="mx-application-branch">' + outlineButton('ring', 2) + (RING_IDS.includes(state.node) ? ['process', 'requirements', 'next'].map(child => outlineButton(child, 3)).join('') : '') + '</div>' : '')).join('')
        + '<button type="button" class="mx-outline-tour" data-start-tour>' + icon('play') + 'Take the guided tour</button>';
    }
    $('.mx-outline-toggle span').textContent = state.mode === 'tour' ? `${TOUR.indexOf(state.node) + 1 || 1} of ${TOUR.length} — ${NODES[state.node].short}` : NODES[state.node].name;
  }
  function renderBreadcrumbs() {
    const path = []; let current = state.node;
    while (current) { path.unshift(current); current = NODES[current].parent; }
    $('.mx-breadcrumbs').innerHTML = (NODES[state.node].parent ? `<button type="button" class="mx-up" data-select="${NODES[state.node].parent}" aria-label="Go up one level" title="Go up one level">${icon('mx-up')}</button>` : '') + path.map((id, i) => `${i ? icon('chevron-right') : ''}${id === state.node ? `<span aria-current="location">${NODES[id].short}</span>` : `<button type="button" data-select="${id}">${NODES[id].short}</button>`}`).join('');
  }
  function renderStory() {
    const node = NODES[state.node];
    $('.mx-kicker').textContent = node.kicker;
    $('.mx-node-code').textContent = String(Object.keys(NODES).indexOf(state.node)+1).padStart(2,'0');
    $('.mx-panel-label').textContent = node.kind==='ring' ? 'APPLICATION DETAILS' : 'COMPONENT DETAILS';
    $('.mx-title').textContent = node.title;
    $('.mx-intro').textContent = node.intro;
    const choices = $('.mx-options');
    choices.hidden = !node.options;
    choices.setAttribute('aria-label', state.node === 'ring' ? 'Select a ring gear face' : state.node === 'process' ? 'Select a process stage' : 'Explore part requirements');
    choices.innerHTML = (node.options || []).map(([id, name]) => `<button type="button" data-option="${id}" aria-pressed="${state[optionKey()] === id}">${name}</button>`).join('');
    updateDetail();
    $('.mx-accuracy-note').textContent = node.note;
    $('.mx-follow').hidden = !node.next;
    $('.mx-follow').innerHTML = node.next ? `<span>${node.nextLabel}</span>${icon('arrow-right')}` : '';
    const inquiryHref = quoteHref(state.node) + (host.dataset.entry === 'application' ? '&entry=application' : '');
    $('.mx-quote').href = globalThis.CB_PAGES_URL(inquiryHref);
    host.dispatchEvent(new CustomEvent('cb:explorer-focus', { bubbles: true, detail: { focus: state.node, href: inquiryHref } }));
  }
  function updateDetail() {
    const node = NODES[state.node];
    const [title, body] = DETAILS[state.node]?.[state[optionKey()]] || [node.heading, node.body];
    $('.mx-detail').innerHTML = state.node === 'next'
      ? '<h3>Your starting brief</h3><ul class="mx-brief"><li>Material &amp; part geometry</li><li>Surface requirements</li><li>Production &amp; timing</li><li>Open questions &amp; drawings</li></ul>'
      : `<h3>${title}</h3><p>${body}</p>`;
    $$('.mx-options button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.option === state[optionKey()])));
    ringHost.setAttribute('aria-label', `${NODES[state.node].name}. ${title}. Illustrative geometry, not to scale.`);
  }
  function updateSceneControls() {
    const ringMode = isRing(), photo = !ringMode && state.view === 'photo';
    const status = ringMode ? ringStatus : machineStatus;
    $('.mx-view-switch').hidden = ringMode;
    $$('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === state.view)));
    $('.mx-official-photo').hidden = !photo;
    machineHost.hidden = ringMode || photo;
    machineHost.setAttribute('aria-label', machineStatus === 'fallback' ? 'Official C&B equipment photo. Interactive 3D is unavailable.' : state.node === 'grinding' && state.cutaway ? 'Illustrative internal grinding relationship. The internal arrangement is schematic.' : 'Photo-guided 3D interpretation of a C&B double-disc grinder with a robot');
    ringHost.hidden = !ringMode;
    const isReady = status === 'ready' && !photo;
    $('.mx-scene-tools').hidden = !isReady;
    $('[data-action="zoom-in"]').hidden = false;
    $('[data-action="zoom-out"]').hidden = false;
    $('[data-action="isolate"]').hidden = ringMode || state.node === 'machine' || photo || !isReady;
    $('[data-action="isolate"]').setAttribute('aria-pressed', String(state.isolate));
    $('[data-action="cutaway"]').hidden = state.node !== 'grinding' || photo || !isReady;
    $('[data-action="cutaway"]').setAttribute('aria-pressed', String(state.cutaway));
    $('[data-action="cutaway"] span').textContent = state.cutaway ? 'Hide interior' : 'Show interior';
    const source = photo ? 'OFFICIAL EQUIPMENT PHOTO' : status === 'fallback' && !ringMode ? 'OFFICIAL PHOTO — 3D UNAVAILABLE' : ringMode
      ? state.node === 'process' ? 'PROCESS SCHEMATIC' : 'APPLICATION ILLUSTRATION'
      : state.node === 'grinding' && state.cutaway ? 'INTERNAL ARRANGEMENT — SCHEMATIC' : 'PHOTO-GUIDED 3D INTERPRETATION';
    $('.mx-source-badge').textContent = source;
    stage.dataset.view = photo ? 'photo' : status === 'fallback' ? 'fallback' : 'model';
    $('.mx-render-status').textContent = !photo && status === 'loading' ? 'Loading 3D…' : '';
    $('.mx-stage-hint').textContent = photo ? 'Published C&B equipment image. Select 3D to explore its interpreted geometry.'
      : status === 'fallback' ? 'Use the outline and controls to continue exploring. A static reference is shown.'
      : ringMode ? ({
        ring: 'Select a face to highlight it. Drag to rotate the illustrative part.',
        process: 'Select a process stage to follow the schematic sequence.',
        requirements: 'Select a requirement to see what engineering needs to know.',
        next: 'Drag to rotate the illustrative part. Start a quote with the details you have.'
      }[state.node]) : 'Drag to rotate. Scroll to zoom. Select a component or use the outline.';
    stage.dataset.scene = ringMode ? 'ring' : 'machine';
  }
  async function ensureMachine() {
    if (machinePromise) return machinePromise;
    machineStatus = 'loading'; updateSceneControls();
    machinePromise = import('./machine-scene.js').then(({ createMachineScene }) => {
      machine = createMachineScene(machineHost, {
        onSelect(id) { if (MACHINE_IDS.includes(id)) selectNode(id); },
        onReady() { machineStatus = 'ready'; updateSceneControls(); },
        onError() { machineStatus = 'fallback'; updateSceneControls(); }
      });
      if (!isRing()) machine.setState({ target: NODES[state.node].target, isolate: state.isolate, cutaway: state.cutaway });
      if (machineHost.dataset.renderMode === 'fallback') { machineStatus = 'fallback'; updateSceneControls(); }
    }).catch(() => { machineStatus = 'fallback'; machineHost.dataset.renderMode = 'fallback'; updateSceneControls(); });
    return machinePromise;
  }
  async function ensureRing() {
    if (ringPromise) return ringPromise;
    ringStatus = 'loading'; updateSceneControls();
    ringPromise = import('../illustrations/ring-gear-scene.js').then(({ createRingScene }) => {
      ring = createRingScene(ringHost, { onFaceSelect(face) { state.face = face === 'lower' ? 'lower' : 'upper'; selectNode('ring', { force: true }); } });
      if (isRing()) ring.setState(ringState());
      if (ringHost.dataset.renderMode === 'fallback') { ringStatus = 'fallback'; updateSceneControls(); }
    }).catch(() => { ringStatus = 'fallback'; ringHost.dataset.renderMode = 'fallback'; updateRingFallback(); updateSceneControls(); });
    return ringPromise;
  }
  function updateRingFallback() {
    const fragment = state.node === 'process' ? 'process' : state.node === 'requirements' ? ({ diameter: 'requirements', thickness: 'thickness', finish: 'finish', production: 'production' }[state.metric]) : state.node === 'ring' && state.face === 'lower' ? 'lower' : '';
    $('.rg-fallback').src = '/cbmachinery-demo-preview/illustrations/ring-gear-fallback.svg' + (fragment ? '#' + fragment : '');
  }
  function updateScene() {
    updateSceneControls();
    if (!activated) return;
    if (isRing()) {
      updateRingFallback();
      ensureRing(); ring?.setState(ringState());
    } else if (state.view === 'model') {
      ensureMachine(); machine?.setState({ target: NODES[state.node].target, isolate: state.isolate, cutaway: state.cutaway });
    }
  }
  function updateTour() {
    const index = TOUR.indexOf(state.node);
    $('.mx-tour-footer').hidden = state.mode !== 'tour';
    $('.mx-tour-count').textContent = `${String(Math.max(0, index) + 1).padStart(2, '0')} / ${String(TOUR.length).padStart(2, '0')}`;
    $('.mx-tour-title').textContent = NODES[state.node].name;
    $('[data-action="previous"]').disabled = index <= 0;
    $('[data-action="next"]').disabled = index === TOUR.length - 1;
  }
  function closeOutline() { state.outline = false; host.classList.remove('mx-outline-open'); $('.mx-outline-toggle').setAttribute('aria-expanded', 'false'); }
  function render({ announce = false } = {}) {
    host.dataset.mode = state.mode;
    host.dataset.focus = state.node;
    $$('[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === state.mode)));
    renderOutline(); renderBreadcrumbs(); renderStory(); updateTour(); updateScene();
    if (announce) $('.mx-announcement').textContent = `${state.mode === 'tour' ? 'Tour: ' : ''}${NODES[state.node].name}. ${NODES[state.node].title}`;
  }
  function selectNode(id, { force = false, writeURL = true } = {}) {
    if (!Object.hasOwn(NODES, id) || (state.node === id && !force)) {
      const restoreOutlineFocus = state.outline;
      closeOutline();
      if (restoreOutlineFocus) $('.mx-outline-toggle').focus();
      return;
    }
    const nodeChanged=state.node!==id;
    const restoreChoiceFocus = !!document.activeElement?.closest('[data-select]');
    state.node = id; state.isolate = false; state.cutaway = id === 'grinding';
    if (isRing()) state.view = 'model';
    if (state.mode === 'tour' && !TOUR.includes(id)) state.mode = 'free';
    closeOutline(); render({ announce: true });
    if(nodeChanged) $('.mx-story-content').scrollTop=0;
    if (restoreChoiceFocus) {
      const mobileToggle = $('.mx-outline-toggle');
      if (mobileToggle.getClientRects().length) mobileToggle.focus();
      else $(`.mx-outline [data-select="${id}"]`)?.focus();
    }
    if (writeURL) updateURL();
    track('explorer_select', { focus: id, mode: state.mode });
  }
  function setMode(mode, restart = false) {
    const previousNode=state.node;
    state.mode = mode === 'tour' ? 'tour' : 'free';
    if (restart || (state.mode === 'tour' && !TOUR.includes(state.node))) state.node = 'machine';
    state.isolate = false; state.cutaway = state.node === 'grinding';
    closeOutline(); render({ announce: true }); updateURL();
    if(previousNode!==state.node) $('.mx-story-content').scrollTop=0;
    track('explorer_mode', { mode: state.mode });
  }
  function toggleExpanded(open) {
    state.expanded = open;
    host.classList.toggle('mx-is-expanded', open);
    $('.mx-expand').setAttribute('aria-expanded', String(open));
    $('.mx-expand').setAttribute('aria-label',open ? 'Close explorer' : 'Expand explorer');
    $('.mx-expand').innerHTML = `${icon(open ? 'x' : 'mx-expand')}<span>${open ? 'Close' : 'Expand'}</span>`;
    if (open) {
      lastFocused = document.activeElement;
      previousBodyOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
      host.setAttribute('role', 'dialog'); host.setAttribute('aria-modal', 'true');
      let child = host;
      while (child.parentElement && child.parentElement !== document.documentElement) {
        for (const sibling of child.parentElement.children) if (sibling !== child && !['SCRIPT', 'STYLE', 'LINK'].includes(sibling.tagName)) { inertElements.push([sibling, sibling.inert]); sibling.inert = true; }
        child = child.parentElement;
      }
      $('.mx-expand').focus();
    } else {
      document.body.style.overflow = previousBodyOverflow;
      host.setAttribute('role', 'region'); host.removeAttribute('aria-modal');
      inertElements.forEach(([element, wasInert]) => { element.inert = wasInert; }); inertElements = [];
      if (lastFocused?.isConnected) lastFocused.focus();
    }
    track('explorer_expand', { expanded: open });
  }
  host.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    activated = true;
    if (button.dataset.select) return selectNode(button.dataset.select);
    if (button.dataset.mode) return setMode(button.dataset.mode);
    if (button.hasAttribute('data-start-tour')) return setMode('tour', true);
    if (button.dataset.view) { state.view = button.dataset.view; updateScene(); return; }
    if (button.dataset.option) { state[optionKey()] = button.dataset.option; updateDetail(); updateScene(); $('.mx-announcement').textContent = DETAILS[state.node]?.[button.dataset.option]?.[0] || ''; return; }
    if (button.classList.contains('mx-expand')) return toggleExpanded(!state.expanded);
    if (button.classList.contains('mx-outline-toggle')) { state.outline = !state.outline; host.classList.toggle('mx-outline-open', state.outline); button.setAttribute('aria-expanded', String(state.outline)); return; }
    if (button.classList.contains('mx-follow')) return selectNode(NODES[state.node].next);
    switch (button.dataset.action) {
      case 'reset': (isRing() ? ring : machine)?.reset(); break;
      case 'zoom-in': (isRing() ? ring : machine)?.zoom?.(.18); break;
      case 'zoom-out': (isRing() ? ring : machine)?.zoom?.(-.18); break;
      case 'isolate': state.isolate = !state.isolate; updateScene(); break;
      case 'cutaway': state.cutaway = !state.cutaway; updateScene(); break;
      case 'previous': { const i = TOUR.indexOf(state.node); if (i > 0) selectNode(TOUR[i - 1]); break; }
      case 'next': { const i = TOUR.indexOf(state.node); if (i < TOUR.length - 1) selectNode(TOUR[i + 1]); break; }
    }
  });
  host.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (state.outline) { closeOutline(); $('.mx-outline-toggle').focus(); }
      else if (state.expanded) toggleExpanded(false);
      else if (NODES[state.node].parent) selectNode(NODES[state.node].parent);
      return;
    }
    if (event.key === 'Tab' && state.expanded) {
      const focusable = [...host.querySelectorAll('button:not([disabled]),a[href],input,select,textarea,[tabindex="0"]')].filter(element => element.getClientRects().length && !element.closest('[hidden]'));
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    if (event.target.closest('.mx-outline') && ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      const buttons = $$('.mx-outline [data-select]');
      const index = buttons.indexOf(event.target.closest('button'));
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
      event.preventDefault(); buttons[next]?.focus();
    }
  });
  window.addEventListener('hashchange', () => { const id = location.hash.slice(1); if (host.dataset.syncUrl !== 'false' && Object.hasOwn(NODES, id)) selectNode(id, { writeURL: false }); });
  render();
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { activated = true; updateScene(); observer.disconnect(); } }, { rootMargin: '200px' });
    observer.observe(host);
  } else { activated = true; updateScene(); }
  return { selectNode, setMode, state: () => ({ ...state }) };
}

document.querySelectorAll('[data-machine-explorer]').forEach(mountMachineExplorer);
