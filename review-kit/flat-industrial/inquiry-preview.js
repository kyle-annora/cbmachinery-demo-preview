/** An isolated layout preview. Example answers stay in memory; nothing is submitted. */
export function mountInquiryPreview(host) {
  if (!host || host.dataset.ipMounted) return;
  host.dataset.ipMounted = 'true';

  const state = { step: 0, material: 'Steel', production: '240' };
  const labels = ['Requirements', 'Review', 'Complete'];
  const materials = ['Steel', 'Cast iron', 'Aluminum', 'Other', 'Not sure yet'];
  const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
  const production = () => state.production ? `${Number(state.production).toLocaleString('en-US')} parts / hour` : 'To discuss';

  function mainContent() {
    if (state.step === 0) return `
      <div class="ip-copy"><p class="ip-eyebrow">01 / YOUR REQUIREMENTS</p><h3 tabindex="-1">Start with what you know.</h3><p>A few details help frame the conversation. You can leave open questions for C&amp;B.</p></div>
      <div class="ip-fields">
        <label class="ip-field"><span>Material</span><select name="ip-material">${materials.map((material) => `<option${material === state.material ? ' selected' : ''}>${material}</option>`).join('')}</select></label>
        <label class="ip-field"><span>Production target <small>Optional</small></span><span class="ip-input-unit"><input name="ip-production" type="number" inputmode="numeric" min="1" max="999999" step="1" value="${escape(state.production)}" placeholder="To discuss"><span>parts / hour</span></span></label>
      </div>
      <p class="ip-helper">Dimensions, tolerances and handling requirements can be discussed with an engineer.</p>`;
    if (state.step === 1) return `
      <div class="ip-copy"><p class="ip-eyebrow">02 / REVIEW YOUR BRIEF</p><h3 tabindex="-1">A clear starting point.</h3><p>Review the example requirements before previewing the confirmation.</p></div>
      <dl class="ip-review-grid"><div><dt>Application</dt><dd>Ring gear face grinding</dd></div><div><dt>Grinding goal</dt><dd>Finish two opposing faces</dd></div><div><dt>Material</dt><dd>${escape(state.material)}</dd></div><div><dt>Production target</dt><dd>${escape(production())}</dd></div></dl>
      <div class="ip-open-questions"><span>Still to discuss</span><p>Part dimensions, surface requirements and project timing.</p></div>`;
    return globalThis.CB_PAGES_HTML(`
      <div class="ip-copy ip-completion"><span class="ip-complete-icon"><img src="/cbmachinery-demo-preview/review-kit/icons/circle-check.svg" alt="" width="24" height="24"></span><p class="ip-eyebrow">03 / CONFIRMATION PREVIEW</p><h3 tabindex="-1">A clear handoff to C&amp;B.</h3><p>After a real submission, this is where the customer would find their inquiry summary and what happens next.</p></div>
      <div class="ip-preview-notice"><strong>This was a layout preview.</strong><p>No inquiry was sent. Use Request a Quote to enter the full demo workflow.</p></div>`);
  }

  function render(moveFocus = false) {
    host.innerHTML = globalThis.CB_PAGES_HTML(`<div class="ip-preview">
      <div class="ip-topline"><span>Layout preview <span aria-hidden="true">/</span> Example project</span><span class="ip-step-count">${String(state.step + 1).padStart(2, '0')} / 03</span></div>
      <ol class="ip-progress" aria-label="Example inquiry progress">${labels.map((label, index) => `<li${index === state.step ? ' aria-current="step" class="ip-current"' : ''}><span class="ip-step-number">${String(index + 1).padStart(2, '0')}</span><span>${label}</span></li>`).join('')}</ol>
      <div class="ip-layout"><form class="ip-main" aria-label="Example inquiry preview">
        <div class="ip-step-content">${mainContent()}</div>
        <div class="ip-actions"><button class="ip-back" type="button"${state.step === 0 ? ' disabled' : ''}><img src="/cbmachinery-demo-preview/review-kit/icons/arrow-right.svg" alt="" width="16" height="16">Back</button>${state.step === 2 ? globalThis.CB_PAGES_HTML('<a class="ip-primary" href="/cbmachinery-demo-preview/request/?source=website&amp;sitePage=ring-gear">Request a Quote<img src="/cbmachinery-demo-preview/review-kit/icons/arrow-right.svg" alt="" width="17" height="17"></a>') : globalThis.CB_PAGES_HTML(`<button class="ip-primary" type="submit">${state.step === 0 ? 'Review request' : 'Preview confirmation'}<img src="/cbmachinery-demo-preview/review-kit/icons/arrow-right.svg" alt="" width="17" height="17"></button>`)}</div>
      </form>
      <aside class="ip-summary" aria-label="Example application summary"><p class="ip-eyebrow">YOUR APPLICATION</p><div class="ip-part"><img src="/cbmachinery-demo-preview/assets/ring-gear.jpg" alt="Ring gears shown in a C&B application" width="280" height="195"><div><h4>Ring gear</h4><p>Face grinding</p></div></div><dl><div><dt>Material</dt><dd data-ip-material>${escape(state.material)}</dd></div><div><dt>Production target</dt><dd data-ip-production>${escape(production())}</dd></div></dl><p class="ip-summary-note">The part comes first.<br>The machine configuration follows.</p><span class="ip-example-tag">Illustrative project details</span></aside></div>
    </div>`);

    const form = host.querySelector('form');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (state.step < 2) { state.step += 1; render(true); }
    });
    host.querySelector('.ip-back').addEventListener('click', () => {
      if (state.step > 0) { state.step -= 1; render(true); }
    });
    if (state.step === 0) {
      form.elements['ip-material'].addEventListener('change', (event) => {
        state.material = event.target.value;
        host.querySelector('[data-ip-material]').textContent = state.material;
      });
      form.elements['ip-production'].addEventListener('input', (event) => {
        state.production = event.target.value;
        host.querySelector('[data-ip-production]').textContent = event.target.validity.valid ? production() : 'Check the value';
      });
    }
    if (moveFocus) host.querySelector('h3').focus({ preventScroll: true });
  }

  render();
}
