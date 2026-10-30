import {submitQuotationResponse,getDemoResponse} from '../integrations/annora-responses.js?v=response-20261029-1';
import {createResponseReview} from '../quotes/response-review.js?v=confirmation-20261029-1';
import {mountMachineExplorer} from '../explorer/explorer.js';
import {getCallCase,prepareCallCase,saveCallBrief,confirmCallInquiry,prepareCallQuote,recordCallResponse} from './call-case.js?v=call-20261029-3';
import {escapeHTML as esc,sourceFacts,totals,money} from '../quotes/model.js';
import {PANEL_HASHES, panelFromHash, adjacentPanel, chapterForPanel} from './presentation-route.js';
const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const panels=$$('[data-panel]');
const nodes=['machine','robot','ring','process'];
let page=8,nodeIndex=0,explorer,caseData=null,responseBusy=false;
let responseFlow=null,responseFlowKey=null,responseDraft=null,responseRefreshPending=false;
const responseContext=()=>caseData?.quotation?{projectId:caseData.projectId,requestId:caseData.requestId,quoteId:caseData.quoteId,revision:caseData.quotation.revision,demo:true}:null;
function currentResponse(){const receipt=getDemoResponse(responseContext());return receipt?{kind:receipt.intent,note:receipt.note,receipt}:caseData?.response;}
const chapter=()=>chapterForPanel(page);
const facts=(data,limit=6)=>`<dl class="facts">${sourceFacts(data).slice(0,limit).map(([name,value])=>`<div class="fact"><dt>${esc(name)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>`;
function failure(error){const box=$('#call-error');box.hidden=false;box.textContent=error?.message||'The example could not be saved. Check browser storage and try again.';box.tabIndex=-1;box.focus();}
function clearError(){$('#call-error').hidden=true;}
function ensureCase(){caseData=prepareCallCase();return caseData;}
function sameResponseCase(data,context){
 return data?.projectId===context?.projectId&&data?.requestId===context?.requestId&&data?.quoteId===context?.quoteId&&data?.quotation?.revision===context?.revision;
}
function refreshResponseCase(){
 try{caseData=getCallCase();if(page>=3&&page<=6)go(page,{focus:false});}
 catch(error){failure(error);}
}
function renderBrief(){
 const data=ensureCase(); const form=$('#call-brief');
 for(const key of ['material','diameter','thickness','volume','description']) {form.elements[key].value=data.brief[key]||'';form.elements[key].disabled=data.phase!=='brief';}
 $('[data-panel="3"] .case-status').textContent=data.phase==='brief'?'Example brief':'Confirmed example';
 $('[data-panel="3"] .demo-note').textContent=data.phase==='brief'?'Synthetic example, saved in this browser. No message is sent.':'This example was already confirmed. Its saved facts stay unchanged; continue to review the same project.';
}
function saveBrief(){
 if(caseData.phase!=='brief')return;
 const form=$('#call-brief');if(!form.reportValidity())return false;
 caseData=saveCallBrief(Object.fromEntries(['material','diameter','thickness','volume','description'].map(key=>[key,form.elements[key].value])));return true;
}
function renderReview(){$('#review-facts').innerHTML=facts(caseData.brief)+`<div class="review-notes"><span class="label">APPLICATION NOTES</span><p>${esc(caseData.brief.description||'To discuss')}</p></div>`;}
function renderHandoff(){
 const d=caseData;
 $('#handoff-content').innerHTML=globalThis.CB_PAGES_HTML(`<div class="handoff-grid"><article class="case-surface"><div class="surface-top"><span class="label">CUSTOMER PROJECT</span><span class="case-status">Inquiry confirmed</span></div><h2>Ring gear</h2><p>Example Powertrain Co. · Alex Morgan</p>${facts(d.inquiry,6)}<div class="review-notes"><span class="label">CUSTOMER APPLICATION NOTES</span><p>${esc(d.inquiry.description||'To discuss')}</p></div><p class="record-reference">${esc(d.projectId)}<br>${esc(d.requestId)}</p><a class="text-link" href="/cbmachinery-demo-preview/inquiry-document/?request=${encodeURIComponent(d.requestId)}" target="_blank" rel="noopener">Open the inquiry summary <span aria-hidden="true">↗</span></a></article><article class="case-surface handoff-team"><div class="surface-top"><span class="label">C&B TEAM · THE SAME BRIEF</span></div><h2>Review. Clarify.<br>Prepare the scope.</h2><p>The submitted dimensions and production target remain attached to the project.</p><ol class="team-tasks"><li>Review the part and required faces.</li><li>Clarify the drawing and surface specifications.</li><li>Define the equipment and handling scope.</li><li>Prepare an approved quotation.</li></ol>${d.quotation?globalThis.CB_PAGES_HTML(`<a class="text-link" href="/cbmachinery-demo-preview/demo/requests/${encodeURIComponent(d.requestId)}/" target="_blank" rel="noopener">Open C&B receiving detail <span aria-hidden="true">↗</span></a>`):''}</article></div>`);
}
function ensureResponseFlow(){
 const context=responseContext();
 const key=JSON.stringify(context);
 if(!responseFlow||key!==responseFlowKey){
  responseFlowKey=key;
  responseDraft={intent:'discuss',note:'Review the drawing, surface requirements and proposed robotic handling scope.'};
  responseFlow=createResponseReview({context,submit:submitQuotationResponse,initialIntent:responseDraft.intent,initialNote:responseDraft.note});
 }
 return responseFlow;
}
function rememberResponseDraft(){
 if(!responseFlow||responseFlow.getState().phase!=='editing')return;
 const note=$('#response-note');
 if(note)responseDraft.note=note.value;
 const choice=$('input[name="call-response-intent"]:checked');
 if(choice)responseDraft.intent=choice.value;
}
function responseSteps(review){
 return `<ol class="call-response-steps" aria-label="Response progress"><li${review?'':' aria-current="step"'}><span>1</span>Your response</li><li${review?' aria-current="step"':''}><span>2</span>Review &amp; confirm</li></ol>`;
}
function renderResponse(response){
 if(response)return `<aside class="response-panel call-response-panel" data-response-state="received" aria-labelledby="response-title"><span class="label">YOUR RESPONSE</span><h2 id="response-title" tabindex="-1">Response saved.</h2><div class="response-saved" role="status"><strong>${response.kind==='revision'?'Revision requested':'Discussion requested'}</strong><p>${esc(response.note||'No additional message.')}</p><p>Quotation ${esc(caseData.quoteId)} · Revision ${esc(caseData.quotation.revision)}</p>${response.receipt?`<p class="response-reference">Reference ${esc(response.receipt.submissionId)}</p>`:''}</div><p class="demo-note">Saved in this browser. Nothing sent to C&amp;B.</p></aside>`;
 const state=ensureResponseFlow().getState();
 const review=state.phase!=='editing';
 const busy=state.phase==='pending';
 const body=review?`<div class="call-response-summary"><dl><div><dt>To</dt><dd>C&amp;B Machinery</dd></div><div><dt>Quotation</dt><dd>${esc(caseData.quoteId)} <span>Revision ${esc(caseData.quotation.revision)}</span></dd></div><div><dt>Your request</dt><dd>${state.intent==='revision'?'Request a revision':'Discuss this quotation'}</dd></div><div class="call-response-message"><dt>Your message</dt><dd>${esc(state.note||'No additional message.')}</dd></div></dl></div>`:`<fieldset class="call-response-intents"><legend>What would you like C&amp;B to do?</legend><label><input type="radio" name="call-response-intent" value="discuss"${responseDraft.intent==='discuss'?' checked':''}><span>Discuss this quotation</span></label><label><input type="radio" name="call-response-intent" value="revision"${responseDraft.intent==='revision'?' checked':''}><span>Request a revision</span></label></fieldset><label class="call-response-note" for="response-note"><span>Your message <small>(optional)</small></span><textarea id="response-note" rows="4" maxlength="2000" aria-describedby="response-hint">${esc(responseDraft.note)}</textarea></label><p id="response-hint" class="call-response-hint">You’ll review your response before submitting.</p>`;
 return `<aside class="response-panel call-response-panel" data-response-state="${state.phase}" aria-labelledby="response-title"${busy?' aria-busy="true"':''}>${responseSteps(review)}<h2 id="response-title" tabindex="-1">${review?'Review your response.':'Your next conversation.'}</h2><p>${review?'Check the request and message below, then confirm when you’re ready.':'Choose a next step after reviewing the proposal.'}</p>${body}<p class="demo-note">Demo only. Confirmation saves this response in your browser; nothing is sent to C&amp;B.</p></aside>`;
}
function renderQuotation(){
 const d=caseData,q=d.quotation,t=totals(q.items);
 const response=currentResponse();
 $('#quotation-content').innerHTML=globalThis.CB_PAGES_HTML(`<div class="quotation-layout"><article class="quotation-paper"><img class="quote-logo" src="/cbmachinery-demo-preview/assets/logo.webp" alt="C&B Machinery"><div class="quote-heading"><div><h2>Ring gear<br>face-grinding project</h2><p>${esc(q.customer.company)}<br>${esc(q.customer.name)}</p></div><span>Revision 01</span></div><div class="source-requirement"><strong>SAME CONFIRMED REQUIREMENT</strong><br>${esc(sourceFacts(d.inquiry)[2][1])} diameter · ${esc(sourceFacts(d.inquiry)[3][1])} thickness<br>Production target: ${esc(sourceFacts(d.inquiry)[4][1])} · Material: ${esc(sourceFacts(d.inquiry)[1][1])}</div><table class="quote-items"><thead><tr><th>PROPOSED SCOPE</th><th>EXAMPLE AMOUNT</th></tr></thead><tbody>${q.items.map((item,i)=>`<tr><td>${esc(item.description)}</td><td>${esc(money(t.rows[i].amount))}</td></tr>`).join('')}</tbody></table><div class="quote-total"><span>Illustrative subtotal</span><strong>${esc(money(t.subtotal))}</strong></div><p class="demo-note">DEMO · NOT A COMMERCIAL OFFER<br>Pricing and terms are illustrative. Configuration, specifications and scope require C&B approval.</p><div class="quote-actions"><a class="text-link" href="/cbmachinery-demo-preview/quotes/?quote=${encodeURIComponent(d.quoteId)}&revision=1&view=customer&from=project" target="_blank" rel="noopener">Open the full quotation <span aria-hidden="true">↗</span></a><a class="text-link" href="/cbmachinery-demo-preview/projects/?project=${encodeURIComponent(d.projectId)}" target="_blank" rel="noopener">Return to this project <span aria-hidden="true">↗</span></a></div></article>${renderResponse(response)}</div>`);
 $('#response-note')?.addEventListener('input',rememberResponseDraft);
 $$('input[name="call-response-intent"]').forEach(input=>input.addEventListener('change',rememberResponseDraft));
}
function focusResponse(){
 const title=$('#response-title');
 title?.focus({preventScroll:true});
 title?.scrollIntoView({block:'nearest',behavior:'instant'});
}
function reviewResponse(){
 const field=$('#response-note');
 if(field&&!field.reportValidity())return;
 rememberResponseDraft();
 ensureResponseFlow().review(responseDraft);
 renderQuotation();updateFooter();focusResponse();
}
function editResponse(){
 if(responseBusy||currentResponse())return;
 const state=ensureResponseFlow().edit();
 responseDraft={intent:state.intent,note:state.note};
 clearError();renderQuotation();updateFooter();focusResponse();
}
async function respond(){
 if(responseBusy||currentResponse())return;
 const flow=ensureResponseFlow();
 const submittedContext=responseContext();
 if(flow.getState().phase!=='review')return;
 responseBusy=true;clearError();
 try{
  const submitting=flow.submitReviewed();
  renderQuotation();updateFooter();
  const receipt=await submitting;
  // A second tab may have reset/replaced the case while this exact response
  // was pending. Never attach its receipt to that other case.
  if(sameResponseCase(getCallCase(),submittedContext))caseData=recordCallResponse(receipt.intent,receipt.note);
  else responseRefreshPending=true;
  if(page===6&&!responseRefreshPending){renderQuotation();focusResponse();}
 }catch(error){
  if(page===6)renderQuotation();
  failure(error);
 }finally{
  responseBusy=false;
  if(responseRefreshPending){responseRefreshPending=false;refreshResponseCase();}
  updateFooter();
 }
}
function selectNode(index){
 nodeIndex=index;explorer?.selectNode(nodes[index],{writeURL:false});
 $$('[data-node]').forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));updateFooter();
}
function updateFooter(){
 const labels=['Explore the machine',nodeIndex<3?['Explore robotic handling','Explore the ring gear','See face grinding'][nodeIndex]:'See the reusable assets','Start the example inquiry','Review the brief',caseData?.inquiry?'Open the confirmed project':'Confirm the example inquiry','Show the example proposal',currentResponse()?'Agree the first live pilot':responseBusy?'Saving…':responseFlow?.getState().phase==='review'?'Confirm and submit':'Review response','Return to the overview','See the customer journey','Start the walkthrough'];
 $('#call-next').innerHTML=`${labels[page]} <span aria-hidden="true">→</span>`;
 $('#call-next').disabled=page===6&&responseBusy;
 $('#call-back').disabled=page===8||responseBusy;
 $('#call-back span').textContent=page===6&&!currentResponse()&&responseFlow?.getState().phase==='review'?'Edit response':'Back';
 $('#call-progress').textContent=page===8?'Overview / Value':page===9?'Overview / Journey':page===7?'Next / Live pilot':chapter()===0?'01 / Get found':chapter()===1?'02 / Build confidence':'03 / Close the loop';
}
function go(index,{focus=true}={}){
 if(responseBusy)return;
 if(page===6)rememberResponseDraft();
 clearError();
 try{
  if(page===3&&index!==3&&caseData?.phase==='brief'&&saveBrief()===false)return;
  if(index>=3&&index<=6){ensureCase();if(index>=5&&!caseData.inquiry)index=3;if(index===6&&!caseData.quotation)index=5;}
  page=index; panels.forEach(panel=>panel.hidden=Number(panel.dataset.panel)!==page);
  $$('[data-chapter]').forEach(button=>{if(Number(button.dataset.chapter)===chapter())button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
  if(page===1){if(!explorer)explorer=mountMachineExplorer($('#call-explorer'));selectNode(nodeIndex);}
  if(page!==2)$$('video').forEach(video=>video.pause());
  if(page===3)renderBrief();
  if(page===4)renderReview();
  if(page===5)renderHandoff();
  if(page===6)renderQuotation();
  updateFooter();
  globalThis.CB_PAGES_REPLACE_STATE(null,'','#'+PANEL_HASHES[page]);
  if(focus){panels.find(panel=>Number(panel.dataset.panel)===page).querySelector('h1').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
 }catch(error){failure(error);}
}
function next(event){
 try{
  clearError();
  if(page===1&&nodeIndex<3){selectNode(nodeIndex+1);return;}
  if(page===3&&saveBrief()===false)return;
  if(page===4)caseData=confirmCallInquiry();
  if(page===5)caseData=prepareCallQuote();
  if(page===6&&!currentResponse()){
   if(responseBusy)return;
   if(ensureResponseFlow().getState().phase==='review'){if(!(event?.detail>1))respond();}
   else reviewResponse();
   return;
  }
  if(page===7){nodeIndex=0;go(8);return;}
  go(adjacentPanel(page,1));
 }catch(error){failure(error);}
}
$('#call-next').addEventListener('click',next);
$('#call-back').addEventListener('click',()=>{if(page===6&&!currentResponse()&&responseFlow?.getState().phase==='review'){editResponse();return;}if(page===1&&nodeIndex>0){selectNode(nodeIndex-1);return;}go(adjacentPanel(page,-1));});
$$('[data-chapter]').forEach(button=>button.addEventListener('click',()=>go(Number(button.dataset.chapter))));
$$('[data-map-view],[data-jump]').forEach(button=>button.addEventListener('click',()=>go(Number(button.dataset.mapView??button.dataset.jump))));
$$('[data-node]').forEach((button,i)=>button.addEventListener('click',()=>selectNode(i)));
$('#call-brief').addEventListener('input',()=>{
 if(page!==3||caseData?.phase!=='brief')return;
 const form=$('#call-brief');
 if(!form.checkValidity()){ $('[data-panel="3"] .case-status').textContent='Check entered values';return; }
 try{saveBrief();$('[data-panel="3"] .case-status').textContent='Example draft saved';}
 catch(error){failure(error);}
});
$('#call-brief').addEventListener('submit',event=>{event.preventDefault();if(page===3)next();});
window.addEventListener('hashchange',()=>{const index=panelFromHash(location.hash);if(index!==page)go(index);});
window.addEventListener('storage',event=>{
 if(event.key?.startsWith('cb-customer-call-v1:')||event.key?.startsWith('cb-annora-response-demo-v1:')){
  if(responseBusy){responseRefreshPending=true;return;}
  refreshResponseCase();
 }
});
$('#call-explorer').addEventListener('cb:explorer-focus',event=>{
 const actual=event.detail?.focus;
 const exact=nodes.indexOf(actual);
 nodeIndex=exact>=0?exact:({loading:1,grinding:1,controls:1,requirements:3,next:3}[actual]??nodeIndex);
 $$('[data-node]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.node===actual)));
 updateFooter();
});
go(panelFromHash(location.hash),{focus:false});
