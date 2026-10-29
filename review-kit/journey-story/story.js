'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  const chapterTabs = [...document.querySelectorAll('[data-chapter]')];
  const phaseTabs = [...document.querySelectorAll('[data-phase]')];
  const chapters = [
    { label:'01 / DISCOVERY', headline:'Find expertise for your part.', intro:'Enter through an application, a process or a specific engineering question.', before:'Existing product and application content.', after:'A clearer entry point for each manufacturing need.', capabilities:['SEO + AI discovery','Application pages','Mobile entry'] },
    { label:'02 / UNDERSTANDING', headline:'Your machine. Your logo.', intro:'Explore the system, its components and the process behind your part.', before:'Photos, video and written cases.', after:'Make the machine and its capabilities visible.', capabilities:['Branded 3D','Component drill-down','Ring gear process'] },
    { label:'03 / CONTINUITY', headline:'One project, through to quotation.', intro:'Fill in what you know, review the brief and keep the conversation in one project.', before:'Public contact form, phone and email.', after:'A brief to review. A project to return to.', capabilities:['Fill + review','My projects','Shared quotation'] }
  ];
  const steps = [
    {chapter:0, className:'find', image:'ring-gear-desktop.jpg', alt:'C&B ring gear application page with silver parametric curves and a burgundy Request a Quote button', location:'cbmachinery.com / applications / ring gear', caption:'Application-led entry', status:'Demo experience', next:'Understand the machine'},
    {chapter:1, className:'understand', image:'brand-detail.png', alt:'C&B Machinery logo on the 3D machine cabinet, with orange component outlines, a yellow robot and a dark grid', location:'', caption:'A manufacturer’s identity, on the machine', status:'Illustrative model', next:'Start a request'},
    {chapter:2, phase:0, className:'forward has-phone', image:'inquiry.png', mobile:'inquiry-mobile.png', alt:'The C&B inquiry form, the first of two steps, retaining the ring gear application context', mobileAlt:'Mobile inquiry form with a persistent primary review action', location:'cbmachinery.com / request', caption:'01 · Fill in what you know', status:'Customer view', next:'Review the brief'},
    {chapter:2, phase:1, className:'forward', image:'review.png', alt:'The review step showing the submitted requirements and contact details before sending the inquiry', location:'cbmachinery.com / request / review', caption:'02 · Check the same brief', status:'Customer view', next:'Return to the project'},
    {chapter:2, phase:2, className:'forward has-phone', image:'project-desktop.jpg', mobile:'project-mobile.jpg', alt:'A saved ring gear project with its inquiry and available quotation, accessible through My projects', mobileAlt:'A returning visitor’s ring gear project on mobile', location:'cbmachinery.com / projects / ring gear', caption:'03 · Pick up where you left off', status:'Returning visitor', next:'View the quotation'},
    {chapter:2, phase:3, className:'forward has-phone', image:'quotation.jpg', mobile:'quotation-mobile.png', alt:'The C&B customer quotation with scope, commercial details and print or PDF actions', mobileAlt:'The C&B quotation on a mobile screen', location:'cbmachinery.com / quotations', caption:'04 · A quotation to review and share', status:'Customer document', next:'End of journey'}
  ];
  let current = 0;
  function render(announce = true) {
    const step = steps[current], chapter = chapters[step.chapter];
    ['headline','intro'].forEach((key) => $(key).textContent = chapter[key]);
    $('chapter-label').textContent = chapter.label;
    $('before-copy').textContent = chapter.before;
    $('after-copy').textContent = chapter.after;
    $('capabilities').replaceChildren(...chapter.capabilities.map((text) => { const li = document.createElement('li'); li.textContent = text; return li; }));
    chapterTabs.forEach((button, index) => { const active = index === step.chapter; button.setAttribute('aria-selected', String(active)); button.tabIndex = active ? 0 : -1; });
    $('story-panel').setAttribute('aria-labelledby', chapterTabs[step.chapter].id);
    $('phase-tabs').hidden = step.chapter !== 2;
    phaseTabs.forEach((button, index) => { const active = step.phase === index; button.setAttribute('aria-selected', String(active)); button.tabIndex = active ? 0 : -1; });
    $('visual-stage').className = `visual-stage ${step.className}`;
    if (step.chapter === 2) { $('visual-stage').setAttribute('role','tabpanel'); $('visual-stage').setAttribute('aria-labelledby', phaseTabs[step.phase].id); }
    else { $('visual-stage').removeAttribute('role'); $('visual-stage').removeAttribute('aria-labelledby'); }
    $('desktop-screen').src = `assets/${step.image}`;
    $('desktop-screen').alt = step.alt;
    $('window-location').textContent = step.location;
    $('phone').hidden = !step.mobile;
    if (step.mobile) { $('mobile-screen').src = `assets/${step.mobile}`; $('mobile-screen').alt = step.mobileAlt; }
    else { $('mobile-screen').alt = ''; }
    $('image-caption').textContent = step.caption;
    $('image-status').textContent = step.status;
    $('current-step').textContent = String(current + 1).padStart(2,'0');
    $('previous').disabled = current === 0;
    $('next').disabled = current === steps.length - 1;
    $('next-label').textContent = step.next;
    if (announce) $('announcement').textContent = `${current+1} of ${steps.length}. ${chapter.headline} ${step.caption}`;
  }
  function go(index) { current = Math.max(0,Math.min(steps.length - 1,index)); render(); }
  $('previous').addEventListener('click', () => go(current - 1));
  $('next').addEventListener('click', () => go(current + 1));
  chapterTabs.forEach((button, index) => button.addEventListener('click', () => go(index < 2 ? index : 2)));
  phaseTabs.forEach((button, index) => button.addEventListener('click', () => go(index + 2)));
  document.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.target.closest('input, textarea, select, [contenteditable=true], .presenter-notes')) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const delta = event.key === 'ArrowRight' ? 1 : -1;
      if (chapterTabs.includes(event.target)) {
        const chapter = Math.max(0,Math.min(2,steps[current].chapter + delta));
        go(chapter < 2 ? chapter : 2); chapterTabs[chapter].focus();
      } else if (phaseTabs.includes(event.target)) {
        const phase = Math.max(0,Math.min(3,steps[current].phase + delta));
        go(phase + 2); phaseTabs[phase].focus();
      } else go(current + delta);
    }
  });
  render(false);
})();
