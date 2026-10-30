// The caller owns transport, authorization, exact quotation context and receipt validation.
// This component does not fetch, persist data or mutate a quotation.
let panelSequence = 0;

const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
const check = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
const copyContext = value => value && typeof value === 'object' ? value : null;
const hasReceipt = value => Boolean(value && typeof value === 'object' && typeof value.submissionId === 'string' && value.submissionId.trim() && typeof value.receivedAt === 'string' && value.receivedAt.trim());

/**
 * Mount a customer response for one exact, saved quotation revision.
 * submit({context, intent:'discuss'|'revision', note:string}) -> Promise<receipt>
 * receipt: {submissionId:string, receivedAt:string, ...callerValidatedFields}
 * onReceipt(receipt, payload) runs only after a successful submit, never on initial mount.
 * Returns {destroy(), getState()}. No automatic retries or local success fallback.
 */
export function mountQuoteResponse(container, {context, submit, receipt = null, onReceipt, initialNote = ''} = {}) {
  if (!container || typeof container.replaceChildren !== 'function') throw new TypeError('A response container is required.');
  const id = `qr-response-${++panelSequence}`;
  const savedContext = copyContext(context);
  const connected = typeof submit === 'function' && Boolean(savedContext);
  const demo = savedContext?.demo === true;
  let intent = 'discuss', note = typeof initialNote === 'string' ? initialNote.slice(0,2000) : '', pending = false, destroyed = false;
  let recordedReceipt = hasReceipt(receipt) ? receipt : null;
  let sentPayload = recordedReceipt && ['discuss','revision'].includes(recordedReceipt.intent) ? {intent:recordedReceipt.intent,note:recordedReceipt.note || ''} : null;

  const panel = document.createElement('section');
  panel.className = 'qr-response';
  panel.setAttribute('aria-labelledby', `${id}-title`);
  container.replaceChildren(panel);

  function contextMeta() {
    const meta = document.createElement('dl');
    meta.className = 'qr-context';
    const values = [
      ['Project', savedContext?.projectId],
      ['Quotation', savedContext?.quoteId],
      ['Revision', savedContext?.revision]
    ];
    for (const [label, value] of values) {
      if (value === undefined || value === null || value === '') continue;
      const item = document.createElement('div');
      const term = document.createElement('dt');
      const definition = document.createElement('dd');
      term.textContent = label;
      definition.textContent = String(value);
      item.append(term, definition);
      meta.append(item);
    }
    return meta;
  }

  function renderReceipt() {
    panel.dataset.state = 'received';
    panel.removeAttribute('aria-busy');
    const demoReceipt = recordedReceipt.demo === true;
    panel.innerHTML = `<div class="qr-received-mark">${check}</div><p class="qr-kicker">YOUR RESPONSE</p><h2 id="${id}-title" tabindex="-1">${demoReceipt?'Demo response submitted.':'Response received.'}</h2><p class="qr-description" role="status">${demoReceipt?'Your response stays with this quotation in the demo.':'Your response is recorded with this quotation.'}</p>${demoReceipt?'<p class="qr-demo-note">Saved in this browser. Nothing sent to C&B.</p>':''}<dl class="qr-receipt"><div><dt>Submission reference</dt><dd data-qr-reference></dd></div><div><dt>${demoReceipt?'Saved':'Received'}</dt><dd><time data-qr-time></time></dd></div></dl>`;
    panel.querySelector('[data-qr-reference]').textContent = recordedReceipt.submissionId;
    const time = panel.querySelector('[data-qr-time]');
    time.dateTime = recordedReceipt.receivedAt;
    const instant = new Date(recordedReceipt.receivedAt);
    time.textContent = Number.isNaN(instant.valueOf()) ? recordedReceipt.receivedAt : new Intl.DateTimeFormat('en-US', {dateStyle:'medium', timeStyle:'short'}).format(instant);
    panel.append(contextMeta());
    if (sentPayload) {
      const summary = document.createElement('div');
      summary.className = 'qr-sent-summary';
      const title = document.createElement('strong');
      title.textContent = sentPayload.intent === 'revision' ? 'Revision requested' : 'Discussion requested';
      summary.append(title);
      if (sentPayload.note) {
        const message = document.createElement('p');
        message.textContent = sentPayload.note;
        summary.append(message);
      }
      panel.append(summary);
    }
  }

  function renderForm() {
    panel.dataset.state = connected ? 'ready' : 'disconnected';
    panel.innerHTML = `<p class="qr-kicker">YOUR NEXT STEP</p><h2 id="${id}-title">Let’s move the project forward.</h2><p class="qr-description">Tell C&B what you’d like to discuss about this quotation.</p><form class="qr-form" novalidate><fieldset class="qr-intents"><legend>How would you like to continue?</legend><div class="qr-choices"><label class="qr-choice"><input type="radio" name="${id}-intent" value="discuss" checked><span><strong>Discuss this quotation</strong><small>Questions about the scope or next steps.</small></span></label><label class="qr-choice"><input type="radio" name="${id}-intent" value="revision"><span><strong>Request a revision</strong><small>Changes to the proposed scope or terms.</small></span></label></div></fieldset><div class="qr-message"><label for="${id}-note">Message <span>(optional)</span></label><textarea id="${id}-note" name="note" rows="3" maxlength="2000" aria-describedby="${id}-limit" placeholder="Add the details you’d like C&B to review."></textarea><span class="qr-note-limit" id="${id}-limit">Up to 2,000 characters. <span data-qr-count>0 / 2,000</span></span></div><p class="qr-feedback" id="${id}-feedback" role="status" aria-live="polite"></p><div class="qr-submit-row"><button type="submit" class="qr-submit"${connected?'':' disabled'} aria-describedby="${id}-feedback"><span data-qr-submit-label>Submit response</span>${arrow}</button></div></form>`;
    panel.querySelector('.qr-description').after(contextMeta());
    const form = panel.querySelector('form');
    const field = panel.querySelector('textarea');
    const count = panel.querySelector('[data-qr-count]');
    field.value=note;
    count.textContent=`${new Intl.NumberFormat('en-US').format(note.length)} / 2,000`;
    const feedback = panel.querySelector('.qr-feedback');
    const button = panel.querySelector('.qr-submit');
    const buttonLabel = panel.querySelector('[data-qr-submit-label]');
    if (demo && connected) {
      const boundary = document.createElement('p');
      boundary.className = 'qr-demo-note';
      boundary.textContent = 'Demo response only. Saved in this browser; nothing sent to C&B.';
      form.querySelector('.qr-submit-row').before(boundary);
    }
    if (!connected) feedback.textContent = typeof submit !== 'function' ? 'Online submission is not connected yet.' : 'This quotation’s project context is not available. Reopen the saved quotation to continue.';

    field.addEventListener('input', () => {
      note = field.value;
      count.textContent = `${new Intl.NumberFormat('en-US').format(note.length)} / 2,000`;
      field.removeAttribute('aria-invalid');
      field.setCustomValidity('');
    });
    form.addEventListener('change', event => {
      if (event.target.matches('input[type="radio"]')) intent = event.target.value === 'revision' ? 'revision' : 'discuss';
    });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (pending || destroyed || recordedReceipt || !connected) return;
      note = field.value;
      if (note.length > 2000) {
        field.setAttribute('aria-invalid', 'true');
        field.setCustomValidity('Keep your message to 2,000 characters or fewer.');
        feedback.textContent = 'Keep your message to 2,000 characters or fewer.';
        field.focus();
        return;
      }
      const payload = {context:savedContext, intent, note:note.trim()};
      pending = true;
      panel.dataset.state = 'pending';
      panel.setAttribute('aria-busy', 'true');
      form.querySelectorAll('input,textarea,button').forEach(control => { control.disabled = true; });
      buttonLabel.textContent = demo ? 'Saving…' : 'Submitting…';
      feedback.textContent = demo ? 'Saving your demo response…' : 'Sending your response…';
      let nextReceipt;
      try {
        nextReceipt = await submit(payload);
        if (!hasReceipt(nextReceipt)) throw new Error('A submission receipt was not returned.');
      } catch (error) {
        pending = false;
        if (destroyed) return;
        panel.dataset.state = 'error';
        panel.removeAttribute('aria-busy');
        form.querySelectorAll('input,textarea,button').forEach(control => { control.disabled = false; });
        buttonLabel.textContent = 'Retry response';
        feedback.textContent = typeof error?.userMessage === 'string' && error.userMessage.trim() ? error.userMessage.slice(0,300) : demo ? 'We couldn’t save your demo response. Your message is still here. Please try again.' : 'We couldn’t send your response. Your message is still here. Please try again.';
        return;
      }
      pending = false;
      if (destroyed) return;
      recordedReceipt = nextReceipt;
      sentPayload = payload;
      renderReceipt();
      panel.querySelector('h2').focus({preventScroll:true});
      // A receipt callback is not part of transport success and must not cause a retry.
      if (typeof onReceipt === 'function') onReceipt(recordedReceipt, payload);
    });
  }

  recordedReceipt ? renderReceipt() : renderForm();
  return {
    destroy() { destroyed = true; panel.remove(); },
    getState() { return {state:panel.dataset.state, pending, intent, note, receipt:recordedReceipt}; }
  };
}
