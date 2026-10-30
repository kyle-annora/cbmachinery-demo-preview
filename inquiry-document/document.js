import {renderInquiryDocument} from './view.js?v=tasks-20261029-1';
const id=new URLSearchParams(location.search).get('request');
let record=null;
try{record=id?JSON.parse(localStorage.getItem('cb-demo-v1:request:'+id)):null;}catch{}
const root=document.querySelector('#document');
if(record&&typeof record==='object'&&record.submissionId===id&&typeof record.name==='string'&&Array.isArray(record.files)){
  root.innerHTML=renderInquiryDocument(record);
  document.title=`Inquiry ${record.submissionId} | C&B Machinery`;
  const back=document.querySelector('#back-confirmation');back.href=globalThis.CB_PAGES_URL('/request/confirmation/?id='+encodeURIComponent(record.submissionId));back.textContent='Back to project';
  const print=document.querySelector('#print-document');print.hidden=false;print.addEventListener('click',()=>window.print());
}else root.innerHTML=globalThis.CB_PAGES_HTML('<section class="id-empty"><p class="id-eyebrow">LOCAL DEMO</p><h1>No saved inquiry here.</h1><p>Inquiry documents are available in the browser where the request was saved.</p><a href="/cbmachinery-demo-preview/request/">Start an inquiry</a><a href="/cbmachinery-demo-preview/projects/">My projects</a></section>');
