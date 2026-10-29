const QUOTE = '/request/?application=ring-gear&source=ring-gear';
const stages = [
  { id: 'part', name: 'Your part', title: 'Two opposing faces. One starting point.', body: 'Explore the two faces to finish. The teeth remain separate from this face-grinding discussion.', label: 'Inspect the surfaces', options: [['both', 'Both faces'], ['upper', 'Face A'], ['lower', 'Face B']] },
  { id: 'process', name: 'Your process', title: 'Plan the process around your part.', body: 'Explore loading, face grinding and unloading as connected parts of the application.', label: 'Explore the process', options: [['load', 'Loading'], ['grind', 'Face grinding'], ['unload', 'Unloading']] },
  { id: 'requirements', name: 'Your requirements', title: 'Start with what you know.', body: 'Part geometry, surface requirements and production needs give engineering a useful starting point.', label: 'Explore the requirements', options: [['diameter', 'Diameter'], ['thickness', 'Thickness'], ['finish', 'Finish & precision'], ['production', 'Production']] },
  { id: 'next', name: 'Your next step', title: 'Bring the knowns and the questions.', body: 'Start a quote request with the details you have. Leave open items for discussion.', label: 'Your engineering brief', options: [] }
];
const details = {
  part: {
    both: ['Opposing faces', 'These two annular surfaces are the focus of this application. Select either face to take a closer look.'],
    upper: ['Face A', 'One of the two opposing faces. Share the finished surface requirements shown on your drawing.'],
    lower: ['Face B', 'The opposite face. Finished thickness describes the distance between these two surfaces.']
  },
  process: {
    load: ['Present the part', 'The loading approach depends on part geometry, orientation and production needs.'],
    grind: ['Work on the opposing faces', 'The faces of two grinding wheels remove material from opposing part surfaces. This diagram explains the relationship, not a specific machine configuration.'],
    unload: ['Move to the next operation', 'Discuss how the finished part will be handled and where it needs to go next.']
  },
  requirements: {
    diameter: ['Outside diameter', 'Share the outside diameter and the geometry of your part. A drawing adds the context that a single dimension cannot.'],
    thickness: ['Finished thickness', 'Specify the finished distance between the two opposing faces. Leave an unknown value open for discussion.'],
    finish: ['Finish & precision', 'Flatness, parallelism and surface finish describe different requirements. Share the values on your drawing.'],
    production: ['Production needs', 'Tell us your target output, handling needs and current process. These inputs help shape an engineering conversation.']
  }
};

function mountExplorer(host) {
  const state = { step: 'part', face: 'both', metric: 'diameter', process: 'grind' };
  let scene, loading;
  host.classList.add('rg-explorer');
  host.innerHTML = globalThis.CB_PAGES_HTML(`
    <nav class="rg-stages" aria-label="Explore ring gear face grinding">
      ${stages.map((s, i) => `<button type="button" data-rg-stage="${s.id}" aria-pressed="${i === 0}"><span class="rg-stage-number">0${i + 1}</span><span>${s.name}</span></button>`).join('')}
    </nav>
    <div class="rg-workspace">
      <div class="rg-visual">
        <div class="rg-scene-header"><span>APPLICATION ILLUSTRATION</span><button type="button" class="rg-reset">Reset view</button></div>
        <div class="rg-scene" role="img" aria-label="Illustrative internally toothed ring gear with two opposing faces highlighted">
          <img class="rg-fallback" src="/cbmachinery-demo-preview/illustrations/ring-gear-fallback.svg" alt="Illustration of a ring gear and its opposing faces">
        </div>
        <div class="rg-scene-footer"><span class="rg-view-label">Opposing faces</span><span>Illustrative geometry. Not to scale.</span></div>
      </div>
      <div class="rg-story">
        <p class="rg-kicker">THE WORKPIECE</p>
        <h2 class="rg-title">${stages[0].title}</h2>
        <p class="rg-intro">${stages[0].body}</p>
        <div class="rg-choices" role="group" aria-label="Inspect the surfaces"></div>
        <div class="rg-detail" aria-live="polite" aria-atomic="true"></div>
        <a class="rg-quote" href="${QUOTE}">Request a Quote</a>
        <p class="rg-quote-note">You don’t need to select a machine to begin.</p>
      </div>
    </div>
    <p class="rg-bottom-note">Explore with the controls or select a face on the model. Final process selection depends on your part.</p>`);
  const viewport = host.querySelector('.rg-scene');
  const choices = host.querySelector('.rg-choices');
  const detail = host.querySelector('.rg-detail');
  const caption = host.querySelector('.rg-view-label');
  const keyFor = step => step === 'part' ? 'face' : step === 'process' ? 'process' : 'metric';
  const activeValue = () => state[keyFor(state.step)];
  function syncRenderMode() {
    const isStatic = viewport.dataset.renderMode === 'fallback';
    host.querySelector('.rg-reset').hidden = isStatic;
    host.querySelector('.rg-bottom-note').textContent = isStatic
      ? 'Use the controls to explore the application. Final process selection depends on your part.'
      : 'Explore with the controls or select a face on the model. Final process selection depends on your part.';
  }
  function updateStaticImage() {
    const fragment = state.step === 'process' ? 'process' : state.step === 'requirements'
      ? ({ diameter: 'requirements', thickness: 'thickness', finish: 'finish', production: 'production' }[state.metric])
      : state.step === 'part' && state.face === 'lower' ? 'lower' : '';
    viewport.querySelector('.rg-fallback').src = '/cbmachinery-demo-preview/illustrations/ring-gear-fallback.svg' + (fragment ? '#' + fragment : '');
  }

  function update({ rebuild = true } = {}) {
    const stage = stages.find(s => s.id === state.step);
    host.querySelectorAll('[data-rg-stage]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.rgStage === state.step)));
    host.querySelector('.rg-kicker').textContent = { part: 'THE WORKPIECE', process: 'THE PROCESS', requirements: 'THE REQUIREMENTS', next: 'THE NEXT CONVERSATION' }[state.step];
    host.querySelector('.rg-title').textContent = stage.title;
    host.querySelector('.rg-intro').textContent = stage.body;
    choices.setAttribute('aria-label', stage.label);
    choices.hidden = !stage.options.length;
    if (rebuild) choices.innerHTML = stage.options.map(([value, label]) => `<button type="button" data-rg-option="${value}" aria-pressed="${activeValue() === value}">${label}</button>`).join('');
    choices.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.rgOption === activeValue())));
    if (state.step === 'next') {
      detail.innerHTML = '<ul class="rg-brief-list"><li><span>01</span> Material & part geometry</li><li><span>02</span> Surface requirements</li><li><span>03</span> Production & timing</li><li><span>04</span> Open questions & drawings</li></ul>';
      caption.textContent = 'Your part. Your requirements.';
    } else {
      const [title, body] = details[state.step][activeValue()];
      detail.innerHTML = `<h3>${title}</h3><p>${body}</p>`;
      caption.textContent = title;
    }
    viewport.setAttribute('aria-label', `Ring gear application illustration: ${caption.textContent}. ${state.step === 'part' ? 'The two annular faces are the grinding surfaces; internal teeth remain neutral.' : stage.body}`);
    viewport.dataset.step = state.step;
    scene?.setState({ ...state });
    if (!scene) updateStaticImage();
  }
  async function initializeScene() {
    if (loading) return loading;
    loading = import('./ring-gear-scene.js').then(({ createRingScene }) => {
      scene = createRingScene(viewport, { onFaceSelect(face) {
        state.step = 'part';
        state.face = face === 'lower' ? 'lower' : 'upper';
        update();
      } });
      scene.setState({ ...state });
      syncRenderMode();
      const canvas = viewport.querySelector('canvas');
      canvas?.addEventListener('webglcontextlost', syncRenderMode);
      canvas?.addEventListener('webglcontextrestored', () => { host.querySelector('.rg-reset').hidden = false; host.querySelector('.rg-bottom-note').textContent = 'Explore with the controls or select a face on the model. Final process selection depends on your part.'; });
    }).catch(() => {
      viewport.dataset.renderMode = 'fallback';
      updateStaticImage();
      syncRenderMode();
    });
    return loading;
  }
  host.querySelectorAll('[data-rg-stage]').forEach(button => button.addEventListener('click', () => { state.step = button.dataset.rgStage; update(); initializeScene(); }));
  choices.addEventListener('click', event => {
    const button = event.target.closest('[data-rg-option]');
    if (!button) return;
    state[keyFor(state.step)] = button.dataset.rgOption;
    update({ rebuild: false });
    initializeScene();
  });
  host.querySelector('.rg-reset').addEventListener('click', () => scene?.reset());
  update();
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { initializeScene(); observer.disconnect(); } }, { rootMargin: '160px' });
    observer.observe(host);
  } else initializeScene();
}

document.querySelectorAll('[data-ring-explorer]').forEach(mountExplorer);
