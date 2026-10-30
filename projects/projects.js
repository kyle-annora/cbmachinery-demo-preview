import {escapeHTML as e, questions} from '../model.js';
import {migrateLegacyProjects, listProjects, getProject, projectInquiries, projectQuotations, projectHref} from './store.js';
import {projectState, projectContext, quotationHref as quoteHref, savedInquiryHref as inquiryHref} from './presentation.js';
import {accountConversionCard, initAccountConversion} from './account-conversion.js?v=tasks-20261029-1';
import {CALL_CASE_KEY, getCallCase} from '../overview/call-case.js?v=call-20261029-3';
const root = document.querySelector('#project-main');
const icon = name => globalThis.CB_PAGES_HTML(`<img src="/cbmachinery-demo-preview/review-kit/icons/${name}.svg" alt="" aria-hidden="true">`);
const date = value => { const d = new Date(value); return Number.isNaN(d.getTime()) ? 'Recently' : d.toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'}); };
const projectTitle = p => p.title && p.title !== 'Not sure yet' ? p.title : 'Grinding project';
const localNote = '<p class="pj-local-note">Saved in this browser only. This demo does not send inquiries or quotations to C&B.</p>';
const stateIcons = {draft:'pencil', inquiry:'circle-check', quote:'file-text'};
const stateMarkup = state => `<div class="pj-project-state"><span class="pj-status" data-state="${state.kind}">${icon(stateIcons[state.kind])}${state.label}</span>${state.revision?`<span class="pj-state-detail">${e(state.revision)}</span>`:''}${state.draftLabel?`<span class="pj-draft-note">${icon('pencil')}${e(state.draftLabel)}</span>`:''}</div>`;
let warning = '';
try { migrateLegacyProjects(); } catch { warning = 'Browser storage is unavailable. Existing records may still be visible; new changes cannot be saved.'; }
function hero(kicker, title, description, extra = '') { return `<section class="pj-hero"><div class="site-wrap"><p class="pj-kicker">${kicker}</p><h1>${title}</h1><p class="pj-intro">${description}</p>${extra}</div></section>`; }
function empty(title, description) { root.innerHTML = hero('MY PROJECTS',title,description) + globalThis.CB_PAGES_HTML(`<div class="site-wrap pj-empty"><a class="btn btn-primary" href="/cbmachinery-demo-preview/request/?new=1">Start an inquiry ${icon('arrow-right')}</a>${localNote}${warning ? `<p role="alert">${e(warning)}</p>` : ''}</div>`); }
function draftInquiryHref(project) {
  try {
    const call = getCallCase();
    if (call?.phase === 'brief' && call.projectId === project.id) return '/overview/#brief';
  } catch {}
  return '/request/?project='+encodeURIComponent(project.id);
}
function list() {
  const projects = listProjects();
  if (!projects.length) return empty('Your next project starts here.', 'Continue a saved inquiry or return to a quotation. Your projects will appear here as you work.');
  const accountProject = projects.find(p => projectInquiries(p).length);
  root.innerHTML = hero('MY PROJECTS', 'Pick up where you left off.', 'Your inquiries and quotations, together in one place.') + globalThis.CB_PAGES_HTML(`<section class="site-wrap pj-content"><div class="pj-list-heading"><h2 id="pj-list-title">${projects.length} ${projects.length===1?'project':'projects'}</h2><a class="btn btn-secondary pj-link pj-new-inquiry" href="/cbmachinery-demo-preview/request/?new=1">Start a new inquiry ${icon('arrow-right')}</a></div><div class="pj-list-columns" aria-hidden="true"><span>Project</span><span>Documents</span><span>Last updated</span><span>Quick action</span></div><ul class="pj-project-list" role="list" aria-labelledby="pj-list-title">${projects.map(p => {
    const quotes = projectQuotations(p), records = projectInquiries(p), state = projectState(p, records, quotes), data = state.currentData;
    const title = projectTitle(p), context = projectContext(data), action = state.hasDraft && !state.latestQuote ? {...state.primaryAction,href:draftInquiryHref(p)} : state.primaryAction;
    return globalThis.CB_PAGES_HTML(`<li class="pj-project-row" data-state="${state.kind}"><div class="pj-project-title"><h3><a class="pj-project-name" href="${projectHref(p.id)}" aria-label="View ${e(title)} project, reference ${e(p.id)}">${e(title)}</a></h3><p class="pj-project-company">${e(data.company || p.company || 'Company to add')}</p>${context?`<p class="pj-project-context">${e(context)}</p>`:''}</div>${stateMarkup(state)}<div class="pj-project-meta"><time datetime="${e(p.updatedAt || '')}">${e(date(p.updatedAt))}</time><span>${e(p.id)}</span></div><a class="btn btn-secondary pj-row-action" href="${action.href}" aria-label="${e(action.label)} for ${e(title)}, reference ${e(p.id)}${state.latestQuote?`, revision ${state.latestQuote.revision}`:''}">${action.label}${icon('arrow-right')}</a></li>`);
  }).join('')}</ul>${accountConversionCard(accountProject, {}, {compact:true})}${localNote}${warning?`<p role="alert">${e(warning)}</p>`:''}</section>`);
}
const show = (v, unit='') => v && v !== 'Not sure yet' ? `${e(v)}${unit ? ' '+e(unit) : ''}` : '<span class="pj-muted">To discuss</span>';
const fact = (label, value, unit) => `<div><dt>${label}</dt><dd>${show(value,unit)}</dd></div>`;
function callResponsePanel(project,quotes) {
  // The presentation's local request is supporting context, not a project sales state.
  let call;
  try { call = getCallCase(); } catch { return ''; }
  const response = call?.response;
  if (!response || call.projectId !== project.id || !project.requestIds.includes(response.requestId)
    || !quotes.some(quote=>quote.id === response.quoteId && quote.revision === response.revision && quote.requestId === response.requestId)) return '';
  return `<section class="pj-section pj-call-response" aria-labelledby="pj-call-response-title"><p class="pj-kicker">DEMO FOLLOW-UP · SAVED LOCALLY</p><h2 id="pj-call-response-title">${response.kind === 'revision'?'Revision request saved.':'Discussion request saved.'}</h2>${response.note?`<p class="pj-response-note">${e(response.note)}</p>`:''}<p class="pj-response-meta"><span>${e(response.quoteId)} · Rev ${String(response.revision).padStart(2,'0')}</span><time datetime="${e(response.savedAt)}">${e(date(response.savedAt))}</time></p><p class="pj-response-boundary">Saved in this browser. Not sent to C&B and not an order or quotation acceptance.</p></section>`;
}
function detail(project) {
  const records = projectInquiries(project), quotes = projectQuotations(project), state = projectState(project, records, quotes);
  const latest = state.latestInquiry, q = state.latestQuote, data = state.currentData;
  const openQuestions = state.hasDraft ? questions({...data,files:data.files||[]}) : data.questions || questions({...data,files:data.files||[]});
  document.title = `${projectTitle(project)} | C&B Machinery`;
  const primary = state.hasDraft ? globalThis.CB_PAGES_HTML(`<a class="btn btn-primary" href="${draftInquiryHref(project)}">Continue inquiry ${icon('arrow-right')}</a>`) : q ? globalThis.CB_PAGES_HTML(`<a class="btn btn-secondary" href="${quoteHref(q)}">View quotation ${icon('arrow-right')}</a>`) : latest ? globalThis.CB_PAGES_HTML(`<a class="btn btn-secondary" href="${inquiryHref(latest)}">View inquiry document ${icon('arrow-right')}</a>`) : '';
  const quoteSource = state.quoteInquiry;
  const quoteSourceNote = q ? globalThis.CB_PAGES_HTML(`<p class="pj-quote-source">Based on inquiry ${e(q.requestId || 'reference not recorded')}${quoteSource?.savedAt?` · saved ${e(date(quoteSource.savedAt))}`:''}.${state.hasDraft?' Your current draft is separate from this quotation.':latest && latest.submissionId!==q.requestId?' This quotation references an earlier saved inquiry.':''}${state.hasQuoteInquiryDocument?globalThis.CB_PAGES_HTML(` <a class="pj-link" href="${inquiryHref(quoteSource)}">View source inquiry ${icon('arrow-up-right')}</a>`):''}</p>`) : '';
  root.innerHTML = globalThis.CB_PAGES_HTML(`<header class="pj-hero pj-detail-hero"><div class="site-wrap"><a class="pj-back" href="/cbmachinery-demo-preview/projects/">${icon('arrow-right')} My projects</a><div class="pj-detail-heading"><div><h1>${e(projectTitle(project))}</h1><p class="pj-intro">${e(data.company || project.company || 'Your grinding application')}</p></div>${primary}</div><div class="pj-hero-meta">${stateMarkup(state)}<span>${e(project.id)}</span><span>Updated ${e(date(project.updatedAt))}</span></div></div></header><div class="site-wrap pj-content pj-detail-grid"><div class="pj-main-sections">
    <section class="pj-section pj-inquiry" aria-labelledby="pj-inquiry-title"><header class="pj-section-heading"><div><p class="pj-kicker">${state.hasDraft?'CURRENT DRAFT':'SAVED INQUIRY'}</p><h2 id="pj-inquiry-title">${state.hasDraft?'Your current draft.':'Your saved inquiry.'}</h2></div>${latest&&!state.hasDraft?`<span class="pj-section-reference">${e(latest.submissionId)}</span>`:''}</header>${state.hasDraft&&latest?`<p class="pj-version-note">These are your draft requirements. Saved inquiry ${e(latest.submissionId)} remains unchanged.</p>`:''}
      <div class="pj-fact-group"><h3>Application</h3><dl class="pj-facts">${fact('Part',data.part || projectTitle(project))}${fact('Grinding objective',data.goal)}</dl>${data.description?`<div class="pj-description"><h4>In your words</h4><p>${e(data.description)}</p></div>`:''}</div>
      <div class="pj-fact-group"><h3>Part &amp; precision</h3><dl class="pj-facts">${fact('Material',data.material)}${data.materialNotes?fact('Grade / condition',data.materialNotes):''}${fact('Outside diameter',data.diameter,data.unit)}${fact('Finished thickness',data.thickness,data.unit)}</dl><details class="pj-precision"><summary>Surface requirements ${icon('chevron-down')}</summary><dl class="pj-facts">${fact('Size tolerance ±',data.tolerance,data.unit)}${fact('Flatness',data.flatness,data.unit)}${fact('Parallelism',data.parallelism,data.unit)}${fact('Surface finish',data.finish,data.finishUnit)}</dl></details></div>
      <div class="pj-fact-group"><h3>Production &amp; timing</h3><dl class="pj-facts">${fact('Production target',data.volume,data.volumeUnit)}${fact('Project stage',data.stage)}${fact('Target timing',data.timing)}</dl></div>
      ${data.files?.length?`<div class="pj-fact-group"><h3>Drawing references</h3><ul class="pj-file-references">${data.files.map(file=>`<li>${e(file.name)}<small>Filename only · Not uploaded</small></li>`).join('')}</ul></div>`:''}
      ${latest&&(state.hasDraft||q)?globalThis.CB_PAGES_HTML(`<a class="btn btn-secondary pj-link" href="${inquiryHref(latest)}">Read saved inquiry ${icon('arrow-up-right')}</a>`):''}
      ${records.length>1?globalThis.CB_PAGES_HTML(`<details class="pj-history"><summary>Previous inquiry versions ${icon('chevron-down')}</summary><div>${records.slice(1).map(r=>globalThis.CB_PAGES_HTML(`<a class="pj-history-link" href="${inquiryHref(r)}"><span>${e(r.submissionId)}</span><span>${e(date(r.savedAt))}</span></a>`)).join('')}</div></details>`):''}
    </section>
    <section class="pj-section pj-quotation" aria-labelledby="pj-quotation-title"><header class="pj-section-heading"><h2 id="pj-quotation-title">Quotations</h2><span class="pj-section-reference">${quotes.length?`${quotes.length} saved ${quotes.length===1?'version':'versions'}`:'No quotation yet'}</span></header>${q?globalThis.CB_PAGES_HTML(`<a class="pj-document-row" href="${quoteHref(q)}">${icon('file-text')}<div><strong>${e(q.title)}</strong><span>Revision ${String(q.revision).padStart(2,'0')} · ${e(date(q.availableAt))}</span><small>Demo document · Not a commercial offer</small></div>${icon('arrow-right')}</a>${quoteSourceNote}`):`<div class="pj-document-empty">${icon('file-text')}<div><h3>No quotation added yet.</h3><p>${state.hasDraft?'Finish your inquiry to prepare for the next conversation.':'Your inquiry is saved. Only saved quotation versions added to this project appear here.'}</p></div></div>`}${quotes.length>1?globalThis.CB_PAGES_HTML(`<details class="pj-history"><summary>Previous quotations ${icon('chevron-down')}</summary><div>${quotes.slice(1).map(item=>globalThis.CB_PAGES_HTML(`<a class="pj-history-link" href="${quoteHref(item)}"><span>${e(item.id)} · Revision ${String(item.revision).padStart(2,'0')}<small>Based on ${e(item.requestId)}</small></span><span>${e(date(item.availableAt))}</span></a>`)).join('')}</div></details>`):''}</section>
    ${callResponsePanel(project,quotes)}
    </div><aside class="pj-aside"><section class="pj-section" aria-labelledby="pj-contact-title"><p class="pj-kicker">${state.hasDraft?'DRAFT CONTACT':'INQUIRY CONTACT'}</p><h2 id="pj-contact-title">Contact details</h2><dl class="pj-contact-facts">${fact('Name',data.name)}${fact('Company',data.company)}${fact('Email',data.email)}${fact('Phone',data.phone)}</dl></section><section class="pj-section pj-open-questions" aria-labelledby="pj-questions-title"><p class="pj-kicker">${state.hasDraft?'DRAFT OPEN QUESTIONS':'FOR THE NEXT CONVERSATION'}</p><h2 id="pj-questions-title">Open questions <span>${openQuestions.length}</span></h2>${openQuestions.length?`<ul>${openQuestions.map(v=>`<li>${e(v)}</li>`).join('')}</ul>`:'<p>Confirm application fit and the next step with an engineer.</p>'}<p class="pj-muted">Unknown requirements can be discussed with an engineer.</p></section></aside></div>${latest?`<div class="site-wrap pj-conversion-wrap">${accountConversionCard(project, data)}</div>`:''}<div class="site-wrap pj-detail-footer">${localNote}</div>`);
}
const id = new URLSearchParams(location.search).get('project');
if (id) { const p = getProject(id); p ? detail(p) : empty('This project is not in this browser.', 'Projects are saved on the device and browser where you created them.'); }
else list();
initAccountConversion();
document.addEventListener('cb-account-preview-change', () => { const p = id && getProject(id); p ? detail(p) : list(); });
// Refresh when another tab updates the project or prepares its customer quotation.
window.addEventListener('storage', event => { if (event.key === CALL_CASE_KEY || /^(cb-projects-v1:|cb-quotes-v1:|cb-account-demo-v1:)/.test(event.key || '')) { const p = id && getProject(id); p ? detail(p) : list(); } });
