import { mountPresentation } from '/cbmachinery-demo-preview/explorer/presentation.js';

const stages={
  wine:{name:'墨酒红',value:'#21191C',title:'墨酒红背景，酒红动作，浅香槟强调。',why:'接近黑色的深酒红延续 C&B 的品牌底色。设备保持原色，酒红按钮集中承接询价，香槟只点亮关键词与当前步骤。'},
  graphite:{name:'暖石墨',value:'#242524',title:'暖石墨背景，酒红动作，浅香槟强调。',why:'更中性的暖灰黑承托金属设备，让酒红按钮在色相上更突出。相比墨酒红更克制，也更接近工业产品的展示语境。'}
};
function setStage(key){
  if(!Object.hasOwn(stages,key))key='wine';
  const selected=stages[key];document.body.dataset.stage=key;
  document.querySelectorAll('[data-stage-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.stageChoice===key)));
  document.querySelector('#palette-name').textContent=selected.title;
  document.querySelector('#palette-why').textContent=selected.why;
  document.querySelector('#stage-name').textContent=selected.name;
  document.querySelector('#stage-value').textContent=selected.value;
  document.querySelector('#palette-status').textContent='当前背景：'+selected.name+'；酒红 CTA，浅香槟强调。';
  document.querySelector('meta[name="theme-color"]').content=selected.value;
  const url=new URL(location.href);url.searchParams.set('palette','sand');url.searchParams.set('stage',key);globalThis.CB_PAGES_REPLACE_STATE(null,'',url);
}
document.querySelectorAll('[data-stage-choice]').forEach(button=>button.addEventListener('click',()=>setStage(button.dataset.stageChoice)));
setStage(new URLSearchParams(location.search).get('stage'));
const host=document.querySelector('[data-machine-presentation]');
mountPresentation(host);
