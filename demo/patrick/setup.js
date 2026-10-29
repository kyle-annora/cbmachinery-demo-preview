import {getPatrickDemo,preparePatrickDemo} from './seed.js';
const actions=document.querySelector('#patrick-actions');
const status=document.querySelector('#patrick-status');
const error=document.querySelector('#patrick-error');
const arrow=globalThis.CB_PAGES_HTML('<img src="/cbmachinery-demo-preview/review-kit/icons/arrow-right.svg" alt="">');
function ready(data) {
  actions.innerHTML=globalThis.CB_PAGES_HTML(`<a class="btn btn-primary patrick-primary" href="/cbmachinery-demo-preview/overview/">Open customer call ${arrow}</a><a class="btn btn-secondary" href="/cbmachinery-demo-preview/projects/?project=${encodeURIComponent(data.savedProjectId)}">Open sample project</a><a class="btn btn-secondary" href="${data.draftAvailable?'/request/?project=':'/projects/?project='}${encodeURIComponent(data.draftProjectId)}">${data.draftAvailable?'Continue sample inquiry':'Open second sample project'}</a>`);
  status.textContent='Your examples are ready in this browser. The sample quotation is already available in the customer project.';
  document.querySelector('#setup-heading').textContent='Your demo projects are ready.';
}
function failure(message) { error.hidden=false;error.textContent=message; }
function prepare() {
  const button=document.querySelector('#patrick-prepare');
  button.disabled=true;button.textContent='Preparing examples…';error.hidden=true;
  try {ready(preparePatrickDemo());document.querySelector('#patrick-actions a').focus({preventScroll:true});}
  catch(cause) {
    button.disabled=false;button.innerHTML='Retry demo setup '+arrow;
    failure('The demo setup could not finish. '+(cause?.message || 'Browser storage is unavailable.')+' Retry to continue the same examples. Existing projects have not been replaced.');
  }
}
document.querySelector('#patrick-prepare').addEventListener('click',prepare);
try {
  const current=getPatrickDemo();
  if(current?.state==='ready') ready(current);
  else if(current?.state==='planned') {status.textContent='A previous setup did not finish. Retry to continue the same examples.';document.querySelector('#patrick-prepare').innerHTML='Finish demo setup '+arrow;}
} catch(cause) {failure(cause?.message || 'Browser storage is unavailable. Your existing projects have not been changed.');}
