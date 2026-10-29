import { escapeHTML } from '../model.js';
export { escapeHTML };
export const QUOTE_VERSION = 1;
export const QUOTE_KEY = 'cb-quotes-v1';
export const DEMO_LABEL = 'DEMO • NOT A COMMERCIAL OFFER';
const clone = value => JSON.parse(JSON.stringify(value));
const text = value => String(value ?? '');
// The initial document date follows the editor's local calendar, just like the
// date input. It is assigned only on creation; saved dates are never recomputed.
const issuerDate = value => { const parts=new Intl.DateTimeFormat('en-US',{year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value)); return ['year','month','day'].map(k=>parts.find(p=>p.type===k).value).join('-'); };
const safeId = value => /^[A-Za-z0-9_-]{1,80}$/.test(text(value));
export const validId = safeId;
export function money(value) {
  return new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', maximumFractionDigits:2 }).format(value);
}
export function parseAmount(value) {
  const s=text(value).trim();
  if(s==='') return {kind:'unknown', value:null};
  if(!/^\d+(?:\.\d{1,2})?$/.test(s)) return {kind:'invalid',value:null};
  const n=Number(s);
  if(!Number.isFinite(n)||n>999999999) return {kind:'invalid',value:null};
  return {kind:'priced',value:Math.round(n*100)/100};
}
export function parseQuantity(value) {
  const s=text(value).trim();
  if(!/^\d+(?:\.\d{1,3})?$/.test(s)) return null;
  const n=Number(s); return Number.isFinite(n)&&n>0&&n<=1000000?n:null;
}
export function totals(items=[]) {
  let subtotalCents=0,unknown=0,invalid=0;
  const rows=items.map(item=>{
    const quantity=parseQuantity(item.quantity), price=parseAmount(item.unitPrice);
    if(quantity===null||price.kind==='invalid'){invalid++;return {amount:null,status:'invalid'};}
    if(price.kind==='unknown'){unknown++;return {amount:null,status:'unknown'};}
    const amountCents=Math.round(quantity*Math.round(price.value*100));
    if(!Number.isSafeInteger(amountCents)||!Number.isSafeInteger(subtotalCents+amountCents)){invalid++;return {amount:null,status:'invalid'};}
    subtotalCents+=amountCents;return {amount:amountCents/100,status:'priced'};
  });
  return {rows,subtotal:subtotalCents/100,unknown,invalid,complete:items.length>0&&!unknown&&!invalid};
}
export function createQuote(request,id,now=new Date().toISOString()) {
  if(!safeId(id)) throw new Error('Invalid quotation ID');
  const part=text(request.part).trim()||'Grinding application';
  return {
    version:QUOTE_VERSION,id,requestId:safeId(request.submissionId)?request.submissionId:null,
    createdAt:now,updatedAt:now,revision:0,title:part==='Ring gear'?'Ring gear face-grinding project':`${part} project`,
    issueDate:issuerDate(now),reference:'',customer:{name:text(request.name).trim(),company:text(request.company).trim(),email:text(request.email).trim(),address:''},
    items:[
      {id:'scope-1',description:'Grinding system',detail:'Configuration and scope to be confirmed by C&B engineering.',quantity:'1',unit:'system',unitPrice:''},
      {id:'scope-2',description:'Part tooling & handling',detail:'Part presentation, tooling and automation scope to be reviewed.',quantity:'1',unit:'lot',unitPrice:''},
      {id:'scope-3',description:'Commissioning & training',detail:'Location, responsibilities and support scope to be confirmed.',quantity:'1',unit:'lot',unitPrice:''}
    ],
    scope:'Application review and proposed scope to be confirmed with C&B.\nCustomer drawing, material condition and finished-surface requirements remain subject to review.',
    exclusions:'Freight, taxes, installation utilities and items outside the agreed scope are not included unless expressly listed.',
    leadTime:'',payment:'',validity:'',shipping:'',notes:'',samplePricing:false,sourceSnapshot:clone(request)
  };
}
export function exampleInquiry(now=new Date().toISOString()) {
  return {submissionId:'EXAMPLE-INQUIRY',savedAt:now,demo:true,example:true,part:'Ring gear',goal:'Grind two opposing faces',material:'Steel',diameter:'200',thickness:'24',unit:'mm',volume:'',name:'Alex Example',company:'Example Manufacturing',email:'alex@example.com',phone:'',description:'Synthetic example for reviewing a ring gear project and quotation layout.',files:[],questions:['Confirm surface specifications and drawing.','Discuss production volume and handling.','Confirm the project timeline.']};
}
export function withSamplePricing(draft) {
  const next=clone(draft);
  const samples=['125000.00','18000.00','7500.00'];
  next.items=next.items.map((item,index)=>({...item,unitPrice:samples[index]||'2500.00'}));
  next.samplePricing=true;
  next.leadTime='Illustrative: 24–28 weeks after scope and order confirmation.';
  next.payment='Illustrative: 30% with order, 60% before shipment, 10% after commissioning.';
  next.validity='Illustrative: 30 days from the document date.';
  next.shipping='Illustrative: freight quoted separately; shipping point to be confirmed.';
  return next;
}
export function validateQuote(draft) {
  const errors={};
  if(!text(draft.title).trim()) errors.title='Enter a project title.';
  if(!text(draft.customer?.company).trim()) errors.company='Enter the customer company.';
  const issueDate=text(draft.issueDate); const parsedDate=new Date(issueDate+'T12:00:00Z');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(issueDate)||Number.isNaN(parsedDate.getTime())||parsedDate.toISOString().slice(0,10)!==issueDate) errors.issueDate='Choose a valid document date.';
  if(!Array.isArray(draft.items)||draft.items.length===0) errors.items='Add at least one scope item.';
  if(draft.items?.length>30) errors.items='Use no more than 30 line items in this demo.';
  (draft.items||[]).forEach((item,index)=>{
    if(!text(item.description).trim())errors[`description-${index}`]='Enter an item description.';
    if(parseQuantity(item.quantity)===null)errors[`quantity-${index}`]='Enter a positive quantity, up to 3 decimal places.';
    if(parseAmount(item.unitPrice).kind==='invalid')errors[`unitPrice-${index}`]='Use a non-negative amount with up to 2 decimals, or leave blank.';
  });
  if(totals(draft.items||[]).invalid&&!Object.keys(errors).length)errors.items='One or more line amounts cannot be calculated.';
  return errors;
}
export function revisionSnapshot(draft,revision,now=new Date().toISOString()) {
  if(!safeId(draft.id))throw new Error('Invalid quotation ID');
  if(!Number.isInteger(revision)||revision<1)throw new Error('Invalid revision');
  const failures=validateQuote(draft);if(Object.keys(failures).length)throw new Error(Object.values(failures)[0]);
  return clone({...draft,revision,savedAt:now,updatedAt:now,status:'demo-preview',demo:true});
}
export function sourceFacts(request) {
  const known=v=>v!==''&&v!=null&&v!=='Not sure yet';
  return [
    ['Part',known(request.part)?request.part:'To discuss'],
    ['Material',known(request.material)?request.material:'To discuss'],
    ['Outside diameter',known(request.diameter)?`${request.diameter} ${request.unit||'mm'}`:'To discuss'],
    ['Finished thickness',known(request.thickness)?`${request.thickness} ${request.unit||'mm'}`:'To discuss'],
    ['Production target',known(request.volume)?`${request.volume} ${request.volumeUnit||'parts / hour'}`:'To discuss'],
    ['Surface requirements',[request.tolerance,request.flatness,request.parallelism,request.finish].every(known)?'See source inquiry':'To discuss / review drawing']
  ];
}

export function validQuoteShape(value,id=value?.id) {
 return Boolean(value&&typeof value==='object'&&validId(value.id)&&value.id===id&&value.customer&&typeof value.customer==='object'&&!Array.isArray(value.customer)&&Array.isArray(value.items)&&value.items.length<=30&&value.items.every(item=>item&&typeof item==='object')&&value.sourceSnapshot&&typeof value.sourceSnapshot==='object');
}
