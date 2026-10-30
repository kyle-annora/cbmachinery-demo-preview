import {createResponseReview} from './response-review.js';

// The caller owns transport, authorization, exact quotation context and receipt validation.
// This component does not fetch, persist data or mutate a quotation.
let panelSequence = 0;
const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
const check = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
const hasReceipt = value => Boolean(value && typeof value === 'object' && typeof value.submissionId === 'string' && value.submissionId.trim() && typeof value.receivedAt === 'string' && value.receivedAt.trim());
const intentLabel = intent => intent === 'revision' ? 'Request a revision' : 'Discuss this quotation';

/**
 * Mount a customer response for one exact, saved quotation revision.
 * Editing and review do not invoke submit. Only explicit confirmation does.
 * submit({context, intent:'discuss'|'revision', note:string}) -> Promise<receipt>
 * onReceipt(receipt, payload) runs only after a successful submit, never on initial mount.
 * Returns {destroy(), getState()}. No automatic retries or local success fallback.
 */
export function mountQuoteResponse(container, {context, submit, receipt = null, onReceipt, initialNote = ''} = {}) {
  if (!container || typeof container.replaceChildren !== 'function') throw new TypeError('A response container is required.');
  const id = `qr-response-${++panelSequence}`;
  const savedContext = context && typeof context === 'object' ? structuredClone(context) : null;
  const connected = typeof submit === 'function' && Boolean(savedContext);
  const demo = savedContext?.demo === true;
  let intent = 'discuss', note = typeof initialNote === 'string' ? initialNote.slice(0,2000) : '', destroyed = false;
  let recordedReceipt = hasReceipt(receipt) ? receipt : null;
  let sentPayload = recordedReceipt && ['discuss','revision'].includes(recordedReceipt.intent) ? {intent:recordedReceipt.intent,note:recordedReceipt.note || ''} : null;
  const flow = createResponseReview({context:savedContext, submit, initialNote:note});
  const panel = document.createElement('section');
  panel.className = 'qr-response';
  panel.setAttribute('aria-labelledby', `${id}-title`);
  container.replaceChildren(panel);

  function focusTitle() {
    // Keep the whole checkpoint visible below the site's sticky navigation.
    panel.scrollIntoView({block:'start',behavior:'instant'});
    panel.querySelector('h2')?.focus({preventScroll:true});
  }
  function progress(step) {
    return `<ol class="qr-progress" aria-label="Response progress"><li${step===1?' aria-current="step"':''}><span>1</span>Your response</li><li${step===2?' aria-current="step"':''}><span>2</span>Review &amp; confirm</li></ol>`;
  }
  function contextMeta() {
    const meta = document.createElement('dl');
    meta.className = 'qr-context';
    for (const [label, value] of [['Project',savedContext?.projectId],['Quotation',savedContext?.quoteId],['Revision',savedContext?.revision]]) {
      if (value === undefined || value === null || value === '') continue;
      const item = document.createElement('div'), term = document.createElement('dt'), definition = document.createElement('dd');
      term.textContent = label; definition.textContent = String(value);
      item.append(term, definition); meta.append(item);
    }
    return meta;
  }
  function messageSummary(payload, className = 'qr-review-summary') {
    const summary = document.createElement('dl');
    summary.className = className;
    for (const [label,value] of [['Response',intentLabel(payload.intent)],['Message',payload.note || 'No additional message.']]) {
      const row = document.createElement('div'), term = document.createElement('dt'), definition = document.createElement('dd');
      term.textContent = label; definition.textContent = value;
      row.append(term,definition); summary.append(row);
    }
    return summary;
  }
  function boundary() {
    return demo ? '<p class="qr-demo-note">Demo only. Confirmation saves this response in your browser; nothing is sent to C&amp;B.</p>' : '';
  }

  function renderReceipt() {
    panel.dataset.state = 'received';
    panel.removeAttribute('aria-busy');
    const demoReceipt = recordedReceipt.demo === true;
    panel.innerHTML = `<div class="qr-receipt-heading"><div class="qr-received-mark">${check}</div><div><p class="qr-kicker">YOUR RESPONSE</p><h2 id="${id}-title" tabindex="-1">${demoReceipt?'Response saved.':'Response received.'}</h2></div></div><p class="qr-description" role="status">${demoReceipt?'Your confirmed response is saved with this quotation.':'Your confirmed response is recorded with this quotation.'}</p>${demoReceipt?'<p class="qr-demo-note">Saved in this browser. Nothing sent to C&amp;B.</p>':''}`;
    if (sentPayload) panel.append(messageSummary(sentPayload,'qr-review-summary qr-confirmed-summary'));
    const details = document.createElement('details');
    details.className = 'qr-receipt-details';
    details.innerHTML = '<summary>Submission details</summary><dl class="qr-receipt"><div><dt>Submission reference</dt><dd data-qr-reference></dd></div><div><dt data-qr-date-label></dt><dd><time data-qr-time></time></dd></div></dl>';
    details.querySelector('[data-qr-reference]').textContent = recordedReceipt.submissionId;
    details.querySelector('[data-qr-date-label]').textContent = demoReceipt ? 'Saved' : 'Received';
    const time = details.querySelector('[data-qr-time]');
    time.dateTime = recordedReceipt.receivedAt;
    const instant = new Date(recordedReceipt.receivedAt);
    time.textContent = Number.isNaN(instant.valueOf()) ? recordedReceipt.receivedAt : new Intl.DateTimeFormat('en-US',{dateStyle:'medium',timeStyle:'short'}).format(instant);
    details.append(contextMeta());
    panel.append(details);
  }

  function renderReview(errorMessage = '') {
    const state = flow.getState();
    panel.dataset.state = errorMessage ? 'error' : 'review';
    panel.removeAttribute('aria-busy');
    panel.innerHTML = `${progress(2)}<p class="qr-kicker">BEFORE YOU SUBMIT</p><h2 id="${id}-title" tabindex="-1">Review your response.</h2><p class="qr-description">Check your message and the quotation version below, then confirm.</p><p class="qr-recipient">For <strong>C&amp;B Machinery</strong></p><div data-qr-context></div><div data-qr-summary></div>${boundary()}<p class="qr-feedback" id="${id}-feedback" role="status" aria-live="polite"></p><div class="qr-submit-row"><button type="button" class="qr-edit">Edit response</button><button type="button" class="qr-submit" aria-describedby="${id}-feedback"><span data-qr-submit-label>Confirm and submit</span>${arrow}</button></div>`;
    panel.querySelector('[data-qr-context]').replaceWith(contextMeta());
    panel.querySelector('[data-qr-summary]').replaceWith(messageSummary(state));
    panel.querySelector('.qr-feedback').textContent = errorMessage;
    panel.querySelector('.qr-edit').addEventListener('click', () => {
      if (destroyed || flow.getState().phase === 'pending') return;
      const editing = flow.edit(); intent = editing.intent; note = editing.note;
      renderForm(); focusTitle();
    });
    panel.querySelector('.qr-submit').addEventListener('click', async event => {
      // Review and confirmation must be two deliberate actions, not one double-click.
      if (event.detail > 1 || destroyed || flow.getState().phase !== 'review') return;
      const payload = {context:structuredClone(savedContext), intent:state.intent, note:state.note};
      const request = flow.submitReviewed();
      panel.dataset.state = 'pending';
      panel.setAttribute('aria-busy','true');
      panel.querySelectorAll('button').forEach(button => { button.disabled = true; });
      panel.querySelector('[data-qr-submit-label]').textContent = demo ? 'Saving…' : 'Submitting…';
      panel.querySelector('.qr-feedback').textContent = demo ? 'Saving your confirmed response…' : 'Sending your confirmed response…';
      try {
        recordedReceipt = await request;
      } catch (error) {
        if (destroyed) return;
        renderReview(typeof error?.userMessage === 'string' && error.userMessage.trim() ? error.userMessage.slice(0,300) : demo ? 'Your response could not be saved. Check the details below and confirm again to retry.' : 'Your response could not be sent. Check the details below and confirm again to retry.');
        focusTitle();
        return;
      }
      if (destroyed) return;
      sentPayload = payload;
      renderReceipt(); focusTitle();
      // A callback failure must not turn a successful submission into a retry.
      if (typeof onReceipt === 'function') onReceipt(recordedReceipt,payload);
    });
  }

  function renderForm() {
    panel.dataset.state = connected ? 'editing' : 'disconnected';
    panel.removeAttribute('aria-busy');
    panel.innerHTML = `${progress(1)}<p class="qr-kicker">RESPOND TO THIS QUOTATION</p><h2 id="${id}-title" tabindex="-1">What would you like to discuss?</h2><p class="qr-description">Choose your next step. You’ll review your response before confirming it.</p><form class="qr-form" novalidate><fieldset class="qr-intents"><legend>How would you like to continue?</legend><div class="qr-choices"><label class="qr-choice"><input type="radio" name="${id}-intent" value="discuss"><span><strong>Discuss this quotation</strong><small>Questions about the scope or next steps.</small></span></label><label class="qr-choice"><input type="radio" name="${id}-intent" value="revision"><span><strong>Request a revision</strong><small>Changes to the proposed scope or terms.</small></span></label></div></fieldset><div class="qr-message"><label for="${id}-note">Message <span>(optional)</span></label><textarea id="${id}-note" name="note" rows="3" maxlength="2000" aria-describedby="${id}-limit" placeholder="Add the details you’d like C&B to review."></textarea><span class="qr-note-limit" id="${id}-limit">Up to 2,000 characters. <span data-qr-count>0 / 2,000</span></span></div><p class="qr-feedback" id="${id}-feedback" role="status" aria-live="polite"></p><div class="qr-submit-row"><button type="submit" class="qr-submit"${connected?'':' disabled'} aria-describedby="${id}-feedback"><span data-qr-submit-label>Review response</span>${arrow}</button></div></form>`;
    panel.querySelector('.qr-description').after(contextMeta());
    const form = panel.querySelector('form'), field = panel.querySelector('textarea'), count = panel.querySelector('[data-qr-count]'), feedback = panel.querySelector('.qr-feedback');
    field.value = note;
    panel.querySelector(`input[value="${intent === 'revision' ? 'revision' : 'discuss'}"]`).checked = true;
    const updateCount = () => { count.textContent = `${new Intl.NumberFormat('en-US').format(note.length)} / 2,000`; };
    updateCount();
    if (!connected) feedback.textContent = typeof submit !== 'function' ? 'Online submission is not connected yet.' : 'This quotation’s project context is not available. Reopen the saved quotation to continue.';
    field.addEventListener('input', () => { note = field.value; updateCount(); field.removeAttribute('aria-invalid'); field.setCustomValidity(''); });
    form.addEventListener('change', event => { if (event.target.matches('input[type="radio"]')) intent = event.target.value === 'revision' ? 'revision' : 'discuss'; });
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (destroyed || recordedReceipt || !connected || flow.getState().phase !== 'editing') return;
      note = field.value;
      try {
        if (note.length > 2000) throw new Error('Keep your message to 2,000 characters or fewer.');
        const reviewed = flow.review({intent,note}); intent = reviewed.intent; note = reviewed.note;
        renderReview(); focusTitle();
      } catch (error) {
        feedback.textContent = error.message;
        field.setAttribute('aria-invalid','true');
        field.focus();
      }
    });
  }

  recordedReceipt ? renderReceipt() : renderForm();
  return {
    destroy() { destroyed = true; panel.remove(); },
    getState() { return {state:panel.dataset.state,pending:flow.getState().phase === 'pending',intent,note,receipt:recordedReceipt}; }
  };
}
