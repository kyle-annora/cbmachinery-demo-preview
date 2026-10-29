import {newDraft, snapshot} from '../../model.js';
import {ensureForDraft, recordInquiry, getProject, projectQuotations, shareQuotation, isSharedQuotation} from '../../projects/store.js';
import {createQuote, withSamplePricing, revisionSnapshot, validQuoteShape} from '../../quotes/model.js';

export const SETUP_KEY = 'cb-patrick-demo-v1:setup';
const P = 'cb-projects-v1:record:';
const R = 'cb-demo-v1:request:';
const Q = 'cb-quotes-v1:record:';
const clone = value => JSON.parse(JSON.stringify(value));
const validId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(value);
function read(key) {
  const raw = localStorage.getItem(key);
  if (raw === null) return null;
  try { return JSON.parse(raw); } catch { throw new Error('A saved demo record could not be read. Existing records have been left unchanged.'); }
}
const write = (key,value) => localStorage.setItem(key, JSON.stringify(value));
function validatePlan(plan) {
  if (!plan || plan.version !== 1 || plan.kind !== 'patrick-synthetic-demo' || !['planned','ready'].includes(plan.state)
    || !['draftProjectId','savedProjectId','requestId','quoteId'].every(key => validId(plan[key]))
    || new Set([plan.draftProjectId,plan.savedProjectId,plan.requestId,plan.quoteId]).size !== 4
    || !/^[A-F0-9]{8}$/.test(plan.fixtureToken || '')
    || plan.draftProjectId !== 'CB-P-PATRICK-DRAFT-'+plan.fixtureToken
    || plan.savedProjectId !== 'CB-P-PATRICK-'+plan.fixtureToken
    || plan.requestId !== 'CB-DEMO-PATRICK-'+plan.fixtureToken
    || plan.quoteId !== 'CB-Q-PATRICK-'+plan.fixtureToken
    || typeof plan.createdAt !== 'string' || !Number.isFinite(Date.parse(plan.createdAt))) {
    throw new Error('The saved demo setup is not valid. Existing projects have been left unchanged.');
  }
  return plan;
}
function result(plan) {
  const draftProject = getProject(plan.draftProjectId);
  const savedProject = getProject(plan.savedProjectId);
  const inquiry = read(R+plan.requestId);
  const bundle = read(Q+plan.quoteId);
  if (!draftProject || !savedProject || !savedProject.requestIds?.includes(plan.requestId)
      || inquiry?.submissionId !== plan.requestId || !validQuoteShape(bundle?.draft,plan.quoteId)
      || !projectQuotations(savedProject).some(quote => quote.id === plan.quoteId && quote.revision === 1)) {
    throw new Error('Some prepared demo records are no longer available. Your other projects are unchanged; open My projects to continue.');
  }
  return {state:'ready',draftProjectId:plan.draftProjectId,savedProjectId:plan.savedProjectId,requestId:plan.requestId,quoteId:plan.quoteId,
    draftAvailable:Boolean(draftProject.draft),createdAt:plan.createdAt};
}
export function getPatrickDemo() {
  const plan = read(SETUP_KEY);
  if (!plan) return null;
  validatePlan(plan);
  return plan.state === 'ready' ? result(plan) : {state:'planned'};
}
function allocatePlan() {
  for(let attempt=0;attempt<10;attempt++) {
    const token = crypto.randomUUID().slice(0,8).toUpperCase();
    const plan={version:1,kind:'patrick-synthetic-demo',state:'planned',fixtureToken:token,createdAt:new Date().toISOString(),
      draftProjectId:'CB-P-PATRICK-DRAFT-'+token,savedProjectId:'CB-P-PATRICK-'+token,
      requestId:'CB-DEMO-PATRICK-'+token,quoteId:'CB-Q-PATRICK-'+token};
    if ([P+plan.draftProjectId,P+plan.savedProjectId,R+plan.requestId,Q+plan.quoteId,'cb-quotes-v1:request:'+plan.requestId].every(key=>localStorage.getItem(key)===null)) return plan;
  }
  throw new Error('New sample references could not be prepared. Existing records have been left unchanged.');
}
function exampleDraft(projectId,fixtureToken) {
  return {...newDraft('ring-gear'),projectId,demoFixture:'patrick-'+fixtureToken,goal:'Grind two opposing faces',material:'Steel',materialNotes:'Heat-treatment condition to confirm',
    diameter:'180',thickness:'24',volume:'180',stage:'Defining requirements',timing:'3–6 months',
    name:'Alex Morgan',company:'Example Powertrain Co.',email:'alex@example.com',
    description:'Synthetic demonstration: finish-grind both faces of a steel ring gear and discuss robotic loading. Dimensions and volume are example customer requirements, not C&B machine performance claims.'};
}
export function preparePatrickDemo() {
  let plan=read(SETUP_KEY);
  if(plan) {
    validatePlan(plan);
    if(plan.state==='ready') return result(plan);
  } else {
    plan=allocatePlan();
    // Save the identities before any project. A failed later write can resume
    // the same setup without creating a second set of sample records.
    write(SETUP_KEY,plan);
  }
  const draftKey=P+plan.draftProjectId;
  if(localStorage.getItem(draftKey)===null) ensureForDraft(exampleDraft(plan.draftProjectId,plan.fixtureToken));
  const existingDraft=getProject(plan.draftProjectId);
  if(existingDraft?.id!==plan.draftProjectId || !Array.isArray(existingDraft.requestIds) || existingDraft.draft?.demoFixture !== 'patrick-'+plan.fixtureToken) throw new Error('The sample draft reference is in use. No existing project was replaced.');

  const requestKey=R+plan.requestId;
  if(localStorage.getItem(requestKey)===null) write(requestKey,snapshot({...exampleDraft(plan.savedProjectId,plan.fixtureToken),step:1},plan.requestId,plan.createdAt));
  const inquiry=read(requestKey);
  if(inquiry?.submissionId!==plan.requestId || inquiry.projectId!==plan.savedProjectId || !inquiry.demo || inquiry.demoFixture !== 'patrick-'+plan.fixtureToken) throw new Error('The sample inquiry reference is in use. No existing inquiry was replaced.');
  if(localStorage.getItem(P+plan.savedProjectId)===null) recordInquiry(inquiry);
  const savedProject=getProject(plan.savedProjectId);
  if(!savedProject?.requestIds?.includes(plan.requestId)) throw new Error('The sample project reference is in use. No existing project was replaced.');

  const quoteKey=Q+plan.quoteId;
  if(localStorage.getItem(quoteKey)===null) {
    const draft=withSamplePricing(createQuote(inquiry,plan.quoteId,plan.createdAt));
    draft.reference='PATRICK DEMO · SYNTHETIC EXAMPLE';
    const revision=revisionSnapshot(draft,1,plan.createdAt);
    // Matches the quotation editor's persistence contract. Data is derived with
    // its public model functions; sharing uses the normal project API below.
    write(quoteKey,{version:1,visibilityVersion:1,draft:{...draft,revision:1},revisions:[revision],customerRevisions:[],sharedAt:{}});
  }
  const bundle=read(quoteKey);
  if(!validQuoteShape(bundle?.draft,plan.quoteId) || bundle.draft.requestId!==plan.requestId
      || !bundle.revisions?.some(revision=>revision.revision===1 && revision.requestId===plan.requestId)) {
    throw new Error('The sample quotation reference is in use. No existing quotation was replaced.');
  }
  const mapKey='cb-quotes-v1:request:'+plan.requestId;
  if(localStorage.getItem(mapKey)===null) write(mapKey,plan.quoteId);
  if(!isSharedQuotation(plan.quoteId,1)) shareQuotation(plan.quoteId,1);
  const ready={...plan,state:'ready'};
  const prepared=result(ready);
  write(SETUP_KEY,ready);
  return clone(prepared);
}
