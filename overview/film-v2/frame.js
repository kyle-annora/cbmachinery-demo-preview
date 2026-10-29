import { createVideoRingScene } from './ring-scene.js';
import { createMachineScene } from '../../explorer/machine-scene.js';

const frame=document.getElementById('frame');
const id=Math.min(8,Math.max(1,Number(new URLSearchParams(location.search).get('frame'))||1));
const times=['00:04','00:11','00:18','00:26','00:34','00:42','00:51','01:00'];
const dark=[2,3,4].includes(id);
frame.className=`scene-${id}${dark?' dark':''}${id===8?' end':''}`;
const logo='../../assets/logo.webp';
const curve='../../brand/assets/precision-field-wide.svg';
const machine='../../assets/machine.png';
const common=globalThis.CB_PAGES_HTML(`<img class="brand" src="${logo}" alt="C&B Machinery"><span class="folio">${String(id).padStart(2,'0')} / 08 &nbsp; ${times[id-1]}</span><div class="chapter-line"><i style="width:${id/8*100}%"></i></div>`);
const background=globalThis.CB_PAGES_HTML(`<img class="curve" src="${curve}" alt=""><img class="machine-photo" src="${machine}" alt="C&B double-disc grinding equipment with robotic handling">`);
const copy=(k,h,s='',cls='')=>`<div class="copy ${cls}"><p class="kicker">${k}</p><h1>${h}</h1>${s?`<p class="sub">${s}</p>`:''}</div>`;
const note=t=>`<p class="footnote">${t}</p>`;
const scenes={
  1:background+copy('C&B MACHINERY / NEW HUDSON, MICHIGAN','Precision starts<br>with <em>your part.</em>','Grinding systems engineered around what you make.')+'<div class="wordmark"><span>Double-disc grinding</span><span>Robotic handling</span></div>'+note('Representative C&B equipment. Application and configuration are defined with your team.'),
  2:'<div class="grid"></div><canvas class="ring"></canvas><div class="ring-head"><p class="kicker">RING GEAR / FACE GRINDING</p><h1>Two faces.<br><em>One starting point.</em></h1></div><svg class="ring-labels" viewBox="0 0 1920 1080"></svg><div class="ring-small">The surfaces matter.<br>The application defines<br>the approach.</div>'+note('Illustrative geometry. Not to scale. Face grinding, not tooth grinding.'),
  3:'<div class="machine-stage" aria-label="Illustrative C&B equipment model"></div>'+copy('EXPLORE THE SYSTEM','See how the<br>system comes<br><em>together.</em>','Move from the whole machine to the components that matter.','explore-copy')+'<div class="machine-nav"><b>Whole machine</b><span>Robotic handling</span><span>Ring gear</span></div>'+note('Photo-guided demonstration model. Internal geometry and handling paths are schematic.'),
  4:'<div class="grid"></div><canvas class="ring"></canvas>'+copy('THE GRINDING PRINCIPLE','Understand<br>the grinding<br><em>principle.</em>','Two opposing wheels remove material from the part faces.','process-copy')+'<svg class="ring-labels" viewBox="0 0 1920 1080"></svg>'+note('Application illustration, not a machine layout. Engineering review determines the process.'),
  5:copy('YOUR APPLICATION / YOUR NEXT STEP','Bring your<br>application<br><em>into focus.</em>','See the part, understand the process, then start a conversation.','screen-copy')+globalThis.CB_PAGES_HTML('<div class="browser-proof"><div class="browser-bar"><span>C&B Machinery</span><span>Ring gear face grinding</span></div><img src="../assets/application.jpg" alt="Proposed Ring gear application page"><div class="route"><strong>01 &nbsp; Application</strong><span>→</span><strong>02 &nbsp; Explore</strong><span>→</span><strong>03 &nbsp; Request a Quote</strong></div></div>')+note('Proposed website experience. Application-specific content keeps the next step in context.'),
  6:copy('START AN INQUIRY','Share what<br>you know.<br><em>Review once.</em>','Open requirements stay open for the engineering conversation.','screen-copy')+'<div class="paper"><div class="paper-top"><span>REQUEST A QUOTE</span><span class="badge">Step 2 of 2 / Review</span></div><h2>Your ring gear brief.</h2><p class="paper-intro">The context travels with your inquiry.</p><dl><dt>Application</dt><dd>Ring gear / opposing faces</dd><dt>Material</dt><dd>Steel</dd><dt>Surface requirements</dt><dd class="open">To discuss</dd><dt>Production target</dt><dd class="open">To discuss</dd></dl><div class="paper-button">Confirm inquiry <span>→</span></div><p class="paper-note">You do not need every specification to start.</p></div><div class="two-steps" style="position:absolute;left:96px;bottom:212px"><span>01 &nbsp; Fill in</span><span>→</span><b>02 &nbsp; Review</b></div>'+note('Illustrative demo interface and example data. No inquiry is sent from this film.'),
  7:copy('ONE PROJECT / A SHARED NEXT STEP','Keep the<br>conversation<br><em>moving.</em>','Review the proposal. Clarify the scope. Agree the next step.')+globalThis.CB_PAGES_HTML(`<div class="paper quotation"><div class="paper-top"><img src="${logo}" alt="C&B Machinery"><span class="badge">Illustrative proposal</span></div><h2>Ring gear project</h2><p class="paper-intro">C&B prepares the proposal · Your response stays with the project</p><div class="scope"><p>Scope for review</p><p class="muted">Equipment configuration and requirements</p><p class="muted">Open questions and next steps</p></div><div class="reply"><p>What would you like to clarify?</p><div class="reply-action">Request a scope discussion <span>→</span></div></div><p class="paper-note">The proposal and your response stay with the project.</p></div>`)+note('Proposed workflow. Pricing follows C&B review. Live demo responses are saved in the current browser only.'),
  8:background+`<div class="copy"><p class="kicker">C&B MACHINERY</p><h1>Let’s start<br>with <em>your part.</em></h1><div class="cta">Request a Quote <span class="fake-arrow">→</span></div><p class="contact">+1 248.264.9800<br>sales@cbmachinery.com</p></div>`+note('Representative equipment shown. Your application shapes the engineering conversation.')
};
frame.innerHTML=common+scenes[id];
document.title=`C&B film keyframe ${String(id).padStart(2,'0')} / ${times[id-1]}`;
function fit(){const s=Math.min(innerWidth/1920,1);frame.style.transform=`scale(${s})`;document.body.style.height=`${1080*s}px`;}
fit();addEventListener('resize',fit);
if(id===2||id===4){
 const scene=createVideoRingScene(frame.querySelector('canvas'),{width:1920,height:1080,theme:'wine'});
 scene.render({view:{elevation:id===2?30:19,azimuth:36,height:id===2?5.4:7.2,cx:id===2?.62:.65,cy:id===2?.64:.55},faceA:1,faceB:1,wheels:{amount:id===4?1:0,gap:.82}});
 const svg=frame.querySelector('svg');const ns='http://www.w3.org/2000/svg';
 const add=(tag,attrs,text)=>{const e=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));if(text)e.textContent=text;svg.append(e);return e};
 const path=ps=>'M'+ps.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('L');
 for(const face of ['A','B']){const r=scene.faceRims(face);if(r.facing>0){r.rims.forEach(ps=>add('path',{class:'rim',d:path(ps)+'Z'}))}else{let run=[];const flush=()=>{if(run.length>1)add('path',{class:'rim',d:path(run)});run=[]};scene.faceEdge(face).forEach(p=>{if(p.visible)run.push(p);else flush()});flush()}}
 const label=(anchor,title,x,y,neutral=false)=>{add('path',{class:'leader',d:`M${anchor.x},${anchor.y} L${x-32},${y-10} H${x-12}`});add('circle',{cx:anchor.x,cy:anchor.y,r:5,style:neutral?'stroke:#a69a9f':''});add('text',{x,y},title)};
 if(id===2){label(scene.anchors.faceA(-80),'Face A',1660,535);label(scene.anchors.ringEdge(5,-.221),'Face B',1660,850)}
 else{label(scene.anchors.wheelUpperRim(-50),'Grinding wheel',1640,285,true);label(scene.anchors.faceA(-60),'Face A',1640,510);label(scene.anchors.ringEdge(-5,-.221),'Face B',1640,645);label(scene.anchors.wheelLowerRim(-30),'Grinding wheel',1640,855,true)}
}
if(id===3){createMachineScene(frame.querySelector('.machine-stage'),{framingScale:.82,onReady(){document.body.dataset.model='ready'}})}
await Promise.all([...document.images].map(img=>img.decode().catch(()=>{})));
document.body.dataset.ready='true';
