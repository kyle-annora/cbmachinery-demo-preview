export const VERSION = 1;
export const TECH_FIELDS = ['material', 'materialNotes', 'diameter', 'thickness', 'volume', 'tolerance', 'flatness', 'parallelism', 'finish'];
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const EXPLORER_URL = '/machines/robotic-double-disc/';
const APPLICATION_EXPLORER_URL = '/applications/ring-gear-grinding/';
const EXPLORER_FOCUS = Object.freeze({ machine: 'Whole machine', robot: 'Robotic handling', loading: 'Part loading', grinding: 'Grinding zone', controls: 'Operator controls', ring: 'Ring gear faces', process: 'Ring gear process', requirements: 'Application requirements', next: 'Engineering conversation' });
const WEBSITE_PAGES = Object.freeze({
  home: ['C&B homepage','/'], machines: ['Grinding machines','/machines/'], 'double-disc': ['Double-disc grinding','/machines/double-disc/'], 'clamp-bore': ['Clamp-bore face grinding','/machines/clamp-bore/'],
  rebuilds: ['Machine rebuilding','/rebuilds/'], services: ['Services & support','/services/'], applications: ['Grinding applications','/applications/'], 'auto-heavy-powertrain': ['Automotive & heavy powertrain','/applications/auto-heavy-powertrain/'],
  inventory: ['Machine inventory','/inventory/'], resources: ['Resources & insights','/resources/'], 'about-us': ['About C&B Machinery','/about-us/'], 'contact-us': ['Contact C&B Machinery','/contact-us/'], 'quote-preparation': ['Preparing a grinding inquiry','/resources/quote-preparation/'], 'double-disc-guide': ['Double-disc grinding guide','/resources/double-disc-grinding/']
});
const WEBSITE_INTERESTS={
  inventory:{key:'stock',labels:{"01103":"Published stock 01103","02156":"Published stock 02156","02158":"Published stock 02158","10161":"Published stock 10161","10200":"Published stock 10200","10201":"Published stock 10201","11045":"Published stock 11045","12006":"Published stock 12006","12007":"Published stock 12007","12008":"Published stock 12008","12052":"Published stock 12052","12120":"Published stock 12120","14141":"Published stock 14141","15108":"Published stock 15108","15108-15109":"Published stock 15108-15109","15179":"Published stock 15179","15226":"Published stock 15226","16068":"Published stock 16068","16069":"Published stock 16069","16085":"Published stock 16085","16163":"Published stock 16163","16181":"Published stock 16181","16222":"Published stock 16222","16223":"Published stock 16223","18013":"Published stock 18013","18253":"Published stock 18253","STO1004":"Published stock STO1004"}},
  services:{key:'service',labels:{'machine-service':'Machine service','spindle-rebuild':'Spindle rebuild',automation:'Automation','control-retrofits':'Control retrofits','hand-scraping':'Hand scraping','production-grinding':'Production grinding'}},
  applications:{key:'industry',labels:{aerospace:'Aerospace',bearings:'Bearings',compressor:'Compressor',magnetics:'Magnetics',other:'Other applications'}}
};
export function normalizeWebsiteContext(value) {
  const page = typeof value === 'string' ? value : value?.page;
  if(typeof page !== 'string'||!Object.hasOwn(WEBSITE_PAGES,page)) return null;
  const rule=WEBSITE_INTERESTS[page],interest=rule&&value?.[rule.key];
  return {page,...(typeof interest==='string'&&Object.hasOwn(rule.labels,interest)?{[rule.key]:interest}:{})};
}
export function websiteContextFromSearch(search) {
  const p=search instanceof URLSearchParams ? search : new URLSearchParams(search);
  return normalizeWebsiteContext({page:p.get('sitePage'),stock:p.get('stock'),service:p.get('service'),industry:p.get('industry')});
}
export function websiteDetails(value) {
  const context=normalizeWebsiteContext(value);
  if(!context) return null;
  const rule=WEBSITE_INTERESTS[context.page],interest=rule&&rule.labels[context[rule.key]];
  return {...context,label:WEBSITE_PAGES[context.page][0]+(interest?` · ${interest}`:''),href:WEBSITE_PAGES[context.page][1]};
}
export function applyWebsiteEntry(draft,value) {
  const context=normalizeWebsiteContext(value);
  if(!context) return false;
  const changed=draft.source!=='website' || JSON.stringify(normalizeWebsiteContext(draft.websiteContext))!==JSON.stringify(context) || Boolean(draft.explorationContext);
  draft.websiteContext=context; draft.source='website'; draft.sourceUrl=websiteDetails(context).href; draft.explorationContext=null;
  if(changed) draft.submissionId=null;
  return changed;
}
// Browsing context is metadata, never a machine recommendation or a technical answer.
export function normalizeExplorationContext(value) {
  if (!value || typeof value !== 'object' || value.equipment !== 'robotic-double-disc') return null;
  return { equipment: 'robotic-double-disc', focus: Object.hasOwn(EXPLORER_FOCUS, value.focus) ? value.focus : 'machine', ...(value.entry === 'application' ? { entry: 'application' } : {}) };
}
export function explorationContextFromSearch(search) {
  const params = search instanceof URLSearchParams ? search : new URLSearchParams(search);
  if (params.get('source') !== 'machine-explorer') return null;
  return normalizeExplorationContext({ equipment: params.get('equipment'), focus: params.get('focus'), entry: params.get('entry') });
}
export function explorationDetails(value) {
  const context = normalizeExplorationContext(value);
  return context ? { ...context, equipmentLabel: '30-inch double-disc system with robotic handling', focusLabel: EXPLORER_FOCUS[context.focus], href: (context.entry === 'application' ? APPLICATION_EXPLORER_URL : EXPLORER_URL) + '#' + context.focus } : null;
}
export function applyExplorationEntry(draft, value) {
  const context = normalizeExplorationContext(value);
  if (!context) return false;
  const previous = normalizeExplorationContext(draft.explorationContext);
  const changed = draft.source !== 'machine-explorer' || !previous || previous.equipment !== context.equipment || previous.focus !== context.focus || previous.entry !== context.entry;
  draft.explorationContext = context;
  draft.websiteContext = null;
  draft.source = 'machine-explorer';
  draft.sourceUrl = explorationDetails(context).href;
  if (changed) draft.submissionId = null;
  return changed;
}
export function newDraft(source = 'home') {
  return { version: VERSION, source, sourceUrl: source === 'ring-gear' ? '/applications/ring-gear-grinding/' : source === 'machine-explorer' ? EXPLORER_URL : '/', explorationContext: null, websiteContext: null, step: 0, part: source === 'ring-gear' ? 'Ring gear' : '', goal: '', description: '', material: 'Not sure yet', materialNotes: '', diameter: '', thickness: '', unit: 'mm', volume: '', volumeUnit: 'parts / hour', tolerance: '', flatness: '', parallelism: '', finish: '', finishUnit: 'Ra µm', stage: 'Not sure yet', timing: 'Not sure yet', name: '', email: '', company: '', phone: '', files: [], needsReview: false, submissionId: null };
}
export function hasRequirements(d) { return TECH_FIELDS.some(k => d[k] && d[k] !== 'Not sure yet') || d.files.length > 0; }
export function applyValue(d, key, value) {
  if (d[key] === value) return d;
  if ((key === 'part' || key === 'goal') && value !== d[key] && hasRequirements(d)) d.needsReview = true;
  d[key] = value; d.submissionId = null; return d;
}
export function validate(d, step) {
  const errors = {};
  if (step === 0 && !d.part && !d.goal && !d.description.trim()) errors.part = 'Choose a part or tell us a little about your application.';
  if (step === 1) {
    ['diameter', 'thickness', 'volume', 'tolerance', 'flatness', 'parallelism', 'finish'].forEach(k => {
      if (d[k] !== '' && (!Number.isFinite(Number(d[k])) || Number(d[k]) < 0 || (['diameter','thickness','volume'].includes(k) && Number(d[k]) === 0))) errors[k] = 'Enter a positive number, or leave this blank to discuss.';
    });
  }
  if (step === 2) {
    if (!d.name.trim()) errors.name = 'Please enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) errors.email = 'Enter a valid email address.';
    if (!d.company.trim()) errors.company = 'Please enter your company.';
  }
  return errors;
}
export function questions(d) {
  const q = [];
  if (!d.part || d.part === 'Not sure yet') q.push('Confirm the part and application.');
  if (!d.goal || d.goal === 'Discuss with an engineer') q.push('Discuss the grinding objective.');
  if (d.material === 'Not sure yet') q.push('Confirm material and heat-treatment condition.');
  if (!d.diameter || !d.thickness) q.push('Confirm part dimensions and geometry.');
  if (!d.volume) q.push('Discuss production volume and loading approach.');
  if (!d.tolerance || !d.flatness || !d.parallelism || !d.finish) q.push('Review the drawing and required surface specifications.');
  if (d.timing === 'Not sure yet') q.push('Discuss the project timeline.');
  if (d.needsReview) q.push('Reconfirm requirements after the application changed.');
  return q;
}
export function snapshot(d, id, now = new Date().toISOString()) {
  return JSON.parse(JSON.stringify({ ...d, explorationContext: normalizeExplorationContext(d.explorationContext), websiteContext: normalizeWebsiteContext(d.websiteContext), submissionId: id, savedAt: now, questions: questions(d), demo: true }));
}
