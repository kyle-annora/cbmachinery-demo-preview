import { COMPANY as C } from './config.js';
import { ensureForDraft, recordInquiry, getProject, getProjectDraft, getProjectForRequest } from './projects/store.js';
import { confirmationView, receiverView } from './brand/request-records.js?v=response-20261029-1';
import { newDraft, escapeHTML as e, applyValue, validate, questions, snapshot, normalizeExplorationContext, explorationContextFromSearch, explorationDetails, applyExplorationEntry, normalizeWebsiteContext, websiteContextFromSearch, websiteDetails, applyWebsiteEntry } from './model.js';

const KEY = 'cb-demo-v1';
const app = document.getElementById('workspace');
let draft, errors = {}, editing = false, notice = '', busy = false, simulateFailure = false, storageWarning = false, requirementsOpen = false;
const FLOW_STEPS = ['Your inquiry', 'Review'];
const contextMedia = matchMedia('(min-width: 761px)');
let contextOpen = contextMedia.matches;
contextMedia.addEventListener('change', ev => { contextOpen=ev.matches; const panel=app.querySelector('.context-panel'); if(panel) panel.open=contextOpen; });
const get = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const store = (key, data) => { localStorage.setItem(key, JSON.stringify(data)); };
const event = (name, detail = {}) => { try { const events = get(KEY + ':events', []); events.push({ name, at: new Date().toISOString(), ...detail }); store(KEY + ':events', events.slice(-100)); } catch {} };
const save = () => { draft.editing = editing; draft.flowVersion = 2; try { ensureForDraft(draft); store(KEY + ':draft', draft); bindDraftUrl(); storageWarning = false; } catch { storageWarning = true; } updateDraftStatus(); };
const params = new URLSearchParams(location.search);
const entryExploration = explorationContextFromSearch(params);
const entryWebsite = entryExploration ? null : websiteContextFromSearch(params);
const initialSource = entryExploration ? 'machine-explorer' : params.get('source') === 'ring-gear' || params.get('application') === 'ring-gear' ? 'ring-gear' : 'home';
const requestedProject = params.get('project');
const resumedProject = requestedProject ? getProject(requestedProject) : null;
const resumedDraft = requestedProject ? getProjectDraft(requestedProject) : null;
const currentDraft = get(KEY + ':draft', {});
const savedDraft = requestedProject ? resumedDraft || {} : params.get('new') === '1' || currentDraft.submissionId ? {} : currentDraft;
const unavailableProject = Boolean(requestedProject && !resumedDraft && !resumedProject);
draft = { ...newDraft(initialSource), ...savedDraft };
draft.explorationContext = normalizeExplorationContext(draft.explorationContext);
draft.websiteContext = normalizeWebsiteContext(draft.websiteContext);
editing = Boolean(draft.editing);
if (!Array.isArray(draft.files)) draft.files = [];
// Existing four-step drafts restore without losing any answer or attachment reference.
draft.step = draft.flowVersion === 2 ? (draft.step === 1 ? 1 : 0) : (draft.step === 3 && !editing ? 1 : 0);
draft.flowVersion = 2;
requirementsOpen = draft.needsReview || ['materialNotes','diameter','thickness','volume','tolerance','flatness','parallelism','finish'].some(key => Boolean(draft[key])) || draft.material !== 'Not sure yet' || draft.files.length > 0;
// Explicit application entry seeds an empty draft; existing work stays intact.
if (!draft.part && initialSource === 'ring-gear') Object.assign(draft, { part: 'Ring gear', source: initialSource, sourceUrl: C.applicationUrl });
if (!draft.part && params.get('application') === 'ring-gear') draft.part = 'Ring gear';
if (!draft.part && params.get('application') === 'other') draft.part = 'Another part';
if (!draft.part && params.get('application') === 'not-sure') draft.part = 'Not sure yet';
if (entryExploration && applyExplorationEntry(draft, entryExploration) && (savedDraft.part || savedDraft.description || savedDraft.email)) notice = 'Your exploration context has been updated. Your existing application details have been kept.';
if (entryWebsite && applyWebsiteEntry(draft, entryWebsite) && (savedDraft.part || savedDraft.description || savedDraft.email)) notice = 'Your website starting point has been updated. Your existing project details have been kept.';

function bindDraftUrl() {
  if (!draft.projectId || draft.submissionId) return;
  const query = new URLSearchParams(location.search);
  if (query.get('project') === draft.projectId && !query.has('new')) return;
  query.delete('new'); query.set('project', draft.projectId);
  globalThis.CB_PAGES_REPLACE_STATE(null, '', globalThis.CB_PAGES_PATH() + '?' + query.toString() + (location.hash || ''));
}
function set(key, value) { applyValue(draft, key, value); save(); }
function icon(name) { return globalThis.CB_PAGES_HTML(`<img class="flow-icon" src="/cbmachinery-demo-preview/review-kit/icons/${name}.svg" alt="" aria-hidden="true">`); }
function updateDraftStatus() { const status=app.querySelector('.draft-status'); if(status) status.textContent=storageWarning ? 'Draft not saved — keep this tab open' : 'Draft saved in this browser'; }
function badge(text) { return `<span class="eyebrow">${e(text)}</span>`; }
function display(value, unit = '') { return value === '' || value == null || value === 'Not sure yet' ? '<span class="unknown">To discuss</span>' : `${e(value)}${unit ? ' <span class="value-unit">' + e(unit) + '</span>' : ''}`; }
function field(key, label, placeholder = '', type = 'text', extra = '') {
  const invalid = errors[key];
  return `<div class="field"><label for="${key}">${label}</label><input id="${key}" name="${key}" type="${type}" value="${e(draft[key])}" placeholder="${e(placeholder)}" ${type === 'number' ? 'min="0" step="any" inputmode="decimal"' : ''} ${extra} ${invalid ? `aria-invalid="true" aria-describedby="error-${key}"` : ''}>${invalid ? `<span class="field-error" id="error-${key}">${e(invalid)}</span>` : ''}</div>`;
}
function select(key, label, options) { return `<div class="field"><label for="${key}">${label}</label><select id="${key}" name="${key}">${options.map(v => `<option ${draft[key] === v ? 'selected' : ''}>${e(v)}</option>`).join('')}</select></div>`; }
function choices(key, values) { return `<div class="choice-grid ${key === 'part' ? 'part-choices' : ''}" role="group" aria-label="${key === 'part' ? 'Part' : 'Grinding goal'}">${values.map((v,i) => `<button type="button" class="choice ${draft[key] === v ? 'selected' : ''}" data-choice="${key}" data-value="${e(v)}" aria-pressed="${draft[key] === v}"><span>${e(v)}</span><span class="choice-radio" aria-hidden="true"></span></button>`).join('')}</div>`; }
function aside() {
  const ring = draft.part === 'Ring gear';
  return globalThis.CB_PAGES_HTML(`<details class="context-panel" ${contextOpen ? 'open' : ''}><summary>Your project so far ${icon('chevron-down')}</summary><div class="context-content"><div class="context-top">${badge('APPLICATION BRIEF')}<span class="live-dot">Updates as you go</span></div><div class="part-scene ${ring ? 'ring-scene' : ''}">${ring ? globalThis.CB_PAGES_HTML(`<img src="${C.images.ring}" alt="Ring gears from a published C&B application">`) : globalThis.CB_PAGES_HTML(`<img src="${C.images.machine}" alt="Representative C&B double-disc grinding system">`)}<span>${ring ? 'RING GEAR · FACE GRINDING' : 'BUILT AROUND YOUR APPLICATION'}</span></div><div class="context-copy"><h2>${e(draft.part || 'Your next grinding project')}</h2><p>${e(draft.goal || 'Start with the part. We’ll work through the process together.')}</p></div><dl class="live-specs"><div><dt>Material</dt><dd>${display(draft.material)}</dd></div><div><dt>Outside diameter</dt><dd>${display(draft.diameter, draft.unit)}</dd></div><div><dt>Production target</dt><dd>${display(draft.volume, draft.volumeUnit)}</dd></div><div><dt>Timeline</dt><dd>${display(draft.timing)}</dd></div></dl><div class="engineer-note"><span class="small-icon">${icon('settings-2')}</span><p>${draft.goal === 'Improve an existing process' ? 'Tell us where your current process falls short. C&B can review the application and existing equipment together.' : 'You don’t need to choose a machine. These details help an engineer understand your application.'}</p></div></div></details>`);
}
function updateAside() { const old = app.querySelector('.context-panel'); if (old) { contextOpen=old.open; old.outerHTML = aside(); app.querySelector('.context-panel').addEventListener('toggle',ev => contextOpen=ev.target.open); } }
function applicationStep() {
  const exploration = explorationDetails(draft.explorationContext);
  const website = websiteDetails(draft.websiteContext);
  const origin = exploration ? `<div class="source-note explorer-source">From the ${exploration.entry === 'application' ? 'ring gear application explorer' : 'machine explorer'}: ${e(exploration.focusLabel)}.<br><small>Browsing context only. Your requirements are defined below.</small></div>` : website ? `<div class="source-note explorer-source">Starting from ${e(website.label)}.<br><small>Tell us about your project below. This page visit does not select a machine.</small></div>` : draft.source === 'ring-gear' ? `<div class="source-note">${icon('circle-check')} Starting from the ring gear application</div>` : '';
  return `${origin}<fieldset><legend>What are you working on?</legend>${choices('part', C.parts)}${errors.part ? `<p class="field-error" role="alert">${e(errors.part)}</p>` : ''}</fieldset><fieldset><legend>What would you like to do?</legend>${choices('goal', C.goals)}</fieldset><div class="field"><label for="description">Anything else we should know? <span>Optional</span></label><textarea id="description" name="description" rows="3" maxlength="2500" placeholder="For example, we need to finish-grind both faces of a steel ring gear…">${e(draft.description)}</textarea><small>Use your own words. A rough description is a good place to start.</small></div>`;
}
function requirementsStep() {
  return `${draft.needsReview ? '<div class="notice">Your application changed. Check the requirements below before continuing; your answers have been kept.</div>' : ''}<div class="field-grid">${select('material','Material', C.material)}${field('materialNotes','Material grade or condition <span>Optional</span>','e.g. steel, hardened to 40 Rc')}</div><div class="fieldset-heading"><h2>Part dimensions</h2>${select('unit','Units',['mm','in'])}</div><div class="field-grid">${field('diameter','Outside diameter','To discuss','number')}${field('thickness','Finished thickness','To discuss','number')}</div><div class="field-grid">${field('volume','Target production rate','To discuss','number')}${select('volumeUnit','Production basis',['parts / hour','parts / minute'])}</div><details class="precision" ${['tolerance','flatness','parallelism','finish'].some(k => draft[k] || errors[k]) ? 'open' : ''}><summary>Have precision requirements? <span>Optional</span></summary><div class="field-grid">${field('tolerance',`Size tolerance ± (${e(draft.unit)})`,'To discuss','number')}${field('flatness',`Flatness (${e(draft.unit)})`,'To discuss','number')}${field('parallelism',`Parallelism (${e(draft.unit)})`,'To discuss','number')}${field('finish','Surface finish','To discuss','number')}${select('finishUnit','Surface finish units',['Ra µm','Ra µin'])}</div><p class="small-muted">Enter drawing requirements if available. Feasibility is subject to engineering review.</p></details><div class="file-area"><div><h2>Have a drawing or a photo?</h2><p>Add a reference to your brief. Optional.</p></div><label class="file-button" for="files">${icon('file-text')} Choose files</label><input class="visually-hidden" id="files" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.step,.stp,.dxf"><p class="file-disclosure">Demo: filenames only. Files stay on your device and are not uploaded or analyzed. Up to 5 files, 20 MB each.</p><ul class="file-list">${draft.files.map((f,i) => `<li><span>${e(f.name)} <small>${Math.ceil(f.size / 1024)} KB · Not uploaded</small></span><button type="button" class="remove-file" data-remove="${i}" aria-label="Remove ${e(f.name)}">${icon('x')}</button></li>`).join('')}</ul></div>`;
}
function contactStep() {
  return `<p class="small-muted">Fields marked * are required.</p><div class="field-grid">${field('name','Full name *','Your name','text','autocomplete="name" maxlength="120" required aria-required="true"')}${field('company','Company *','Company name','text','autocomplete="organization" maxlength="160" required aria-required="true"')}</div>${field('email','Work email *','you@company.com','email','autocomplete="email" maxlength="254" required aria-required="true"')}${field('phone','Phone <span>Optional</span>','Include country code','tel','autocomplete="tel" maxlength="60"')}<details class="intake-timing" ${draft.stage !== 'Not sure yet' || draft.timing !== 'Not sure yet' ? 'open' : ''}><summary>Project timing <span>Optional</span>${icon('chevron-down')}</summary><div class="field-grid">${select('stage','Project stage',C.stage)}${select('timing','Target timeline',C.timing)}</div></details><div class="privacy-note">Local demo. Your details stay in this browser; nothing is sent to C&B.</div>`;
}
function row(label, value, unit) { return `<div><dt>${label}</dt><dd>${display(value,unit)}</dd></div>`; }
function group(title, step, content, edit) { return `<section class="review-group"><div class="group-title"><h2>${title}</h2>${edit ? `<button class="text-link" type="button" data-edit="${step}" aria-label="Edit ${title.toLowerCase()}">Edit ${icon('arrow-up-right')}</button>` : ''}</div>${content}</section>`; }
function explorationSummary(d, allowNavigation = true) {
  const context = explorationDetails(d.explorationContext);
  if (!context) { const website=websiteDetails(d.websiteContext); return website ? globalThis.CB_PAGES_HTML(`<section class="review-group exploration-context"><div class="group-title"><h2>Website context</h2></div><p>Started from ${allowNavigation ? globalThis.CB_PAGES_HTML(`<a class="text-link" href="${e(website.href)}">${e(website.label)}</a>`) : e(website.label)}.</p><p class="small-muted">Browsing context only — not a selected machine or a confirmed specification.</p></section>`) : ''; }
  return globalThis.CB_PAGES_HTML(`<section class="review-group exploration-context"><div class="group-title"><h2>Exploration context</h2></div><dl>${row('Equipment context', context.equipmentLabel)}${row('Area of interest', context.focusLabel)}</dl><p class="small-muted exploration-note">Browsing context only — not a selected configuration or a confirmed requirement.</p>${allowNavigation ? globalThis.CB_PAGES_HTML(`<a class="text-link exploration-return" href="${e(context.href)}">Return to this view in the explorer</a>`) : ''}</section>`);
}
function summary(d, edit = false) {
  return group('Application',0,`<dl>${row('Part',d.part)}${row('Grinding objective',d.goal)}</dl>${d.description ? `<div class="original-description"><span>In your words</span><p>${e(d.description)}</p></div>` : ''}`,edit)
    + group('Part & precision',1,`<h3 class="review-subheading">Material &amp; geometry</h3><dl>${row('Material',d.material)}${d.materialNotes ? row('Grade / condition',d.materialNotes) : ''}${row('Outside diameter',d.diameter,d.unit)}${row('Finished thickness',d.thickness,d.unit)}</dl><h3 class="review-subheading">Surface requirements</h3><dl>${row('Size tolerance ±',d.tolerance,d.unit)}${row('Flatness',d.flatness,d.unit)}${row('Parallelism',d.parallelism,d.unit)}${row('Surface finish',d.finish,d.finishUnit)}</dl><div class="attachment-summary"><span>Drawing / photo references</span>${d.files.length ? `<ul>${d.files.map(f => `<li>${e(f.name)} <small>· Filename only, not uploaded</small></li>`).join('')}</ul>` : '<p class="unknown">None added — can be discussed later</p>'}</div>`,edit)
    + group('Production & timing',1,`<dl>${row('Production target',d.volume,d.volumeUnit)}${row('Project stage',d.stage)}${row('Target timing',d.timing)}</dl>`,edit)
    + group('Contact details',2,`<dl>${row('Name',d.name)}${row('Company',d.company)}${row('Email',d.email)}${row('Phone',d.phone)}</dl>`,edit)
    + explorationSummary(d, !edit) + `<section class="discuss-group"><h2>To discuss with C&B</h2><p>Open questions for the engineering conversation.</p><ul>${(d.questions || questions(d)).map(q => `<li>${e(q)}</li>`).join('') || '<li>Confirm the application and feasibility with an engineer.</li>'}</ul></section>`;
}
function reviewStep() { return `${draft.needsReview ? '<div class="notice">Your application changed. Please review your requirements.<button type="button" data-edit="1" class="text-link">Review requirements</button></div>' : ''}${summary(draft,true)}<p class="privacy-note">Local demo: submitting saves this inquiry to My projects in this browser. Nothing is sent to C&B.</p>`; }
function controls() { return `<details class="demo-controls"><summary>Demo controls</summary><div><button type="button" data-action="sample">Load example project</button><button type="button" data-action="reset">Start a new draft</button><button type="button" data-action="events">View local events</button><label><input type="checkbox" id="fail-save" ${simulateFailure ? 'checked' : ''}> Test a save failure</label></div><p>Synthetic example · Records are stored only in this browser.</p><pre id="event-log" hidden></pre></details>`; }
const STEP_INTROS = [
  ['YOUR INQUIRY', 'Tell us about <span class="brand-emphasis">your part.</span>', 'Share what you know and how to reach you. You can leave technical details open.'],
  ['REVIEW', 'Review your <span class="brand-emphasis">inquiry.</span>', 'Confirm your details. Your inquiry will stay together in My projects.']
];
function fillingStep() {
  const technicalErrors = ['diameter','thickness','volume','tolerance','flatness','parallelism','finish'].some(key => errors[key]);
  return `<section class="intake-section" id="intake-application" tabindex="-1"><div class="intake-section-heading"><h2>Your application</h2></div>${applicationStep()}</section>
  <details class="intake-requirements" ${requirementsOpen || technicalErrors || draft.needsReview ? 'open' : ''}><summary><span><strong>Part & process details</strong><span>Optional · Add the requirements you already know</span></span>${icon('chevron-down')}</summary><section class="intake-section" id="intake-requirements" tabindex="-1">${requirementsStep()}</section></details>
  <section class="intake-section intake-contact" id="intake-contact" tabindex="-1"><div class="intake-section-heading"><h2>How can we reach you?</h2><p>Your contact details stay with this project.</p></div>${contactStep()}</section>`;
}
function reviewHandoff() {
  const count=questions(draft).length;
  return `<section class="review-handoff" aria-labelledby="handoff-title">${badge('YOUR PROJECT')}<h2 id="handoff-title">Everything stays<br>with your project.</h2><p class="review-handoff-copy">Your inquiry and any quotation can be found together in My projects.</p><dl class="handoff-meta"><div><dt>Contact</dt><dd>${e(draft.name)}</dd></div><div><dt>Company</dt><dd>${e(draft.company)}</dd></div><div><dt>Timeline</dt><dd>${display(draft.timing)}</dd></div><div><dt>Open questions</dt><dd>${count} ${count === 1 ? 'point' : 'points'} to discuss</dd></div></dl><p class="handoff-disclosure">Local demo only. Saved in this browser; nothing is sent to C&B.</p></section>`;
}
function render(focus = false) {
  document.title = `${FLOW_STEPS[draft.step]} | C&B Machinery`;
  app.dataset.view='intake'; app.dataset.step=String(draft.step);
  const [label,title,description]=STEP_INTROS[draft.step];
  app.innerHTML = `<header class="flow-hero"><div class="flow-top site-shell"><div class="flow-topline"><ol class="stepper" aria-label="Inquiry progress: step ${draft.step+1} of 2">${FLOW_STEPS.map((step,i) => `<li class="${i === draft.step ? 'active' : i < draft.step ? 'complete' : ''}" ${i === draft.step ? 'aria-current="step"' : ''}><span aria-hidden="true">${i < draft.step ? icon('circle-check') : i+1}</span>${step}</li>`).join('')}</ol><span class="draft-status" role="status">${storageWarning ? 'Draft not saved — keep this tab open' : 'Draft saved in this browser'}</span></div><div class="step-heading"><h1 tabindex="-1">${title}</h1><p>${description}</p></div></div></header><div class="workspace-grid site-shell"><form id="request-form" class="question-panel" novalidate>${notice ? `<div class="notice" role="status">${e(notice)}</div>` : ''}${draft.step === 1 ? reviewStep() : fillingStep()}<div class="form-actions">${draft.step === 1 ? `<button type="button" class="back-button btn btn-secondary" data-action="back">${icon('arrow-right')} Edit inquiry</button>` : '<span class="small-muted">Your progress is saved<br>as you go.</span>'}<button class="btn btn-primary next-button" type="submit">${draft.step === 1 ? 'Submit inquiry' : editing ? 'Update & review' : 'Review inquiry'} ${icon('arrow-right')}</button></div></form><aside>${draft.step === 1 ? reviewHandoff() : aside()}</aside></div><div class="site-shell flow-bottom"><p>Precision grinding. Personal engineering.</p>${controls()}</div>`;
  if (focus) { app.querySelector('h1').focus({preventScroll:true}); window.scrollTo({top:0,behavior:'instant'}); }
  bind();
}
function go(step) { draft.step = step === 1 ? 1 : 0; errors = {}; notice = ''; save(); event(draft.step === 1 ? 'review_view' : 'step_view',{step:draft.step,source:draft.source}); render(true); }
function validateInquiry() { return {...validate(draft,0), ...validate(draft,1), ...validate(draft,2)}; }
function showInquiryErrors() {
  draft.step = 0;
  requirementsOpen = requirementsOpen || ['diameter','thickness','volume','tolerance','flatness','parallelism','finish'].some(key => errors[key]);
  render();
  const key=Object.keys(errors)[0];
  (app.querySelector('#'+key) || app.querySelector('[data-choice]'))?.focus();
}

function changeUnit(key,value) {
  const old = draft[key]; if(old === value) return;
  let factor, keys;
  if(key === 'unit') { factor = old === 'mm' ? 1/25.4 : 25.4; keys = ['diameter','thickness','tolerance','flatness','parallelism']; }
  if(key === 'finishUnit') { factor = old === 'Ra µm' ? 1/.0254 : .0254; keys = ['finish']; }
  if(key === 'volumeUnit') { factor = old === 'parts / hour' ? 1/60 : 60; keys = ['volume']; }
  let changed = false; for(const k of keys) if(draft[k] !== '' && Number.isFinite(Number(draft[k]))) { draft[k] = String(Number((Number(draft[k])*factor).toPrecision(12))); changed = true; }
  set(key,value); notice = changed ? 'Your entered values have been converted to the new units.' : ''; render();
}
function invalidNumericField() { return [...app.querySelectorAll('input[type="number"]')].find(input => input.validity?.badInput); }
function showNumericError(input) {
  const message='Enter a valid number, or clear this field to leave it open.';
  errors[input.name]=message;
  input.setAttribute('aria-invalid','true'); input.setAttribute('aria-describedby','error-'+input.name);
  let error=app.querySelector('#error-'+input.name);
  if(!error) { error=document.createElement('span'); error.id='error-'+input.name; error.className='field-error'; input.after(error); }
  error.textContent=message;
  const status=app.querySelector('.draft-status'); if(status) status.textContent='Complete the highlighted value to save your changes';
}
function bind() {
  app.querySelector('.context-panel')?.addEventListener('toggle',ev => contextOpen=ev.target.open);
  app.querySelector('.intake-requirements')?.addEventListener('toggle',ev => requirementsOpen=ev.target.open);
  app.querySelectorAll('[name]').forEach(input => input.addEventListener(input.tagName === 'SELECT' ? 'change' : 'input', () => {
    if(input.type === 'number' && input.validity.badInput) { showNumericError(input); return; }
    if(['unit','finishUnit','volumeUnit'].includes(input.name)) { const invalid=invalidNumericField(); if(invalid) { input.value=draft[input.name]; showNumericError(invalid); invalid.focus(); return; } return changeUnit(input.name,input.value); }
    set(input.name,input.value); updateAside();
    if(errors[input.name]) { delete errors[input.name]; input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby'); app.querySelector('#error-' + input.name)?.remove(); }
  }));
  app.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click',() => { set(button.dataset.choice,button.dataset.value); errors = {}; render(); app.querySelector(`[data-choice="${button.dataset.choice}"][data-value="${button.dataset.value}"]`)?.focus({preventScroll:true}); }));
  app.querySelectorAll('[data-edit]').forEach(button => button.addEventListener('click',() => { const section=Number(button.dataset.edit); editing = true; if(section === 1) requirementsOpen=true; go(0); app.querySelector(['#intake-application','#intake-requirements','#intake-contact'][section])?.focus(); }));
  app.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click',() => { draft.files.splice(Number(button.dataset.remove),1); draft.submissionId=null; save(); render(); }));
  app.querySelector('#files')?.addEventListener('change', ev => {
    notice='';
    for(const f of ev.target.files) {
      if(f.size > 20*1024*1024) { notice='A file was too large. Choose files of 20 MB or less.'; continue; }
      if(draft.files.length >= 5) { notice='You can add up to 5 file references. Remove one to add another.'; break; }
      if(!draft.files.some(x => x.name === f.name && x.size === f.size)) draft.files.push({name:f.name,size:f.size,type:f.type});
    }
    draft.submissionId=null; save(); render();
  });
  app.querySelector('form')?.addEventListener('submit', ev => { ev.preventDefault(); next(); });
  app.querySelector('[data-action="back"]')?.addEventListener('click',() => { editing = true; go(0); });
  app.querySelector('[data-action="sample"]')?.addEventListener('click',() => {
    const exploration = draft.explorationContext;
    const website = draft.websiteContext;
    draft = {...newDraft('ring-gear'),goal:'Grind two opposing faces',description:'We are developing a new steel ring gear. We need both faces finish-ground and would like to discuss an automated loading approach.',material:'Steel',materialNotes:'Heat-treatment condition to confirm',diameter:'180',thickness:'22',volume:'180',stage:'Defining requirements',timing:'3–6 months',name:'Alex Morgan',company:'Example Powertrain Co.',email:'alex@example.com'};
    applyExplorationEntry(draft, exploration);
    if (!exploration) applyWebsiteEntry(draft, website);
    requirementsOpen=true; editing=false; errors={}; notice='Example project loaded. These are synthetic requirements, not C&B performance claims.'; save(); render(true);
  });
  app.querySelector('[data-action="reset"]')?.addEventListener('click',() => { draft=newDraft(initialSource); applyExplorationEntry(draft, entryExploration); applyWebsiteEntry(draft, entryWebsite); if (!draft.part && params.get('application') === 'ring-gear') draft.part = 'Ring gear'; requirementsOpen=false; editing=false; errors={}; notice='A new draft is ready. Previously saved requests remain available at their own URLs.'; save(); render(true); });
  app.querySelector('[data-action="events"]')?.addEventListener('click',() => { const log=app.querySelector('#event-log'); log.hidden=!log.hidden; log.textContent=JSON.stringify(get(KEY+':events',[]),null,2); });
  app.querySelector('#fail-save')?.addEventListener('change',ev => simulateFailure=ev.target.checked);
}
function next() {
  const invalid=invalidNumericField(); if(invalid) { showNumericError(invalid); invalid.focus(); return; }
  errors = validateInquiry();
  if(Object.keys(errors).length) { showInquiryErrors(); return; }
  if(draft.step === 1) return submit();
  draft.needsReview=false;
  event('step_complete',{step:0,source:draft.source});
  editing=false; go(1);
}
async function submit() {
  if(busy) return;
  errors=validateInquiry();
  if(Object.keys(errors).length) { editing=true; showInquiryErrors(); return; }
  if(draft.needsReview) { editing=true; requirementsOpen=true; go(0); return; }
  busy=true; const button=app.querySelector('.next-button'); button.disabled=true; button.textContent='Saving inquiry…';
  // Yield one frame so the saving state is visible; no network request is made.
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  try {
    if(simulateFailure) throw new Error('Simulated failure');
    ensureForDraft(draft);
    const id=draft.submissionId || 'CB-DEMO-' + crypto.randomUUID().slice(0,8).toUpperCase();
    const existing=get(KEY+':request:'+id,null);
    const record=existing || snapshot(draft,id);
    store(KEY+':request:'+id,record);
    draft.submissionId=id;
    const projectId=recordInquiry(record);
    draft.projectId=projectId; save();
    event('request_saved',{id,projectId,source:draft.source});
    globalThis.CB_PAGES_ASSIGN('/projects/?project='+encodeURIComponent(projectId));
  } catch {
    busy=false; notice='The demo request could not be saved in this browser. Your answers are still here. Enable browser storage, or turn off “Test a save failure”, then try again.'; render(true);
  }
}
function recordRoute() {
  const receiver=globalThis.CB_PAGES_PATH().startsWith('/demo/requests/');
  const projectsLink=document.querySelector?.('.project-access');
  if(receiver && projectsLink) { projectsLink.href=globalThis.CB_PAGES_URL('/demo/'); projectsLink.textContent='C&B workspace'; }
  let id;
  try { id=receiver ? decodeURIComponent(globalThis.CB_PAGES_PATH().split('/')[3] || params.get('id') || '') : params.get('id'); } catch { id=null; }
  const d=id ? get(KEY+':request:'+id,null) : null;
  if(!d) {
    app.dataset.view='empty'; document.title='Request not found | C&B Machinery';
    app.innerHTML=globalThis.CB_PAGES_HTML(`<div class="empty-state site-shell">${badge('LOCAL DEMO')}<h1>No saved request here.</h1><p>This request is only available in the browser where it was created. Start a project to see the complete journey.</p><a class="btn btn-primary" href="/cbmachinery-demo-preview/request/">Start a project ${icon('arrow-right')}</a></div>`); return;
  }
  if(!receiver) { const projectId=getProjectForRequest(d.submissionId)?.id || recordInquiry(d); globalThis.CB_PAGES_ASSIGN('/projects/?project='+encodeURIComponent(projectId)); return; }
  document.title=`C&B request detail · ${d.submissionId}`;
  app.dataset.view=receiver ? 'receiver' : 'confirmation';
  app.innerHTML=receiver ? receiverView(d,summary(d)) : confirmationView(d,summary(d));
  app.querySelector('#print-summary')?.addEventListener('click',() => window.print());
  app.querySelector('a[href="#saved-summary"]')?.addEventListener('click',() => app.querySelector('#saved-summary').open=true);
}
if(globalThis.CB_PAGES_PATH().startsWith('/request/confirmation') || globalThis.CB_PAGES_PATH().startsWith('/demo/requests/')) recordRoute();
else if(requestedProject && resumedProject && !resumedDraft) { globalThis.CB_PAGES_ASSIGN('/projects/?project='+encodeURIComponent(requestedProject)); }
else if(unavailableProject) { app.innerHTML=globalThis.CB_PAGES_HTML('<div class="empty-state site-shell"><h1>This project is not available here.</h1><p>Projects are saved in the browser where they were created.</p><a class="btn btn-secondary" href="/cbmachinery-demo-preview/projects/">View My projects</a></div>'); }
else { save(); event('intake_start',{source:draft.source,step:draft.step}); render(); }

document.addEventListener('error', ev => { if(ev.target?.tagName === 'IMG') { const fallback=document.createElement('span'); fallback.className='image-fallback'; fallback.textContent=ev.target.alt || 'Image unavailable'; ev.target.replaceWith(fallback); } }, true);
