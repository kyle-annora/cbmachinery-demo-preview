import { mountPresentation } from '/cbmachinery-demo-preview/explorer/presentation.js';

const stages={
  wine:{name:'Ink burgundy',value:'#21191C',title:'Ink-burgundy canvas, burgundy actions, champagne emphasis.',why:'Near-black burgundy extends C&B’s brand color. Equipment keeps its original colors, burgundy buttons lead to inquiries, and champagne highlights only keywords and the current step.'},
  graphite:{name:'Warm graphite',value:'#242524',title:'Warm-graphite canvas, burgundy actions, champagne emphasis.',why:'A more neutral warm charcoal supports the metal equipment and gives burgundy buttons stronger color contrast. It is more restrained than ink burgundy and closer to an industrial product presentation.'}
};
function setStage(key){
  if(!Object.hasOwn(stages,key))key='wine';
  const selected=stages[key];document.body.dataset.stage=key;
  document.querySelectorAll('[data-stage-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.stageChoice===key)));
  document.querySelector('#palette-name').textContent=selected.title;
  document.querySelector('#palette-why').textContent=selected.why;
  document.querySelector('#stage-name').textContent=selected.name;
  document.querySelector('#stage-value').textContent=selected.value;
  document.querySelector('#palette-status').textContent='Current background: '+selected.name+'; burgundy CTA, champagne emphasis.';
  document.querySelector('meta[name="theme-color"]').content=selected.value;
  const url=new URL(location.href);url.searchParams.set('palette','sand');url.searchParams.set('stage',key);globalThis.CB_PAGES_REPLACE_STATE(null,'',url);
}
document.querySelectorAll('[data-stage-choice]').forEach(button=>button.addEventListener('click',()=>setStage(button.dataset.stageChoice)));
setStage(new URLSearchParams(location.search).get('stage'));
const host=document.querySelector('[data-machine-presentation]');
mountPresentation(host);
