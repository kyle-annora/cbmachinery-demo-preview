import {submitQuotationResponse,getDemoResponse} from '../integrations/annora-responses.js?v=response-20261029-1';
import {mountMachineExplorer} from '../explorer/explorer.js';
import {getCallCase,prepareCallCase,saveCallBrief,confirmCallInquiry,prepareCallQuote,recordCallResponse} from './call-case.js?v=call-20261029-3';
import {escapeHTML as esc,sourceFacts,totals,money} from '../quotes/model.js';
import {PANEL_HASHES, panelFromHash, adjacentPanel, chapterForPanel} from './presentation-route.js';
const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const panels=$$('[data-panel]');
const nodes=['machine','robot','ring','process'];
let page=8,nodeIndex=0,explorer,caseData=null,responseBusy=false;
const responseContext=()=>caseData?.quotation?{projectId:caseData.projectId,requestId:caseData.requestId,quoteId:caseData.quoteId,revision:caseData.quotation.revision,demo:true}:null;
function currentResponse(){const receipt=getDemoResponse(responseContext());return receipt?{kind:receipt.intent,note:receipt.note,receipt}:caseData?.response;}
const chapter=()=>chapterForPanel(page);
const facts=(data,limit=6)=>`<dl class="facts">${sourceFacts(data).slice(0,limit).map(([name,value])=>`<div class="fact"><dt>${esc(name)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>`;
function failure(error){const box=$('#call-error');box.hidden=false;box.textContent=error?.message||'The example could not be saved. Check browser storage and try again.';box.tabIndex=-1;box.focus();}
function clearError(){$('#call-error').hidden=true;}
function ensureCase(){caseData=prepareCallCase();return caseData;}
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
function renderQuotation(){
 const d=caseData,q=d.quotation,t=totals(q.items);
 const response=currentResponse();
 $('#quotation-content').innerHTML=globalThis.CB_PAGES_HTML(`<div class="quotation-layout"><article class="quotation-paper"><img class="quote-logo" src="/cbmachinery-demo-preview/assets/logo.webp" alt="C&B Machinery"><div class="quote-heading"><div><h2>Ring gear<br>face-grinding project</h2><p>${esc(q.customer.company)}<br>${esc(q.customer.name)}</p></div><span>Revision 01</span></div><div class="source-requirement"><strong>SAME CONFIRMED REQUIREMENT</strong><br>${esc(sourceFacts(d.inquiry)[2][1])} diameter · ${esc(sourceFacts(d.inquiry)[3][1])} thickness<br>Production target: ${esc(sourceFacts(d.inquiry)[4][1])} · Material: ${esc(sourceFacts(d.inquiry)[1][1])}</div><table class="quote-items"><thead><tr><th>PROPOSED SCOPE</th><th>EXAMPLE AMOUNT</th></tr></thead><tbody>${q.items.map((item,i)=>`<tr><td>${esc(item.description)}</td><td>${esc(money(t.rows[i].amount))}</td></tr>`).join('')}</tbody></table><div class="quote-total"><span>Illustrative subtotal</span><strong>${esc(money(t.subtotal))}</strong></div><p class="demo-note">DEMO · NOT A COMMERCIAL OFFER<br>Pricing and terms are illustrative. Configuration, specifications and scope require C&B approval.</p><div class="quote-actions"><a class="text-link" href="/cbmachinery-demo-preview/quotes/?quote=${encodeURIComponent(d.quoteId)}&revision=1&view=customer&from=project" target="_blank" rel="noopener">Open the full quotation <span aria-hidden="true">↗</span></a><a class="text-link" href="/cbmachinery-demo-preview/projects/?project=${encodeURIComponent(d.projectId)}" target="_blank" rel="noopener">Return to this project <span aria-hidden="true">↗</span></a></div></article><aside class="response-panel"><span class="label">CLOSE THE LOOP</span><h2>${response?'A next step is recorded.':'Make the next step clear.'}</h2><p>A proposal is followed by a conversation about scope, open questions and the path to an order.</p>${response?`<div class="response-saved" role="status"><strong>${response.kind==='revision'?'Revision requested':'Scope discussion requested'}</strong><p>${esc(response.note||'Review the drawing, surface requirements and proposed handling scope.')}</p><p>Linked to this project and quotation revision 01.</p>${response.receipt?`<p>Demo receipt ${esc(response.receipt.submissionId)}</p>`:''}</div><p class="demo-note">Demo response saved in this browser. No email sent, order placed or agreement accepted.</p>`:`<label for="response-note">What should C&B follow up on?<textarea id="response-note" rows="4" maxlength="2000">Review the drawing, surface requirements and proposed robotic handling scope.</textarea></label><button type="button" class="secondary-button" id="request-revision">Request a revision <span aria-hidden="true">→</span></button><p class="demo-note">The main action below requests a scope discussion. Both choices save a local demo response only.</p>`}</aside></div>`);
 $('#request-revision')?.addEventListener('click',()=>respond('revision'));
}
async function respond(kind){
 if(responseBusy)return;
 responseBusy=true;updateFooter();
 const note=$('#response-note')?.value||'';
 $('#request-revision')?.setAttribute('disabled','');
 if($('#response-note'))$('#response-note').disabled=true;
 try{
  clearError();
  const receipt=await submitQuotationResponse({context:responseContext(),intent:kind,note});
  caseData=recordCallResponse(receipt.intent,receipt.note);
  if(page===6){renderQuotation();$('.response-saved').tabIndex=-1;$('.response-saved').focus({preventScroll:true});}
 }catch(error){failure(error);$('#request-revision')?.removeAttribute('disabled');if($('#response-note'))$('#response-note').disabled=false;}
 finally{responseBusy=false;updateFooter();}
}
function selectNode(index){
 nodeIndex=index;explorer?.selectNode(nodes[index],{writeURL:false});
 $$('[data-node]').forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));updateFooter();
}
function updateFooter(){
 const labels=['Explore the machine',nodeIndex<3?['Explore robotic handling','Explore the ring gear','See face grinding'][nodeIndex]:'See the reusable assets','Start the example inquiry','Review the brief',caseData?.inquiry?'Open the confirmed project':'Confirm the example inquiry','Show the example proposal',currentResponse()?'Agree the first live pilot':responseBusy?'Submitting…':'Submit response','Return to the overview','See the customer journey','Start the walkthrough'];
 $('#call-next').innerHTML=`${labels[page]} <span aria-hidden="true">→</span>`;
 $('#call-next').disabled=page===6&&responseBusy;
 $('#call-back').disabled=page===8;
 $('#call-progress').textContent=page===8?'Overview / Value':page===9?'Overview / Journey':page===7?'Next / Live pilot':chapter()===0?'01 / Get found':chapter()===1?'02 / Build confidence':'03 / Close the loop';
}
function go(index,{focus=true}={}){
 clearError();
 try{
  if(page===3&&index!==3&&caseData?.phase==='brief'&&saveBrief()===false)return;
  if(index>=3&&index<=6){ensureCase();if(index>=5&&!caseData.inquiry)index=3;if(index===6&&!caseData.quotation)index=5;}
  page=index; panels.forEach(panel=>panel.hidden=Number(panel.dataset.panel)!==page);
  $$('[data-chapter]').forEach(button=>{if(Number(button.dataset.chapter)===chapter())button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
  if(page===1){if(!explorer)explorer=mountMachineExplorer($('#call-explorer'));selectNode(nodeIndex);}
  if(page!==2)$('video')?.pause();
  if(page===3)renderBrief();
  if(page===4)renderReview();
  if(page===5)renderHandoff();
  if(page===6)renderQuotation();
  updateFooter();
  globalThis.CB_PAGES_REPLACE_STATE(null,'','#'+PANEL_HASHES[page]);
  if(focus){panels.find(panel=>Number(panel.dataset.panel)===page).querySelector('h1').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
 }catch(error){failure(error);}
}
function next(){
 try{
  clearError();
  if(page===1&&nodeIndex<3){selectNode(nodeIndex+1);return;}
  if(page===3&&saveBrief()===false)return;
  if(page===4)caseData=confirmCallInquiry();
  if(page===5)caseData=prepareCallQuote();
  if(page===6&&!currentResponse()){respond('discuss');return;}
  if(page===7){nodeIndex=0;go(8);return;}
  go(adjacentPanel(page,1));
 }catch(error){failure(error);}
}
$('#call-next').addEventListener('click',next);
$('#call-back').addEventListener('click',()=>{if(page===1&&nodeIndex>0){selectNode(nodeIndex-1);return;}go(adjacentPanel(page,-1));});
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
window.addEventListener('storage',event=>{if(event.key?.startsWith('cb-customer-call-v1:')||event.key?.startsWith('cb-annora-response-demo-v1:')){try{caseData=getCallCase();if(page>=3&&page<=6)go(page,{focus:false});}catch(error){failure(error);}}});
$('#call-explorer').addEventListener('cb:explorer-focus',event=>{
 const actual=event.detail?.focus;
 const exact=nodes.indexOf(actual);
 nodeIndex=exact>=0?exact:({loading:1,grinding:1,controls:1,requirements:3,next:3}[actual]??nodeIndex);
 $$('[data-node]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.node===actual)));
 updateFooter();
});
go(panelFromHash(location.hash),{focus:false});
