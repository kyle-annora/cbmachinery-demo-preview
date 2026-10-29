import { escapeHTML as e, totals, money, parseAmount, DEMO_LABEL, sourceFacts } from './model.js';
const lines = value => e(value || 'To be confirmed with C&B.').replace(/\n/g,'<br>');
const dateLabel = value => { const d=new Date(value+'T12:00:00');return Number.isNaN(d.getTime())?'To confirm':d.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}); };
function footer(d,page){return `<footer class="q-paper-footer"><span>C&B Machinery · ${e(d.id)} · ${d.revision?'Revision '+String(d.revision).padStart(2,'0'):'Working draft'}</span><span>${page===1?'COMMERCIAL SUMMARY':'APPLICATION & SCOPE'}</span></footer>`;}
export function documentHTML(d,{live=false}={}) {
  const amounts=totals(d.items);
  const source=d.sourceSnapshot||{};
  const extraQuestions=Array.isArray(source.questions)?source.questions:[];
  return globalThis.CB_PAGES_HTML(`<div class="q-document ${live?'q-document-live':''}" aria-label="Quotation document">
  <article class="q-paper q-page-commercial">
    <div class="q-demo-ribbon">${DEMO_LABEL}</div>
    <header class="q-letterhead"><div><img src="/cbmachinery-demo-preview/assets/logo.webp" alt="C&B Machinery" width="164" height="40"><p>55397 Lyon Industrial Dr<br>New Hudson, MI 48165, USA</p></div><div class="q-letterhead-contact"><a href="tel:+12482649800">+1 248.264.9800</a><a href="mailto:sales@cbmachinery.com">sales@cbmachinery.com</a><span>cbmachinery.com</span></div></header>
    <section class="q-document-heading"><p>PROJECT QUOTATION</p><h1>${e(d.title)}</h1><div class="q-document-meta"><span>${e(d.id)}</span><span>${d.revision?'Revision '+String(d.revision).padStart(2,'0'):'Working draft'}</span><span>${e(dateLabel(d.issueDate))}</span></div></section>
    <div class="q-address-row"><section><span class="q-small-label">PREPARED FOR</span><h2>${e(d.customer.company||'Customer company')}</h2><p>${e(d.customer.name||'Customer contact')}<br>${e(d.customer.email)}</p>${d.customer.address?`<p>${lines(d.customer.address)}</p>`:''}</section><section><span class="q-small-label">PROJECT REFERENCE</span><dl><div><dt>Inquiry</dt><dd>${e(d.requestId||'Standalone demonstration')}</dd></div>${d.reference?`<div><dt>Your reference</dt><dd>${e(d.reference)}</dd></div>`:''}<div><dt>Currency</dt><dd>USD</dd></div><div><dt>Status</dt><dd>${amounts.complete?'Demo pricing only':'Pricing to be confirmed'}</dd></div></dl></section></div>
    <section class="q-commercial-scope"><div class="q-section-label"><h2>Proposed scope & pricing</h2><span>USD</span></div><table class="q-line-table"><thead><tr><th scope="col">Description</th><th scope="col">Qty</th><th scope="col">Unit price</th><th scope="col">Amount</th></tr></thead><tbody>${d.items.map((item,i)=>`<tr><td><strong>${e(item.description||'Scope item')}</strong>${item.detail?`<p>${lines(item.detail)}</p>`:''}<small>${e(item.unit||'each')}</small></td><td>${e(item.quantity||'—')}</td><td>${parseAmount(item.unitPrice).kind==='priced'?money(parseAmount(item.unitPrice).value):'<span class="q-tbd">To confirm</span>'}</td><td>${amounts.rows[i]?.amount!=null?money(amounts.rows[i].amount):'<span class="q-tbd">To confirm</span>'}</td></tr>`).join('')}</tbody></table></section>
    <div class="q-total-row"><div class="q-pricing-note"><p>${d.samplePricing?'All figures and commercial terms shown are synthetic examples for layout review.':'Amounts are draft inputs for review. C&B has not issued a commercial offer.'}</p><p>Freight and taxes are excluded from the displayed scope subtotal and remain to be confirmed.</p></div><dl class="q-total"><div><dt>${amounts.complete?'Scope subtotal':'Priced items subtotal'}</dt><dd>${money(amounts.subtotal)}</dd></div>${amounts.unknown?`<div><dt>Unpriced scope</dt><dd>${amounts.unknown} ${amounts.unknown===1?'item':'items'}</dd></div>`:''}${amounts.invalid?'<div><dt>Input review</dt><dd>Required</dd></div>':''}<div class="q-total-final"><dt>${amounts.complete?'Scope total':'Complete scope total'}</dt><dd>${amounts.complete?money(amounts.subtotal):'Pending'}</dd></div></dl></div>
    <section class="q-commercial-terms"><h2>Commercial details</h2><dl><div><dt>Lead time</dt><dd>${lines(d.leadTime)}</dd></div><div><dt>Payment</dt><dd>${lines(d.payment)}</dd></div><div><dt>Validity</dt><dd>${lines(d.validity)}</dd></div><div><dt>Shipping</dt><dd>${lines(d.shipping)}</dd></div></dl></section>
    ${footer(d,1)}
  </article>
  <article class="q-paper q-page-scope">
    <div class="q-demo-ribbon">${DEMO_LABEL}</div>
    <header class="q-continuation"><img src="/cbmachinery-demo-preview/assets/logo.webp" alt="C&B Machinery" width="123" height="30"><span>${e(d.id)} · ${d.revision?'Rev '+String(d.revision).padStart(2,'0'):'Draft'}</span></header>
    <section class="q-document-heading"><p>APPLICATION & SCOPE</p><h2>A clear basis for the next conversation.</h2><p class="q-body-intro">The details supplied with the inquiry are kept separate from the proposed quotation scope.</p></section>
    <section class="q-application-facts"><h3>Customer-provided application</h3><dl>${sourceFacts(source).map(([label,value])=>`<div><dt>${e(label)}</dt><dd>${e(value)}</dd></div>`).join('')}</dl>${source.description?`<div class="q-customer-words"><span class="q-small-label">IN THE CUSTOMER’S WORDS</span><p>${lines(source.description)}</p></div>`:''}</section>
    <section class="q-scope-text"><h3>Included scope</h3><p>${lines(d.scope)}</p></section>
    <section class="q-scope-text"><h3>Exclusions & responsibilities</h3><p>${lines(d.exclusions)}</p></section>
    ${extraQuestions.length?`<section class="q-scope-text"><h3>Items to resolve together</h3><ul>${extraQuestions.map(q=>`<li>${e(q)}</li>`).join('')}</ul></section>`:''}
    ${d.notes?`<section class="q-scope-text"><h3>Project notes</h3><p>${lines(d.notes)}</p></section>`:''}
    <section class="q-next-conversation"><span class="q-small-label">NEXT CONVERSATION</span><h3>Confirm the scope. Then define the commitment.</h3><p>Review the drawing, specifications and open items with C&B before an approved commercial quotation is issued.</p><p><strong>+1 248.264.9800</strong><span>sales@cbmachinery.com</span></p></section>
    ${footer(d,2)}
  </article></div>`);
}
