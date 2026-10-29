import { quoteHref } from './explorer-content.js';

// Presentation and copy stay independent of the explanatory scene geometry.
// Markers use renderer-projected model points; cross-scene topics stay in the list.
const CHAPTERS = [
  {
    title: 'Explore the system', focus: 'machine',
    copy: 'Explore the grinder, robot and transfer area as one system. See how each component connects your part to the process.',
    items: ['robot', 'loading', 'controls']
  },
  {
    title: 'See how grinding works', focus: 'ring',
    copy: 'Start with a ring gear. Explore its opposing faces, then follow loading, grinding and unloading. The internal arrangement is shown schematically.',
    items: ['grinding', 'ring', 'process']
  },
  {
    title: 'Define your requirements', focus: 'next',
    copy: 'Bring your part dimensions, surface requirements and production needs. Start a quote with the details you know and leave the rest open.',
    items: ['geometry', 'finish', 'production']
  }
];

const ITEMS = {
  robot: { title: 'Robotic handling', focus: 'robot', kind: 'machine', label: 'SYSTEM COMPONENT', icon: 'settings-2', copy: 'Explore the connection between the robot and the grinding system. Part orientation, handling needs and the next operation help shape the loading conversation.' },
  loading: { title: 'Part transfer', focus: 'loading', kind: 'machine', label: 'SYSTEM COMPONENT', icon: 'move-horizontal', copy: 'See where the part moves between handling and grinding. Its arrival position, presentation and next destination help define the workholding questions for your application.' },
  controls: { title: 'Operator interface', focus: 'controls', kind: 'machine', label: 'SYSTEM COMPONENT', icon: 'settings-2', copy: 'Bring setup, operation and changeover needs into the conversation. The panel exterior follows the published photo; the screen shown here is an illustration.' },
  grinding: { title: 'Grinding zone', focus: 'grinding', kind: 'machine', label: 'PROCESS SCHEMATIC', icon: 'settings-2', copy: 'See how two grinding faces relate to a workpiece. This cutaway explains the principle; its internal arrangement and workholding are schematic.' },
  ring: { title: 'Opposing faces', focus: 'ring', kind: 'ring', label: 'APPLICATION ILLUSTRATION', icon: 'move-horizontal', copy: 'Select the two annular surfaces under discussion. Finished thickness, flatness, parallelism and surface finish belong to these faces; the teeth remain outside this face-grinding explanation.', options: [['both', 'Both faces'], ['upper', 'Face A'], ['lower', 'Face B']] },
  process: { title: 'Grinding sequence', focus: 'process', kind: 'ring', label: 'PROCESS SCHEMATIC', icon: 'play', copy: 'Follow loading, face grinding and unloading as a connected sequence. The positions and movements explain the relationship; they do not represent a validated machine cycle.', options: [['load', 'Loading'], ['grind', 'Face grinding'], ['unload', 'Unloading']] },
  geometry: { title: 'Part geometry', focus: 'requirements', kind: 'ring', label: 'YOUR REQUIREMENTS', icon: 'move-horizontal', copy: 'Start with outside diameter and finished thickness. Add a drawing when available, and leave unknown values open so engineering can review the complete geometry.', options: [['diameter', 'Diameter'], ['thickness', 'Thickness']] },
  finish: { title: 'Finish & precision', focus: 'requirements', kind: 'ring', label: 'YOUR REQUIREMENTS', icon: 'circle-check', copy: 'Share the surface requirements on your drawing. Flatness, parallelism and finish describe different needs, and each helps define the engineering discussion around your part.' },
  production: { title: 'Production needs', focus: 'requirements', kind: 'ring', label: 'YOUR REQUIREMENTS', icon: 'file-text', copy: 'Tell us your target output, current process and handling needs. Include timing and open questions so the next conversation starts with the right context.' }
};

const controllers = new WeakMap();
const icon = name => globalThis.CB_PAGES_HTML(`<img class="mp-icon" src="/cbmachinery-demo-preview/review-kit/icons/${name}.svg" alt="" draggable="false">`);

export function mountPresentation(host) {
  if (!host) return null;
  if (controllers.has(host)) return controllers.get(host);
  let destroyed = false, activated = false, machine, ring, machinePromise, ringPromise;
  let lastChoice = null, loadingMachine = false, loadingRing = false;
  let appliedMachineState = '', appliedRingState = '';
  let machinePoints = {}, ringPoints = {};
  const state = { chapter: 0, item: null, detail: false, photo: false, face: 'both', process: 'grind', metric: 'diameter', isolate: false };
  const uid = 'mp-' + Math.random().toString(36).slice(2, 9);
  host.classList.add('mp-explorer');
  host.setAttribute('role', 'region');
  host.setAttribute('aria-label', 'Explore the machine, process and your application');
  host.innerHTML = globalThis.CB_PAGES_HTML(`
    <div class="mp-stage">
      <div class="mp-visual" aria-label="Interactive equipment and process illustration">
        <div class="mp-machine mp-scene" role="img" aria-label="Photo-guided interpretation of C&B equipment"><img class="mx-machine-fallback" src="/cbmachinery-demo-preview/assets/machine.png" alt="Official C&B double-disc grinder with robotic handling"></div>
        <div class="mp-ring mp-scene" role="img" aria-label="Illustrative ring gear" hidden><img class="rg-fallback" src="/cbmachinery-demo-preview/illustrations/ring-gear-fallback.svg" alt="Illustrative ring gear and its opposing faces"></div>
        <div class="mp-photo mp-scene" hidden><img src="/cbmachinery-demo-preview/assets/machine.png" alt="Official C&B double-disc grinder with robotic handling"></div>
        <div class="mp-markers" role="group" aria-label="Explore components shown in this view"></div>
      </div>
      <aside class="mp-steps" aria-label="Three steps from machine to application">
        <ol class="mp-chapters">${CHAPTERS.map((chapter, index) => `
          <li class="mp-chapter" data-chapter="${index}">
            <h3><button class="mp-chapter-trigger" data-step="${index}" aria-expanded="${index === 0}" aria-controls="${uid}-chapter-${index}" id="${uid}-trigger-${index}"><span class="mp-step-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}.</span><span>${chapter.title}</span></button></h3>
            <div class="mp-chapter-content" id="${uid}-chapter-${index}" role="region" aria-labelledby="${uid}-trigger-${index}" ${index ? 'hidden' : ''}><p>${chapter.copy}</p><div class="mp-step-choices"></div></div>
          </li>`).join('')}</ol>
        <div class="mp-conversion"><a class="mp-quote" href="${quoteHref('machine')}">Request a Quote${icon('arrow-right')}</a></div>
      </aside>
      <aside class="mp-detail" aria-label="Selected detail" hidden>
        <div class="mp-detail-top"><span></span><button type="button" class="mp-close" aria-label="Close detail">${icon('x')}</button></div>
        <div class="mp-detail-content"><h3 tabindex="-1"></h3><p></p><div class="mp-detail-options" role="group"></div><button class="mp-isolate" type="button" aria-pressed="false">Isolate component</button></div>
      </aside>
      <div class="mp-scene-toolbar"><div class="mp-photo-switch" role="group" aria-label="Equipment view"><button type="button" data-view="model" aria-pressed="true">3D</button><button type="button" data-view="photo" aria-pressed="false">Photo</button></div><button class="mp-reset" type="button">Reset view</button></div>
      <div class="mp-evidence"><span class="mp-source"></span><p class="mp-source-note"></p></div>
      <p class="mp-load-status" role="status"></p>
    </div><p class="mp-announcement mp-sr-only" aria-live="polite" aria-atomic="true"></p>`);

  const $ = selector => host.querySelector(selector);
  const $$ = selector => [...host.querySelectorAll(selector)];
  const machineHost = $('.mp-machine'), ringHost = $('.mp-ring');
  const currentItem = () => state.item ? ITEMS[state.item] : null;
  const focus = () => currentItem()?.focus || CHAPTERS[state.chapter].focus;
  const isMachine = () => ['machine', 'robot', 'loading', 'controls', 'grinding'].includes(focus());
  const currentHref = () => quoteHref(focus()) + (host.dataset.entry === 'application' ? '&entry=application' : '');
  const currentOptionsKey = () => state.item === 'ring' ? 'face' : state.item === 'process' ? 'process' : 'metric';
  function machineState() { return { target: focus(), isolate: state.isolate, cutaway: focus() === 'grinding' }; }
  function ringState() {
    const id = focus();
    return { step: id === 'ring' ? 'part' : id, face: state.face, process: state.process, metric: state.item === 'finish' ? 'finish' : state.item === 'production' ? 'production' : state.metric };
  }
  function choiceHTML(id, place) {
    if (place === 'scene') return `<button type="button" class="mp-marker" data-item="${id}" data-place="scene" aria-label="${ITEMS[id].title}" aria-pressed="${state.item === id}" aria-controls="${uid}-detail" hidden><span class="mp-marker-label">${icon(ITEMS[id].icon)}<span>${ITEMS[id].title}</span></span><span class="mp-marker-stem" aria-hidden="true"></span><span class="mp-marker-dot" aria-hidden="true"></span></button>`;
    return `<button type="button" class="mp-choice" data-item="${id}" data-place="${place}" aria-pressed="${state.item === id}" aria-controls="${uid}-detail">${icon(ITEMS[id].icon)}<span>${ITEMS[id].title}</span></button>`;
  }
  $('.mp-detail').id = `${uid}-detail`;

  function updateMarkers() {
    if (destroyed) return;
    const points = isMachine() ? machinePoints : ringPoints;
    const mode = isMachine() ? machineHost.dataset.renderMode : ringHost.dataset.renderMode;
    const markerLayer=$('.mp-markers');
    markerLayer.hidden=state.photo || mode!=='webgl' || matchMedia('(max-width:640px)').matches;
    if(markerLayer.hidden)return;
    const bounds=$('.mp-visual').getBoundingClientRect();
    if(bounds.width<2||bounds.height<2)return;
    // Reserve only painted panels and controls, never the wide transparent
    // toolbar wrapper. Hotspot connectors also remain decoration, not targets.
    const cards=[$('.mp-steps'),$('.mp-detail'),$('.mp-photo-switch'),$('.mp-reset')]
      .filter(el=>!el.hidden&&el.getClientRects().length)
      .map(el=>el.getBoundingClientRect());
    const intersects=(a,b,gap=0)=>a.left<b.right+gap&&a.right>b.left-gap&&a.top<b.bottom+gap&&a.bottom>b.top-gap;
    const viewportRect=rect=>({left:bounds.left+rect.left,right:bounds.left+rect.right,top:bounds.top+rect.top,bottom:bounds.top+rect.bottom});
    const candidates=[];
    $$('[data-place="scene"]').forEach(button=>{
      const id=button.dataset.item;
      const anchor=isMachine()?({robot:'robot',loading:'loading',controls:'controls',grinding:'grinding'}[id])
        :({ring:'ring',process:'grindUpper',geometry:state.metric==='thickness'?'thickness':'diameter',finish:'finish',production:'production'}[id]);
      const point=anchor&&points[anchor];
      button.hidden=true;
      if(!point?.visible||!Number.isFinite(point.x)||!Number.isFinite(point.y))return;
      const x=point.x*bounds.width,y=point.y*bounds.height;
      const dot={left:x-18,right:x+18,top:y-18,bottom:y+18};
      if(dot.left<0||dot.top<0||dot.right>bounds.width||dot.bottom>bounds.height||cards.some(rect=>intersects(viewportRect(dot),rect,4)))return;
      candidates.push({button,x,y,dot});
    });
    const occupied=[];
    candidates.forEach(({button,x,y,dot})=>{
      // A label and the circular anchor share one semantic button, but no
      // invisible rectangle between them is allowed to block another target.
      if(occupied.some(rect=>intersects(dot,rect,6)))return;
      button.hidden=false;button.style.left=x+'px';button.style.top=y+'px';
      const label=button.querySelector('.mp-marker-label');
      const width=label.offsetWidth,height=label.offsetHeight;
      const left=Math.max(8,Math.min(bounds.width-width-8,x-width/2));
      let lift=23;
      const blockers=[...occupied,...candidates.filter(candidate=>candidate.button!==button).map(candidate=>candidate.dot)];
      let labelRect;
      for(let attempt=0;attempt<=blockers.length;attempt++){
        labelRect={left,right:left+width,top:y-lift-height,bottom:y-lift};
        const collision=blockers.find(rect=>intersects(labelRect,rect,8));
        if(!collision)break;
        lift=Math.max(lift,y-collision.top+9);
      }
      labelRect={left,right:left+width,top:y-lift-height,bottom:y-lift};
      if(labelRect.top<6||labelRect.right>bounds.width-6||blockers.some(rect=>intersects(labelRect,rect,8))||cards.some(rect=>intersects(viewportRect(labelRect),rect,4))){button.hidden=true;return;}
      button.style.setProperty('--mp-label-shift',(left+width/2-x)+'px');
      button.style.setProperty('--mp-marker-lift',lift+'px');
      occupied.push(labelRect,dot);
    });
  }

  function updateStatus() {
    if (destroyed) return;
    const mode = isMachine() ? machineHost.dataset.renderMode : ringHost.dataset.renderMode;
    const ready = mode === 'webgl' && !state.photo;
    $('.mp-reset').hidden = !ready;
    $('.mp-isolate').hidden = !state.detail || !isMachine() || focus() === 'machine' || !ready;
    $('.mp-load-status').textContent = !state.photo && (isMachine() ? loadingMachine : loadingRing) && !mode ? 'Loading 3D…' : '';
    let source, note;
    if (state.photo) {
      source = 'OFFICIAL EQUIPMENT PHOTO'; note = 'Published C&B equipment photo. Return to 3D to explore its interpreted geometry.';
    } else if (isMachine() && mode === 'fallback') {
      source = 'OFFICIAL PHOTO · 3D UNAVAILABLE'; note = 'The reference photo is shown. Use the steps and labeled controls to continue.';
    } else if (isMachine() && mode !== 'webgl') {
      source = 'OFFICIAL EQUIPMENT PHOTO'; note = loadingMachine ? 'Reference photo shown while the illustrative 3D view loads.' : 'Published C&B equipment image.';
    } else if (focus() === 'grinding') {
      source = 'INTERNAL ARRANGEMENT · SCHEMATIC'; note = 'Internal geometry, wheel positions and workholding are illustrative.';
    } else if (isMachine()) {
      source = 'PHOTO-GUIDED 3D INTERPRETATION'; note = 'Exterior interpreted from a C&B photo. Geometry and scale are illustrative.';
    } else if (focus() === 'process') {
      source = 'PROCESS SCHEMATIC'; note = 'Movement and spacing are illustrative. No machine cycle or cycle time is implied.';
    } else if (state.chapter === 2) {
      source = 'APPLICATION ILLUSTRATION'; note = 'No preset dimensions or confirmed machine fit. Share your actual requirements in the quote request.';
    } else {
      source = 'APPLICATION ILLUSTRATION'; note = 'This representative equipment is not identified as the published ring-gear case machine.';
    }
    if (!isMachine() && mode === 'fallback') note += ' A static reference is shown.';
    $('.mp-source').textContent = source;
    $('.mp-source-note').textContent = note;
    updateMarkers();
  }

  async function ensureMachine() {
    if (machinePromise) return machinePromise;
    loadingMachine = true; updateStatus();
    machinePromise = import('./machine-scene.js').then(({ createMachineScene }) => {
      if (destroyed) return;
      machine = createMachineScene(machineHost, {
        framingScale: .8,
        onSelect(id) { if (['robot', 'loading', 'controls', 'grinding'].includes(id)) selectItem(id); },
        onReady: updateStatus, onError: updateStatus,
        onProject(points) { machinePoints = points; updateMarkers(); }
      });
      loadingMachine = false;
      if (isMachine()) { const next = machineState(); machine.setState(next); appliedMachineState = JSON.stringify(next); }
      updateStatus();
    }).catch(() => { loadingMachine = false; machineHost.dataset.renderMode = 'fallback'; updateStatus(); });
    return machinePromise;
  }
  async function ensureRing() {
    if (ringPromise) return ringPromise;
    loadingRing = true; updateStatus();
    ringPromise = import('../illustrations/ring-gear-scene.js').then(({ createRingScene }) => {
      if (destroyed) return;
      ring = createRingScene(ringHost, {
        onFaceSelect(face) { state.face = face === 'lower' ? 'lower' : 'upper'; selectItem('ring'); },
        onProject(points) { ringPoints = points; updateMarkers(); }
      });
      loadingRing = false;
      if (!isMachine()) { const next = ringState(); ring.setState(next); appliedRingState = JSON.stringify(next); }
      updateStatus();
    }).catch(() => { loadingRing = false; ringHost.dataset.renderMode = 'fallback'; updateStatus(); });
    return ringPromise;
  }
  function updateScene() {
    machineHost.hidden = !isMachine() || state.photo;
    ringHost.hidden = isMachine();
    $('.mp-photo').hidden = !state.photo;
    $('.mp-photo-switch').hidden = !isMachine();
    $$('[data-view]').forEach(button => button.setAttribute('aria-pressed', String((button.dataset.view === 'photo') === state.photo)));
    host.dataset.focus = focus();
    host.dataset.chapter = String(state.chapter);
    host.dataset.scene = isMachine() ? 'machine' : 'ring';
    machineHost.setAttribute('aria-label', focus() === 'grinding' ? 'Schematic internal grinding relationship. Internal arrangement is illustrative.' : 'Photo-guided interpretation of C&B equipment');
    ringHost.setAttribute('aria-label', `${currentItem()?.title || CHAPTERS[state.chapter].title}. Illustrative geometry, not to scale.`);
    if (activated && !state.photo) {
      if (isMachine()) {
        ensureMachine(); const next = machineState(), signature = JSON.stringify(next);
        if (machine && signature !== appliedMachineState) { machine.setState(next); appliedMachineState = signature; }
      } else {
        ensureRing(); const next = ringState(), signature = JSON.stringify(next);
        if (ring && signature !== appliedRingState) { ring.setState(next); appliedRingState = signature; }
      }
    }
    updateStatus();
  }
  function render() {
    $$('[data-chapter]').forEach(chapter => {
      const active = Number(chapter.dataset.chapter) === state.chapter;
      chapter.classList.toggle('mp-active', active);
      chapter.querySelector('[data-step]').setAttribute('aria-expanded', String(active));
      chapter.querySelector('.mp-chapter-content').hidden = !active;
      if (active) chapter.querySelector('.mp-step-choices').innerHTML = CHAPTERS[state.chapter].items.map(id => choiceHTML(id, 'left')).join('');
    });
    $('.mp-markers').innerHTML = CHAPTERS[state.chapter].items.map(id => choiceHTML(id, 'scene')).join('');
    const detail = $('.mp-detail'), item = currentItem();
    detail.hidden = !state.detail || !item;
    host.classList.toggle('mp-detail-open', !!state.detail && !!item);
    if (state.detail && item) {
      $('.mp-detail-top>span').textContent = item.label;
      $('.mp-detail-content h3').textContent = item.title;
      $('.mp-detail-content>p').textContent = item.copy;
      const choices = $('.mp-detail-options');
      choices.hidden = !item.options;
      choices.setAttribute('aria-label', item.title);
      choices.innerHTML = (item.options || []).map(([id, label]) => `<button type="button" data-option="${id}" aria-pressed="${state[currentOptionsKey()] === id}">${label}</button>`).join('');
      $('.mp-isolate').setAttribute('aria-pressed', String(state.isolate));
      $('.mp-isolate').textContent = state.isolate ? 'Show surrounding equipment' : 'Isolate component';
    }
    $('.mp-quote').href = globalThis.CB_PAGES_URL(currentHref());
    updateScene();
    host.dispatchEvent(new CustomEvent('cb:explorer-focus', { bubbles: true, detail: { focus: focus(), href: currentHref() } }));
  }
  function announce() { $('.mp-announcement').textContent = `${CHAPTERS[state.chapter].title}${state.detail ? '. ' + currentItem().title : ''}.`; }
  function selectChapter(index) {
    if (!Number.isInteger(index) || index < 0 || index >= CHAPTERS.length || destroyed) return;
    state.chapter = index; state.item = null; state.detail = false; state.photo = false; state.isolate = false;
    render(); announce();
  }
  function selectItem(id, place) {
    if (!Object.hasOwn(ITEMS, id) || destroyed) return;
    state.chapter = CHAPTERS.findIndex(chapter => chapter.items.includes(id));
    state.item = id; state.detail = true; state.photo = false; state.isolate = false;
    lastChoice = { id, place: place || 'left' };
    render(); announce();
    if (place) $(`[data-item="${id}"][data-place="${place}"]`)?.focus({ preventScroll: true });
    // The compact layout places detail after the step card. Make the result of
    // selecting a hotspot visible and give keyboard users a clear continuation.
    if (matchMedia('(max-width: 640px)').matches) {
      const detail = $('.mp-detail'), rect = detail.getBoundingClientRect();
      if (rect.top < 12 || rect.bottom > innerHeight - 12) {
        $('.mp-detail-content h3').focus({ preventScroll: true });
        detail.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      }
    }
  }
  function closeDetail() {
    state.detail = false;
    render();
    if (lastChoice) {
      const origin = $(`[data-item="${lastChoice.id}"][data-place="${lastChoice.place}"]`);
      origin?.focus({ preventScroll: true });
      if (origin && matchMedia('(max-width: 640px)').matches) origin.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  }
  function click(event) {
    const target = event.target.closest('button'); if (!target || !host.contains(target)) return;
    if (target.hasAttribute('data-step')) { selectChapter(Number(target.dataset.step)); return; }
    if (target.dataset.item) { selectItem(target.dataset.item, target.dataset.place); return; }
    if (target.dataset.option) {
      state[currentOptionsKey()] = target.dataset.option;
      const option = target.dataset.option;
      render(); $(`[data-option="${option}"]`)?.focus({ preventScroll: true }); return;
    }
    if (target.matches('.mp-close')) { closeDetail(); return; }
    if (target.dataset.view) { state.photo = target.dataset.view === 'photo'; updateScene(); return; }
    if (target.matches('.mp-reset')) { if (isMachine()) machine?.reset(); else ring?.reset(); return; }
    if (target.matches('.mp-isolate')) { state.isolate = !state.isolate; render(); $('.mp-isolate').focus({ preventScroll: true }); }
  }
  function keydown(event) {
    if (event.key === 'Escape' && state.detail) { closeDetail(); event.preventDefault(); }
    if (event.target.matches('[data-step]') && ['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
      const index = Number(event.target.dataset.step);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (index + (event.key === 'ArrowDown' ? 1 : 2)) % 3;
      $(`[data-step="${next}"]`).focus(); event.preventDefault();
    }
  }
  host.addEventListener('click', click); host.addEventListener('keydown', keydown);
  const modeObserver = new MutationObserver(updateStatus);
  modeObserver.observe(machineHost, { attributes: true, attributeFilter: ['data-render-mode'] });
  modeObserver.observe(ringHost, { attributes: true, attributeFilter: ['data-render-mode'] });
  const intersection = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) { activated = true; updateScene(); intersection.disconnect(); }
  }, { rootMargin: '150px' });
  intersection.observe(host);
  const controller = {
    selectChapter, selectItem, state: () => ({ ...state, focus: focus() }),
    destroy() {
      if (destroyed) return;
      destroyed = true; intersection.disconnect(); modeObserver.disconnect();
      machine?.destroy(); ring?.destroy();
      host.removeEventListener('click', click); host.removeEventListener('keydown', keydown);
      controllers.delete(host); host.replaceChildren(); host.classList.remove('mp-explorer');
    }
  };
  controllers.set(host, controller);
  render();
  return controller;
}
