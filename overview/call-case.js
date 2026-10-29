import {newDraft, snapshot, validate} from '../model.js';
import {ensureForDraft, recordInquiry, getProject, shareQuotation, isSharedQuotation} from '../projects/store.js';
import {createQuote, withSamplePricing, revisionSnapshot, validQuoteShape} from '../quotes/model.js';

// This case is an explicit, browser-local presentation. Nothing is transmitted.
export const CALL_CASE_KEY = 'cb-customer-call-v1:case';
const P = 'cb-projects-v1:record:';
const R = 'cb-demo-v1:request:';
const Q = 'cb-quotes-v1:record:';
const M = 'cb-quotes-v1:request:';
const clone = value => JSON.parse(JSON.stringify(value));
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const date = () => new Date().toISOString();
const validDate = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const fixture = plan => 'customer-call-'+plan.token;
const fail = message => { throw new Error(message); };
function read(key) {
  const raw = localStorage.getItem(key);
  if (raw === null) return null;
  try { return JSON.parse(raw); }
  catch { return fail('A saved customer-call record could not be read. Existing data has been left unchanged.'); }
}
const write = (key,value) => localStorage.setItem(key,JSON.stringify(value));
function validatePlan(plan) {
  if (!plan || plan.version !== 1 || plan.kind !== 'synthetic-customer-call' || !/^[A-F0-9]{8}$/.test(plan.token || '')
    || plan.projectId !== 'CB-P-CALL-'+plan.token || plan.requestId !== 'CB-DEMO-CALL-'+plan.token
    || plan.quoteId !== 'CB-Q-CALL-'+plan.token || !validDate(plan.createdAt)
    || typeof plan.ready !== 'boolean' || typeof plan.confirmed !== 'boolean' || typeof plan.quoted !== 'boolean'
    || (plan.quoted && !plan.confirmed) || (plan.confirmed && !plan.ready)) {
    fail('The saved customer-call references are not valid. Existing projects have been left unchanged.');
  }
  return plan;
}
function requirePlan() {
  const plan = read(CALL_CASE_KEY);
  if (!plan) fail('Prepare the example brief first.');
  return validatePlan(plan);
}
function validateBrief(brief,plan) {
  if (!brief || brief.projectId !== plan.projectId || brief.demoFixture !== fixture(plan)
    || brief.part !== 'Ring gear' || brief.name !== 'Alex Morgan' || brief.company !== 'Example Powertrain Co.'
    || brief.email !== 'alex@example.com' || brief.unit !== 'mm' || brief.volumeUnit !== 'parts / hour'
    || !Array.isArray(brief.files) || brief.files.length !== 0
    || !['material','description','diameter','thickness','volume'].every(key => typeof brief[key] === 'string')) {
    fail('The customer-call brief does not match this synthetic case. No existing project was replaced.');
  }
  const errors = {...validate(brief,0),...validate(brief,1),...validate(brief,2)};
  if (Object.keys(errors).length) fail(Object.values(errors)[0]);
}
function inspect(plan,allowPending=false) {
  const project = getProject(plan.projectId);
  const inquiry = read(R+plan.requestId);
  const bundle = read(Q+plan.quoteId);
  const mappedQuote = read(M+plan.requestId);
  if (!project) {
    if (plan.ready || localStorage.getItem(P+plan.projectId) !== null || inquiry || bundle || mappedQuote) {
      fail('The customer-call project is unavailable or its reference is in use. Existing data has been left unchanged.');
    }
  } else {
    if (project.id !== plan.projectId || !Array.isArray(project.requestIds)
      || project.requestIds.some(id => id !== plan.requestId) || project.requestIds.length > 1) {
      fail('The customer-call project reference is in use. No existing project was replaced.');
    }
    if (project.draft) validateBrief(project.draft,plan);
    if (!project.draft && !inquiry) fail('The saved customer-call brief is no longer available.');
  }
  if (inquiry) {
    validateBrief(inquiry,plan);
    if (inquiry.submissionId !== plan.requestId || inquiry.demo !== true || !validDate(inquiry.savedAt)) {
      fail('The customer-call inquiry reference is in use. No existing inquiry was replaced.');
    }
    if (!allowPending && (!project.requestIds.includes(plan.requestId) || project.draft)) {
      fail('Finish confirming this inquiry to complete its saved project.');
    }
  } else if (plan.confirmed || project?.requestIds.length) fail('The confirmed inquiry is no longer available.');
  if (mappedQuote !== null && mappedQuote !== plan.quoteId) fail('This inquiry already points to a different quotation. No quotation was replaced.');
  let quotation = null;
  if (bundle) {
    const validArrays = Array.isArray(bundle.revisions) && bundle.revisions.every(item=>item && typeof item === 'object')
      && Array.isArray(bundle.customerRevisions) && bundle.customerRevisions.every(item=>Number.isInteger(item) && item > 0);
    const revision = validArrays ? bundle.revisions.find(item => item.revision === 1) : null;
    if (!validArrays || !inquiry || !validQuoteShape(bundle.draft,plan.quoteId) || bundle.draft.requestId !== plan.requestId
      || !validQuoteShape(revision,plan.quoteId) || revision.requestId !== plan.requestId
      || revision.demo !== true || revision.samplePricing !== true || !same(revision.sourceSnapshot,inquiry)
      || !same(bundle.draft.sourceSnapshot,inquiry)) {
      fail('The customer-call quotation does not match the confirmed inquiry. No quotation was replaced.');
    }
    if (isSharedQuotation(plan.quoteId,1)) quotation = revision;
    else if (!allowPending) fail('Finish preparing this example quotation before showing it to the customer.');
    if (!allowPending && mappedQuote !== plan.quoteId) fail('Finish preparing the example quotation reference.');
  } else if (plan.quoted || mappedQuote) fail('The prepared quotation is no longer available.');
  const response = plan.response || null;
  if (response && (!quotation || !['discuss','revision'].includes(response.kind) || typeof response.note !== 'string'
    || response.note.length > 2000 || response.projectId !== plan.projectId || response.requestId !== plan.requestId
    || response.quoteId !== plan.quoteId || response.revision !== 1 || !validDate(response.savedAt)
    || response.localOnly !== true || response.demo !== true || response.status !== 'request-saved')) {
    fail('The saved customer response does not match this example quotation.');
  }
  return {project,inquiry,quotation,response,bundle};
}
function result(plan) {
  const {project,inquiry,quotation,response} = inspect(plan);
  if (!project) fail('Finish preparing the example brief.');
  return clone({phase:response?'response':quotation?'quotation':inquiry?'inquiry':'brief',
    projectId:plan.projectId,requestId:plan.requestId,quoteId:plan.quoteId,
    brief:inquiry || project.draft,inquiry,quotation,response});
}
export function getCallCase() {
  const plan = read(CALL_CASE_KEY);
  return plan ? result(validatePlan(plan)) : null;
}
function allocatePlan() {
  for (let attempt=0;attempt<10;attempt++) {
    const token = crypto.randomUUID().slice(0,8).toUpperCase();
    const plan = {version:1,kind:'synthetic-customer-call',token,createdAt:date(),ready:false,confirmed:false,quoted:false,
      projectId:'CB-P-CALL-'+token,requestId:'CB-DEMO-CALL-'+token,quoteId:'CB-Q-CALL-'+token,response:null};
    if ([P+plan.projectId,R+plan.requestId,Q+plan.quoteId,M+plan.requestId].every(key=>localStorage.getItem(key)===null)) return plan;
  }
  return fail('New customer-call references could not be reserved. Existing projects are unchanged.');
}
function exampleBrief(plan) {
  return {...newDraft('ring-gear'),projectId:plan.projectId,demoFixture:fixture(plan),goal:'Grind two opposing faces',
    material:'Steel',materialNotes:'Heat-treatment condition to confirm',diameter:'180',thickness:'24',volume:'180',
    stage:'Defining requirements',timing:'3–6 months',name:'Alex Morgan',company:'Example Powertrain Co.',email:'alex@example.com',
    description:'Synthetic demonstration: finish-grind both faces of a steel ring gear and discuss robotic loading. Dimensions and volume are example customer requirements, not C&B machine performance claims.'};
}
export function prepareCallCase() {
  let plan = read(CALL_CASE_KEY);
  if (plan) {
    validatePlan(plan);
    if (plan.ready) {
      const pending = inspect(plan,true);
      // Resume only an action that already wrote this case's own record.
      // Merely returning to the presentation never starts a future stage.
      if (!plan.confirmed && pending.inquiry) return confirmCallInquiry();
      if (!plan.quoted && pending.bundle) return prepareCallQuote();
      return result(plan);
    }
  } else {
    plan = allocatePlan();
    // Reserve identities first, so a retry never creates another project.
    write(CALL_CASE_KEY,plan);
  }
  const {project} = inspect(plan,true);
  if (!project) ensureForDraft(exampleBrief(plan));
  write(CALL_CASE_KEY,{...plan,ready:true});
  return getCallCase();
}
export function saveCallBrief(values) {
  const plan = requirePlan();
  const state = result(plan);
  if (state.phase !== 'brief') fail('This inquiry is already confirmed. Its saved brief cannot be changed.');
  const fields = {diameter:40,thickness:40,volume:40,material:80,description:2000};
  if (!values || typeof values !== 'object' || Array.isArray(values) || Object.keys(values).some(key=>!Object.hasOwn(fields,key))) {
    fail('Update only the part dimensions, production target, material and description.');
  }
  const brief = clone(state.brief);
  for (const [key,value] of Object.entries(values)) {
    if (!['string','number'].includes(typeof value) || (typeof value === 'number' && !Number.isFinite(value))) fail('Enter a text or numeric value for '+key+'.');
    const next = String(value).trim();
    if (next.length > fields[key]) fail('The '+key+' value is too long.');
    brief[key] = next;
  }
  validateBrief(brief,plan);
  if (!same(brief,state.brief)) ensureForDraft(brief);
  return getCallCase();
}
export function confirmCallInquiry() {
  const plan = requirePlan();
  if (!plan.ready) fail('Finish preparing the example brief first.');
  const existing = inspect(plan,true);
  if (plan.confirmed) return result(plan);
  if (!existing.inquiry) {
    validateBrief(existing.project.draft,plan);
    write(R+plan.requestId,snapshot({...existing.project.draft,step:1},plan.requestId));
  }
  const inquiry = read(R+plan.requestId);
  // Use the normal immutable inquiry and project contracts. Never replace the active draft.
  if (!existing.project.requestIds.includes(plan.requestId) || existing.project.draft) recordInquiry(inquiry);
  write(CALL_CASE_KEY,{...plan,confirmed:true});
  return getCallCase();
}
export function prepareCallQuote() {
  const plan = requirePlan();
  if (!plan.confirmed) fail('Confirm the inquiry before preparing the example quotation.');
  const existing = inspect(plan,true);
  if (plan.quoted) return result(plan);
  if (!existing.bundle) {
    const draft = withSamplePricing(createQuote(existing.inquiry,plan.quoteId));
    draft.reference = 'CUSTOMER CALL · SYNTHETIC EXAMPLE';
    draft.notes = 'Browser-local demonstration. Illustrative pricing and terms only; not a C&B commercial offer.';
    const revision = revisionSnapshot(draft,1);
    write(Q+plan.quoteId,{version:1,visibilityVersion:1,draft:{...draft,revision:1},revisions:[revision],customerRevisions:[],sharedAt:{}});
  }
  if (read(M+plan.requestId) === null) write(M+plan.requestId,plan.quoteId);
  if (!isSharedQuotation(plan.quoteId,1)) shareQuotation(plan.quoteId,1);
  write(CALL_CASE_KEY,{...plan,quoted:true});
  return getCallCase();
}
export function recordCallResponse(kind,note='') {
  const plan = requirePlan();
  const state = result(plan);
  if (!plan.quoted || !state.quotation) fail('Prepare the example quotation before recording a customer response.');
  if (!['discuss','revision'].includes(kind)) fail('Choose a discussion or revision request.');
  if (typeof note !== 'string' || note.trim().length > 2000) fail('Use a response note of up to 2,000 characters.');
  if (state.response) {
    if (state.response.kind === kind && state.response.note === note.trim()) return state;
    fail('A response is already saved for this example quotation.');
  }
  const response = {kind,note:note.trim(),savedAt:date(),projectId:plan.projectId,requestId:plan.requestId,
    quoteId:plan.quoteId,revision:1,demo:true,localOnly:true,status:'request-saved'};
  write(CALL_CASE_KEY,{...plan,response});
  return getCallCase();
}
