import { COMPANY as C } from '../config.js';
import { escapeHTML as e, explorationDetails, websiteDetails, questions } from '../model.js';

const icon = name => name === 'printer' ? `<svg class="record-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6zM18 12h.01"/></svg>` : globalThis.CB_PAGES_HTML(`<img class="record-icon" src="/cbmachinery-demo-preview/review-kit/icons/${name}.svg" alt="" aria-hidden="true">`);
const firstName = d => String(d.name || '').trim().split(/\s+/)[0];
const recordPath = d => encodeURIComponent(String(d.submissionId || ''));
const pendingQuestions = d => Array.isArray(d.questions) ? d.questions : questions(d);
const value = input => input === '' || input == null || input === 'Not sure yet' ? 'To discuss' : e(input);

function savedDate(d) {
  const date = new Date(d.savedAt);
  return Number.isNaN(date.getTime()) ? 'Date not available' : date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function entryDetails(d) {
  const exploration = explorationDetails(d.explorationContext);
  const website = websiteDetails(d.websiteContext);
  return exploration
    ? { label: exploration.entry === 'application' ? 'Ring gear application explorer' : 'Machine explorer', href: exploration.href }
    : website ? {label:website.label,href:website.href} : { label: d.source === 'ring-gear' ? 'Ring gear application page' : 'C&B homepage', href: d.source === 'ring-gear' ? C.applicationUrl : '/' };
}

function inquiryOptions(d) {
  return globalThis.CB_PAGES_HTML(`<details class="record-options"><summary>Inquiry options ${icon('chevron-down')}</summary><div class="record-options-content"><a class="record-quiet-link" href="/cbmachinery-demo-preview/inquiry-document/?request=${recordPath(d)}">${icon('file-text')} View your inquiry document</a><button class="record-secondary-button" id="print-summary" type="button">${icon('printer')} Print inquiry summary</button></div></details>`);
}

const demoNote = `<div class="record-demo-note">Local demo only. Nothing has been sent to C&amp;B. No email, CRM record, or C&amp;B notification was created. File contents were not uploaded.</div>`;

export function confirmationView(d, summaryHTML) {
  const name = firstName(d);
  const questionCount = pendingQuestions(d).length;
  return globalThis.CB_PAGES_HTML(`<div class="record-page confirmation-page">
    <section class="record-hero" aria-labelledby="confirmation-title">
      <div class="flow-shell confirmation-hero-layout">
        <div class="confirmation-hero-copy">
          <p class="record-kicker">${icon('circle-check')} Demo request saved</p>
          <h1 id="confirmation-title">Your inquiry is ready.</h1>
          <p class="record-hero-description">${name ? `Thanks, ${e(name)}. ` : ''}Your application, requirements and open questions are saved together in this browser.</p>
          
        </div>
        <div class="confirmation-receipt" aria-label="Saved inquiry reference">
          <span class="record-small-label">YOUR INQUIRY</span>
          <h2>${e(d.part || 'New application')}</h2>
          <p>${e(d.company)}</p>
          <dl><div><dt>Reference</dt><dd>${e(d.submissionId)}</dd></div><div><dt>Saved</dt><dd>${e(savedDate(d))}</dd></div></dl>
          <span class="record-local-status">Saved locally · Demo</span>
        </div>
      </div>
      <div class="flow-shell record-action-bar">
        ${inquiryOptions(d)}
        <div class="record-forward-actions"><a class="btn btn-primary" href="/cbmachinery-demo-preview/demo/requests/${recordPath(d)}/">View C&amp;B handoff ${icon('arrow-right')}</a></div>
      </div>
      <p class="flow-shell record-action-context">Demo handoff view. Nothing has been sent to C&amp;B.</p>
    </section>
    <div class="record-content flow-shell confirmation-layout">
      <section class="record-reading-area" aria-label="Saved application brief">
        <details class="record-saved-summary" id="saved-summary" open>
          <summary><span><span class="record-small-label">THE DETAILS YOU SHARED</span><span class="record-summary-title">Your saved inquiry</span></span>${icon('chevron-down')}</summary>
          <div class="record-summary-content">${summaryHTML}</div>
        </details>
      </section>
      <aside class="confirmation-next" aria-labelledby="next-heading">
        <span class="record-small-label">THE PROPOSED HANDOFF</span>
        <h2 id="next-heading">What happens next</h2>
        <p class="record-aside-intro">This is how your inquiry would support a conversation with ${e(C.name)}.</p>
        <ol class="record-next-steps">
          <li><span class="record-step-number">01</span><div><h3>Review the application</h3><p>C&amp;B starts with your part, production needs and the requirements you already know.</p></div></li>
          <li><span class="record-step-number">02</span><div><h3>Fill in the gaps</h3><p>${questionCount ? `${questionCount} ${questionCount === 1 ? 'point is' : 'points are'} marked for discussion. ` : ''}Confirm the drawing and any remaining details together.</p></div></li>
          <li><span class="record-step-number">03</span><div><h3>Define the next step</h3><p>Discuss process fit before moving toward a machine proposal.</p></div></li>
        </ol>
        ${demoNote}
        
      </aside>
    </div>
  </div>`);
}

export function receiverView(d, summaryHTML) {
  const entry = entryDetails(d);
  const name = firstName(d);
  const questionCount = pendingQuestions(d).length;
  const hasFileReferences = Array.isArray(d.files) && d.files.length > 0;
  return globalThis.CB_PAGES_HTML(`<div class="record-page receiver-page">
    <section class="record-hero record-hero-compact" aria-labelledby="receiver-title">
      <div class="flow-shell">
        <div class="receiver-topline"><a class="record-quiet-link record-back-link" href="/cbmachinery-demo-preview/demo/">${icon('arrow-right')} Back to inquiry desk</a><span class="record-small-label">C&amp;B RECEIVING VIEW · DEMO</span></div>
        <div class="receiver-hero-layout">
          <div><p class="record-kicker">C&amp;B INQUIRY DESK</p><h1 id="receiver-title">${e(d.part || 'New application')}</h1><p class="receiver-company">${e(d.company)}</p></div>
          <div class="receiver-reference"><span class="record-local-status">Saved demo inquiry</span><strong>${e(d.submissionId)}</strong><span>Saved ${e(savedDate(d))}</span></div>
        </div>
        <div class="record-action-bar">
          ${inquiryOptions(d)}
          <div class="record-forward-actions"><a class="btn btn-primary receiver-create-quote" href="/cbmachinery-demo-preview/quotes/?request=${recordPath(d)}">Create quotation ${icon('arrow-right')}</a></div>
        </div>
      </div>
    </section>
    <div class="record-content flow-shell receiver-layout">
      <section class="record-reading-area" aria-labelledby="receiver-brief-heading">
        <div class="record-summary-heading"><div><span class="record-small-label">CUSTOMER-CONFIRMED SNAPSHOT</span><h2 id="receiver-brief-heading">Application brief</h2></div><a class="record-discussion-link" href="#receiver-next-step">${questionCount} ${questionCount === 1 ? 'point' : 'points'} to discuss ${icon('chevron-right')}</a></div>
        <p class="record-reading-intro">The original request, with specifications and unknowns kept together.</p>
        <div class="record-summary-content">${summaryHTML}</div>
      </section>
      <aside class="receiver-sidebar" aria-label="Contact and handoff details">
        <section class="receiver-contact" aria-labelledby="receiver-contact-heading">
          <span class="record-small-label">YOUR CONTACT</span>
          <h2 id="receiver-contact-heading">${e(String(d.name || '').trim() || 'Contact not provided')}</h2>
          <p class="receiver-contact-company">${e(d.company)}</p>
          <div class="receiver-contact-links">${d.email ? globalThis.CB_PAGES_HTML(`<a href="mailto:${e(encodeURIComponent(String(d.email)))}">${icon('mail')}<span>${e(d.email)}</span></a>`) : ''}${d.phone ? globalThis.CB_PAGES_HTML(`<a href="tel:${e(encodeURIComponent(String(d.phone)))}">${icon('phone')}<span>${e(d.phone)}</span></a>`) : ''}</div>
          <dl class="receiver-contact-facts"><div><dt>Project stage</dt><dd>${value(d.stage)}</dd></div><div><dt>Target timing</dt><dd>${value(d.timing)}</dd></div></dl>
          <div class="receiver-entry"><span class="record-small-label">STARTED FROM</span><a href="${e(entry.href)}">${e(entry.label)} ${icon('arrow-up-right')}</a><p>Browsing context, not a selected machine configuration.</p></div>
          
        </section>
        <section class="receiver-next" id="receiver-next-step" aria-labelledby="receiver-next-heading"><span class="record-small-label">SUGGESTED NEXT STEP</span><h2 id="receiver-next-heading">Start with the open questions.</h2><p>Confirm the requirements${name ? ` with ${e(name)}` : ''} and discuss process fit before proposing equipment.</p><div class="receiver-drawing-note">${icon('file-text')}<div><h3>${hasFileReferences ? 'Request the referenced drawing files' : 'Request a drawing if needed'}</h3><p>${hasFileReferences ? 'Only filenames and file details were saved. The drawing contents are not available in this demo.' : 'No drawing files were attached to this inquiry. Confirm what is needed for an engineering review.'}</p></div></div></section>
        ${demoNote}
      </aside>
    </div>
  </div>`);
}
