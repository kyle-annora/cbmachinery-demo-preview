import {mountQuoteResponse} from './response-panel.js?v=response-20261029-1';
import {submitQuotationResponse,getDemoResponse} from '../integrations/annora-responses.js?v=response-20261029-1';
import {getProjectForRequest, projectHref, shareQuotation, isSharedQuotation, migrateLegacyProjects, recordInquiry} from '../projects/store.js';
import {QUOTE_KEY,validId,validQuoteShape,createQuote,exampleInquiry,withSamplePricing,validateQuote,revisionSnapshot,escapeHTML as e,totals} from './model.js';
import {documentHTML} from './document.js';
const app=document.querySelector('#quote-main');
const params=new URLSearchParams(location.search);
if(params.get('from')==='project') {
  const header=document.querySelector('.q-app-header');
  header.querySelector('span').innerHTML='YOUR QUOTATION <small>Local demo</small>';
  const link=header.querySelector('a:last-child');link.href=globalThis.CB_PAGES_URL('/projects/');link.textContent='My projects';
}
try { migrateLegacyProjects(); } catch {}
const icon=name=>globalThis.CB_PAGES_HTML(`<img src="/cbmachinery-demo-preview/review-kit/icons/${name}.svg" alt="" aria-hidden="true">`);
let responsePanel=null;
let bundle=null,draft=null,errorText='',statusText='',storageFailed=false,errors={},busy=false;
const read=(key,fallback=null)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
const write=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
const key=id=>QUOTE_KEY+':record:'+id;
const requestHref=()=>draft?.requestId&&draft.requestId!=='EXAMPLE-INQUIRY'?'/demo/requests/'+encodeURIComponent(draft.requestId)+'/':'/request/';
function storeDraft(){
  draft.updatedAt=new Date().toISOString();
  try{const saved=read(key(draft.id));bundle={...saved,version:1,visibilityVersion:1,draft:structuredClone(draft),revisions:Array.isArray(saved?.revisions)?saved.revisions:(bundle?.revisions||[])};write(key(draft.id),bundle);storageFailed=false;}catch{storageFailed=true;}
  updateStatus();
}
function updateStatus(){const node=document.querySelector('#q-draft-status');if(node)node.textContent=storageFailed?'Not saved — keep this tab open':statusText||'Draft saved in this browser';}
function loadFromRequest(request){
  if(request.submissionId!=='EXAMPLE-INQUIRY' && !getProjectForRequest(request.submissionId)){try{recordInquiry(request);}catch{}}
  const oldId=read(QUOTE_KEY+':request:'+request.submissionId);
  const existing=validId(oldId)?read(key(oldId)):null;
  if(validQuoteShape(existing?.draft)&&Array.isArray(existing.revisions)){bundle=existing;draft=existing.draft;}
  else{
    const id='CB-Q-DEMO-'+crypto.randomUUID().slice(0,8).toUpperCase();
    draft=createQuote(request,id);bundle={version:1,draft,revisions:[]};storeDraft();
    try{write(QUOTE_KEY+':request:'+request.submissionId,id);}catch{storageFailed=true;}
  }
  globalThis.CB_PAGES_REPLACE_STATE(null,'','/quotes/?quote='+encodeURIComponent(draft.id));renderEditor();
}
function empty(message='Open a saved inquiry to prepare a quotation around the customer’s requirements.'){
  if(params.get('from')==='project') {
    app.innerHTML=globalThis.CB_PAGES_HTML(`<section class="q-empty"><p class="q-overline">MY PROJECTS</p><h1>This quotation is not available here.</h1><p>Return to your project to view the customer quotations saved in this browser.</p><a class="q-button" href="/cbmachinery-demo-preview/projects/">Return to My projects</a></section>`);
    return;
  }
  app.innerHTML=globalThis.CB_PAGES_HTML(`<section class="q-empty"><p class="q-overline">FROM INQUIRY TO QUOTATION</p><h1>Make the next step clear.</h1><p>${e(message)}</p><div class="q-empty-actions"><a class="q-button q-primary" href="/cbmachinery-demo-preview/request/">Start an inquiry ${icon('arrow-right')}</a><button class="q-button" id="q-example">Load example inquiry</button></div><span class="q-hint">Example data is synthetic. Documents are saved only in this browser.</span></section>`);
  document.querySelector('#q-example').addEventListener('click',()=>loadFromRequest(exampleInquiry()));
}
function field(name,label,value,{type='text',textarea=false,hint='',required=false}={}){
 const error=errors[name];return `<div class="q-field"><label for="q-${name}">${label}${required?' <span aria-hidden="true">*</span>':''}</label>${textarea?`<textarea id="q-${name}" data-field="${name}" rows="3" ${error?'aria-invalid="true"':''}>${e(value)}</textarea>`:`<input id="q-${name}" data-field="${name}" type="${type}" value="${e(value)}" ${error?'aria-invalid="true"':''}>`}${hint?`<small>${hint}</small>`:''}${error?`<span class="q-field-error">${e(error)}</span>`:''}</div>`;
}
function itemRow(item,index){return `<fieldset class="q-item"><legend>Scope item ${String(index+1).padStart(2,'0')}</legend><div class="q-item-heading"><label for="q-description-${index}">Description</label><button type="button" class="q-icon-button" data-remove="${index}" aria-label="Remove item ${index+1}" ${draft.items.length===1?'disabled':''}>${icon('x')}</button></div><input id="q-description-${index}" data-item="${index}" data-key="description" value="${e(item.description)}" aria-invalid="${Boolean(errors['description-'+index])}"><label class="q-sr-only" for="q-detail-${index}">Item ${index+1} scope detail</label><textarea id="q-detail-${index}" data-item="${index}" data-key="detail" rows="2">${e(item.detail)}</textarea><div class="q-item-numbers"><div><label for="q-quantity-${index}">Quantity</label><input id="q-quantity-${index}" data-item="${index}" data-key="quantity" inputmode="decimal" value="${e(item.quantity)}" aria-invalid="${Boolean(errors['quantity-'+index])}"></div><div><label for="q-unit-${index}">Unit</label><input id="q-unit-${index}" data-item="${index}" data-key="unit" value="${e(item.unit)}"></div><div><label for="q-unitPrice-${index}">Unit price · USD</label><input id="q-unitPrice-${index}" data-item="${index}" data-key="unitPrice" inputmode="decimal" placeholder="To confirm" value="${e(item.unitPrice)}" aria-invalid="${Boolean(errors['unitPrice-'+index])}"></div></div>${['description','quantity','unitPrice'].filter(k=>errors[k+'-'+index]).map(k=>`<p class="q-field-error">${e(errors[k+'-'+index])}</p>`).join('')}</fieldset>`;}
function renderEditor(){
 document.title='Quotation studio · '+draft.id;
 const latest=bundle.revisions?.at(-1);
 app.innerHTML=globalThis.CB_PAGES_HTML(`<section class="q-workspace-head"><div><p class="q-overline">C&B QUOTATION STUDIO</p><h1>Prepare quotation</h1><p>Define the scope, review the document, then save a customer preview.</p></div><div class="q-workspace-context"><span>FOR</span><strong>${e(draft.customer.company||'Customer company')}</strong><span>${e(draft.requestId||'Standalone demo')}</span><small>Local demo · No quotation is sent</small></div></section>
 <div class="q-action-bar"><div class="q-action-origin"><a class="q-back" href="${requestHref()}">${icon('arrow-right')} ${draft.requestId==='EXAMPLE-INQUIRY'?'Back to inquiry guide':'Back to inquiry'}</a><span id="q-draft-status" role="status"></span></div><div class="q-actions"><button class="q-button q-primary" id="q-save">Save & preview ${icon('arrow-right')}</button></div></div>
 ${errorText?`<div class="q-alert" role="alert">${e(errorText)}</div>`:''}
 <div class="q-workspace"><form class="q-editor" id="q-editor" novalidate>
 <section class="q-edit-section"><p class="q-overline">01 / DOCUMENT DETAILS</p><h2>The project and the customer.</h2>${field('title','Project title',draft.title,{required:true})}<div class="q-field-pair">${field('issueDate','Document date',draft.issueDate,{type:'date'})}${field('reference','Customer reference',draft.reference)}</div><div class="q-field-pair">${field('company','Company',draft.customer.company,{required:true})}${field('name','Contact',draft.customer.name)}</div>${field('email','Email',draft.customer.email,{type:'email'})}${field('address','Customer address',draft.customer.address,{textarea:true})}</section>
 <section class="q-edit-section"><p class="q-overline">02 / SCOPE & PRICING</p><div class="q-editor-heading"><h2>Make each item clear.</h2><button type="button" class="q-button q-sample-action" id="q-sample">Load sample pricing</button></div><p class="q-help">Leave a price blank when it is not confirmed. The document keeps unpriced scope visible.</p>${draft.samplePricing?'<p class="q-sample-note">Synthetic pricing and terms loaded for layout review.</p>':''}<div id="q-items">${draft.items.map(itemRow).join('')}</div><button type="button" class="q-button q-add" id="q-add" ${draft.items.length>=30?'disabled':''}>Add scope item</button></section>
 <details class="q-edit-section q-details" open><summary><span><span class="q-overline">03 / COMMERCIAL DETAILS</span><strong>Define the conditions.</strong></span>${icon('chevron-down')}</summary>${field('leadTime','Lead time',draft.leadTime,{textarea:true})}${field('payment','Payment',draft.payment,{textarea:true})}${field('validity','Quotation validity',draft.validity,{textarea:true})}${field('shipping','Shipping & freight',draft.shipping,{textarea:true})}</details>
 <details class="q-edit-section q-details"><summary><span><span class="q-overline">04 / APPLICATION & SCOPE</span><strong>Keep the context with the quote.</strong></span>${icon('chevron-down')}</summary>${field('scope','Included scope',draft.scope,{textarea:true})}${field('exclusions','Exclusions & responsibilities',draft.exclusions,{textarea:true})}${field('notes','Project notes',draft.notes,{textarea:true})}<p class="q-help">The original inquiry stays unchanged. Customer-provided requirements appear on page 2.</p></details>
 <p class="q-local-note">This is an editable quotation demonstration. No prices or commercial terms are approved by C&B.</p>
 ${latest?globalThis.CB_PAGES_HTML(`<details class="q-saved-versions"><summary>Saved versions ${icon('chevron-down')}</summary><p>Each saved version stays unchanged as you edit this draft.</p><ul>${[...bundle.revisions].reverse().map(revision=>globalThis.CB_PAGES_HTML(`<li><a class="q-revision-link" href="/cbmachinery-demo-preview/quotes/?quote=${encodeURIComponent(draft.id)}&revision=${revision.revision}&view=customer">View revision ${String(revision.revision).padStart(2,'0')}</a></li>`)).join('')}</ul></details>`):''}
 </form><section class="q-preview" id="quotation-preview" aria-label="Live quotation preview"><div class="q-preview-caption"><span>DOCUMENT PREVIEW</span><span>US Letter · 2 sections</span></div><div id="q-document-preview">${documentHTML(draft,{live:true})}</div></section></div>`);
 updateStatus();
 document.querySelector('#q-editor').addEventListener('submit',ev=>{ev.preventDefault();saveRevision();});
 document.querySelector('#q-editor').addEventListener('input',ev=>{
  const el=ev.target;
  if(el.dataset.field){const name=el.dataset.field;if(['name','company','email','address'].includes(name))draft.customer[name]=el.value;else draft[name]=el.value;delete errors[name];}
  else if(el.dataset.item!==undefined){const index=Number(el.dataset.item);if(draft.items[index])draft.items[index][el.dataset.key]=el.value;delete errors[el.dataset.key+'-'+index];}
  else return;
  statusText='';storeDraft();updatePreview();
 });
 document.querySelector('#q-save').addEventListener('click',saveRevision);
 document.querySelector('#q-add').addEventListener('click',()=>{draft.items.push({id:'item-'+crypto.randomUUID().slice(0,8),description:'',detail:'',quantity:'1',unit:'lot',unitPrice:''});storeDraft();renderEditor();document.querySelector('#q-description-'+(draft.items.length-1))?.focus();});
 document.querySelectorAll('[data-remove]').forEach(button=>button.addEventListener('click',()=>{draft.items.splice(Number(button.dataset.remove),1);storeDraft();renderEditor();document.querySelector('#q-add')?.focus();}));
 document.querySelector('#q-sample').addEventListener('click',()=>{draft=withSamplePricing(draft);storeDraft();statusText='Sample pricing loaded — synthetic figures only';renderEditor();});
}
function updatePreview(){document.querySelector('#q-document-preview').innerHTML=documentHTML(draft,{live:true});}
function saveRevision(){
 if(busy)return;
 errors=validateQuote(draft);
 if(Object.keys(errors).length){errorText='Check the marked fields before saving this document.';renderEditor();document.querySelector('[aria-invalid="true"]')?.focus();return;}
 busy=true;errorText='';
 try{
  const stored=read(key(draft.id));const revisions=Array.isArray(stored?.revisions)?stored.revisions:(bundle.revisions||[]);
  const n=Math.max(0,...revisions.map(r=>Number(r.revision)||0))+1;
  const saved=revisionSnapshot(draft,n);
  const next={...stored,version:1,visibilityVersion:1,draft:{...structuredClone(draft),revision:n},revisions:[...revisions,saved]};
  write(key(draft.id),next);bundle=next;
  globalThis.CB_PAGES_ASSIGN('/quotes/?quote='+encodeURIComponent(draft.id)+'&revision='+n+'&view=customer');
 }catch(error){busy=false;storageFailed=true;errorText='The quotation could not be saved in this browser. Your edits are still here. Check browser storage and try again.';renderEditor();}
}
function renderCustomer(saved){
 responsePanel?.destroy(); responsePanel=null;
 const customerMode=params.get('from')==='project';
 const project=getProjectForRequest(saved.requestId);
 const shared=isSharedQuotation(saved.id,saved.revision);
 if(customerMode && (!project || !shared)){
  app.innerHTML=globalThis.CB_PAGES_HTML(`<section class="q-empty"><p class="q-overline">MY PROJECTS</p><h1>This quotation is not available.</h1><p>Only customer versions added to your project appear here.</p><a class="q-button" href="/cbmachinery-demo-preview/projects/">Return to My projects</a></section>`);return;
 }
 document.title=`${saved.title} · Quotation ${saved.id} · Rev ${saved.revision}`;
 const sourceHref=saved.requestId&&saved.requestId!=='EXAMPLE-INQUIRY'?'/inquiry-document/?request='+encodeURIComponent(saved.requestId):'/projects/';
 if(customerMode){const header=document.querySelector('.q-app-header');header.querySelector('span').innerHTML='YOUR QUOTATION <small>Local demo</small>';const link=header.querySelector('a:last-child');link.href=globalThis.CB_PAGES_URL('/projects/');link.textContent='My projects';}
 const back=customerMode?projectHref(project.id):'/quotes/?quote='+encodeURIComponent(saved.id);
 const publish=project?(shared?globalThis.CB_PAGES_HTML(`<a class="q-button" href="${projectHref(project.id)}">View customer project ${icon('arrow-right')}</a>`):`<button class="q-button q-primary" id="q-share">Add to customer project ${icon('arrow-right')}</button>`):'';
 app.innerHTML=globalThis.CB_PAGES_HTML(`<section class="q-customer-head"><div><p class="q-overline">${customerMode?'YOUR QUOTATION':'C&B DOCUMENT REVIEW'}</p><h1>${e(saved.customer.company)}</h1><p>Revision ${String(saved.revision).padStart(2,'0')} · ${customerMode?'Demo document · Not a commercial offer':shared?'Available in the customer project · Local demo':'Saved for internal review · Not yet in the customer project'}</p></div><span class="q-saved-reference">${e(saved.id)}</span></section><section class="q-customer-toolbar" aria-label="Quotation actions"><a class="q-back${customerMode?'':' q-button'}" href="${back}">${icon('arrow-right')} ${customerMode?'Back to project':'Edit quotation'}</a><div class="q-actions"><button class="q-button" id="q-print">${icon('file-text')} Print / save PDF</button>${customerMode?'':publish}</div></section><p class="q-share-status" id="q-share-status" role="status"></p><div class="q-customer-stage">${documentHTML(saved)}</div>${customerMode?'<div id="quotation-response" class="q-response-stage"></div>':''}<div class="q-customer-bottom"><span>This saved revision stays unchanged when the working draft is edited.</span><a class="q-revision-link" href="${sourceHref}">${saved.requestId&&saved.requestId!=='EXAMPLE-INQUIRY'?'View source inquiry':'My projects'}</a></div>`);
 if(customerMode) {
  const context={projectId:project.id,requestId:saved.requestId,quoteId:saved.id,revision:saved.revision,demo:true};
  responsePanel=mountQuoteResponse(document.querySelector('#quotation-response'),{context,initialNote:'Please review the drawing, surface requirements and proposed loading scope.',submit:submitQuotationResponse,receipt:getDemoResponse(context),onReceipt:()=>document.dispatchEvent(new CustomEvent('cb-quotation-response-change'))});
 }
 document.querySelector('#q-print').addEventListener('click',()=>window.print());
 document.querySelector('#q-share')?.addEventListener('click',()=>{
  try{shareQuotation(saved.id,saved.revision);renderCustomer(saved);document.querySelector('#q-share-status').textContent='Quotation added to the customer project in this browser. No email has been sent.';}
  catch(error){document.querySelector('#q-share-status').textContent=error.message || 'The quotation could not be added. Please try again.';}
 });
}

const id=params.get('quote'), requestId=params.get('request');
if(id&&validId(id)){
 const saved=read(key(id));
 if(validQuoteShape(saved?.draft,id)&&Array.isArray(saved.revisions)){
  bundle=saved;draft=saved.draft;
  if(params.get('view')==='customer'){
   const n=params.has('revision')?Number(params.get('revision')):saved.revisions.at(-1)?.revision;
   const revision=saved.revisions.find(r=>r.revision===n);
   validQuoteShape(revision,id)?renderCustomer(revision):empty('This saved quotation revision is not available in this browser. Open a local inquiry or load the example to review the document layout.');
  }else renderEditor();
 }else empty('This quotation is not available in this browser. Quotations are stored locally on the same site where they were created.');
}else if(requestId&&validId(requestId)){
 const request=read('cb-demo-v1:request:'+requestId);
 request&&request.submissionId===requestId?loadFromRequest(request):empty('This inquiry is not available in this browser. Return to the inquiry flow, save a request, then prepare its quotation.');
}else empty();
