import {escapeHTML as e} from '../model.js';
import {getProject, projectInquiries} from './store.js';
import {getAccountPreview, saveAccountPreview, linkProjectToPreview} from './account-store.js';

const icon = name => globalThis.CB_PAGES_HTML(`<img src="/cbmachinery-demo-preview/review-kit/icons/${name}.svg" alt="">`);
const titleOf = project => project.title && project.title !== 'Not sure yet' ? project.title : 'Grinding project';

// Conversion follows a saved inquiry. It never gates a draft, document or quotation.
export function accountConversionCard(project, data = {}, {compact = false} = {}) {
  if (!project || !projectInquiries(project).length) return '';
  const profile = getAccountPreview();
  const linked = profile?.projectIds.includes(project.id);
  const action = profile ? (linked ? 'details' : 'link') : 'create';
  const label = profile ? (linked ? 'Account details' : 'Add this project') : 'Create an account';
  const heading = linked ? 'This project is in your account preview.' : profile ? 'Keep this project with your account.' : compact ? 'Keep your projects beyond this device.' : 'Your inquiry is saved. Keep the project.';
  const description = linked ? `${profile.email} · This browser only` : 'Return to your inquiries and quotations from one account.';
  const style = linked || project.draft ? 'btn-secondary' : 'btn-primary';
  return `<section class="ac-prompt${compact?' ac-prompt-compact':''}${linked?' ac-prompt-linked':''}" aria-label="Project account access"><div class="ac-prompt-copy"><ol class="ac-stages" aria-label="Your project journey"><li class="ac-stage-complete">${icon('circle-check')}Inquiry saved</li><li${linked?' class="ac-stage-complete"':''}><span>02</span>${linked?'Account preview':'Keep your project'}</li></ol><h2>${e(heading)}</h2><p>${e(description)}</p><small>${linked?'Demo account preview. Project data remains on this device.':'Demo: explore account setup. No real account, email or cloud sync.'}</small></div><button class="btn ${style} ac-prompt-action" type="button" data-account-action="${action}" data-account-project="${e(project.id)}">${label}${icon('arrow-right')}</button></section>`;
}

export function initAccountConversion() {
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-account-action]');
    if (!button) return;
    const project = getProject(button.dataset.accountProject);
    if (!project || !projectInquiries(project).length) return;
    openAccountPreview(project, button.dataset.accountAction);
  });
}

function openAccountPreview(project, action) {
  if (document.querySelector('#cb-account-dialog')) return;
  const inquiry = projectInquiries(project)[0];
  const profile = getAccountPreview();
  const dialog = document.createElement('dialog');
  dialog.id = 'cb-account-dialog'; dialog.className = 'ac-dialog';
  dialog.setAttribute('aria-labelledby', 'ac-title');
  dialog.setAttribute('aria-describedby', 'ac-description');
  document.body.append(dialog);
  let step = action === 'details' ? 'ready' : action === 'link' ? 'link' : 'email';
  let email = profile?.email || inquiry.email || '';
  const name = profile?.name || inquiry.name || '';
  let error = '', changed = false;
  const projectSummary = () => `<div class="ac-project-summary"><span>PROJECT TO KEEP</span><strong>${e(titleOf(project))}</strong><small>${e(project.id)}${inquiry.company?' · '+e(inquiry.company):''}</small></div>`;
  const demoNote = '<p class="ac-demo-note">Demo preview only. No email is sent, no live account is created, and projects stay in this browser.</p>';
  function render() {
    const close = `<button class="ac-close" type="button" data-ac="close" aria-label="Close account setup">${icon('x')}</button>`;
    let content = '';
    if (step === 'email') content = `<p class="ac-kicker">KEEP YOUR PROJECT · STEP 2</p><h2 id="ac-title">Create your C&B account.</h2><p id="ac-description">Use your work email to keep this inquiry and future quotations together.</p>${projectSummary()}<form id="ac-email-form" novalidate><label for="ac-email">Work email</label><input id="ac-email" name="email" type="email" autocomplete="email" maxlength="254" value="${e(email)}" required${error?' aria-invalid="true" aria-describedby="ac-error"':''}>${error?`<p id="ac-error" class="ac-error" role="alert">${e(error)}</p>`:''}<button class="btn btn-primary ac-wide" type="submit">Continue with email${icon('arrow-right')}</button></form><p class="ac-explanation">No password to remember. The live site would send a secure sign-in link to confirm your email.</p>${demoNote}<button class="ac-text-action" type="button" data-ac="close">Continue as a guest</button>`;
    if (step === 'verify') content = globalThis.CB_PAGES_HTML(`<p class="ac-kicker">EMAIL VERIFICATION · DEMO PREVIEW</p><h2 id="ac-title">Confirm your email.</h2><p id="ac-description">Here’s the email a customer would receive. Use the preview below to explore the next state.</p><div class="ac-email-preview"><div class="ac-email-brand"><img src="/cbmachinery-demo-preview/assets/logo.webp" alt="C&B Machinery" width="132" height="32"><span>Email preview</span></div><p class="ac-email-to">To ${e(email)}</p><h3>Keep your grinding project with C&B.</h3><p>Confirm your email to connect <strong>${e(titleOf(project))}</strong> to your account.</p><button class="btn btn-primary ac-wide" type="button" data-ac="verify">Preview email confirmation${icon('arrow-right')}</button><small>This button simulates confirmation locally.</small></div>${error?`<p class="ac-error" role="alert">${e(error)}</p>`:''}${demoNote}<button class="ac-text-action" type="button" data-ac="back">Use a different email</button>`);
    if (step === 'link') content = `<p class="ac-kicker">DEMO ACCOUNT PREVIEW</p><h2 id="ac-title">Add this project?</h2><p id="ac-description">Link this project to the local account preview for ${e(email)}.</p>${projectSummary()}<p class="ac-explanation">Only this project will be linked. Your saved inquiry and quotation versions stay intact.</p>${error?`<p class="ac-error" role="alert">${e(error)}</p>`:''}<button class="btn btn-primary ac-wide" type="button" data-ac="link">Add this project${icon('arrow-right')}</button>${demoNote}<button class="ac-text-action" type="button" data-ac="close">Not now</button>`;
    if (step === 'ready') content = `<p class="ac-kicker">DEMO ACCOUNT PREVIEW</p><div class="ac-success-mark">${icon('circle-check')}</div><h2 id="ac-title">Your account preview is ready.</h2><p id="ac-description">${e(email)} has this project linked in the demo.</p>${projectSummary()}<div class="ac-account-benefits"><strong>When the live account service is connected</strong><p>You’ll be able to return from another device and find your inquiries and customer-shared quotations in My projects.</p></div>${demoNote}<button class="btn btn-primary ac-wide" type="button" data-ac="close">Back to project${icon('arrow-right')}</button><button class="ac-text-action" type="button" data-ac="back">Preview email sign-in again</button>`;
    dialog.innerHTML = `<div class="ac-dialog-inner">${close}${content}</div>`;
    dialog.scrollTop = 0;
    if (error) dialog.querySelector('[aria-invalid="true"]')?.focus();
  }
  function focusHeading() {
    const heading = dialog.querySelector('#ac-title');
    heading.tabIndex = -1;
    heading.focus({preventScroll:true});
  }
  dialog.addEventListener('submit', event => {
    if (event.target.id !== 'ac-email-form') return;
    event.preventDefault();
    const field = dialog.querySelector('#ac-email');
    email = field.value.trim();
    if (!email || !field.validity.valid || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      error = 'Enter a valid email address.'; render(); return;
    }
    error = ''; step = 'verify'; render(); focusHeading();
  });
  dialog.addEventListener('click', event => {
    const target = event.target.closest('[data-ac]');
    if (!target) return;
    const next = target.dataset.ac;
    if (next === 'close') { dialog.close(); return; }
    if (next === 'back') { step = 'email'; error = ''; render(); focusHeading(); return; }
    if (next === 'verify' || next === 'link') {
      try {
        if (next === 'verify') saveAccountPreview({email, name, projectId:project.id});
        else linkProjectToPreview(project.id);
        changed = true; error = ''; step = 'ready'; render();
        focusHeading();
      } catch {
        error = 'This account preview could not be saved. Your inquiry is still available. Check browser storage and try again.'; render();
      }
    }
  });
  dialog.addEventListener('close', () => {
    dialog.remove();
    if (changed) {
      document.dispatchEvent(new CustomEvent('cb-account-preview-change'));
      document.querySelector(`[data-account-project="${project.id}"]`)?.focus({preventScroll:true});
    }
  }, {once:true});
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  render(); dialog.showModal();
  if (step === 'email' && matchMedia('(min-width: 761px)').matches) dialog.querySelector('#ac-email')?.focus({preventScroll:true});
}
