(() => {
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const labels={'migrated':'Migrated into the demo','replacement':'Redesigned flow','migrated-review':'Representative design in this review','partial':'Existing summary','missing':'Not yet migrated'};
 const search=document.querySelector('#ledger-search'),group=document.querySelector('#ledger-group'),status=document.querySelector('#ledger-status');
 const list=a=>'<ul>'+a.map(x=>`<li>${esc(x)}</li>`).join('')+'</ul>';
 fetch('content-ledger.json').then(r=>{if(!r.ok)throw Error(r.status);return r.json()}).then(data=>{
  const entries=data.entries;document.querySelector('#ledger-scope').textContent=`This ledger covers ${entries.length} core pages, recording original content, current gaps and proposed destinations for each. Open the corresponding page from each entry. Forty original news posts are separately organized as local articles. Verified on ${data.verifiedOn}.`;
  [...new Set(entries.map(e=>e.group))].sort().forEach(x=>{const o=document.createElement('option');o.value=x;o.textContent=x;group.append(o)});
  function render(){
   const term=search.value.trim().toLowerCase();const shown=entries.filter(e=>(!group.value||e.group===group.value)&&(!status.value||e.status===status.value)&&JSON.stringify([e.title,e.sourceUrl,e.keyContent]).toLowerCase().includes(term));
   document.querySelector('#ledger-count').textContent=`Showing ${shown.length} of ${entries.length} pages`;
   document.querySelector('#ledger-empty').hidden=shown.length!==0;
   document.querySelector('#ledger-rows').innerHTML=shown.map(e=>globalThis.CB_PAGES_HTML(`<tr><td><strong>${esc(e.title)}</strong><small>${esc(e.group)}</small><a href="${esc(e.sourceUrl)}" target="_blank" rel="noopener">Original page ↗</a><small>${esc(new URL(e.sourceUrl).pathname)}</small></td><td><span class="rv-status" data-status="${esc(e.status)}">${labels[e.status]||esc(e.status)}</span>${e.destination?globalThis.CB_PAGES_HTML(`<br><a href="${esc(e.destination)}">Open local page ↗</a>`):''}<small>Local path</small><span>${esc(e.destination||e.proposedDestination||'To be determined')}</span>${e.currentDestination?`<small>Current demo: ${esc(e.currentDestination)}</small>`:''}</td><td data-label="Content to preserve">${list(e.keyContent||[])}</td><td data-label="Open questions / gaps">${list(e.gaps||[])}</td></tr>`)).join('');
  }
  [search,group,status].forEach(el=>el.addEventListener('input',render));render();
  const exclusions=data.exclusions;
  if(Array.isArray(exclusions))document.querySelector('#ledger-exclusions').innerHTML='<p>These items are recorded separately and are not counted in core-page coverage.</p>'+list(exclusions.map(e=>typeof e==='string'?e:JSON.stringify(e)));
  else if(exclusions){document.querySelector('#ledger-exclusions').innerHTML=globalThis.CB_PAGES_HTML(`<p>The original sitemap contains ${data.counts.sourcePages} pages; this review checks ${entries.length} core pages. Another ${exclusions.pageUrls.length} legal or commerce pages need a later decision. ${data.counts.migratedPosts||0} news articles have been organized in a local archive, with source URLs and verification records retained.</p><ul>${exclusions.pageUrls.map(url=>globalThis.CB_PAGES_HTML(`<li><a href="${esc(url)}">${esc(new URL(url).pathname)}</a></li>`)).join('')}</ul><p>All article URLs, source images and verification records are in the full JSON and migration documents.</p>`);}
 }).catch(()=>{document.querySelector('#ledger-error').hidden=false;document.querySelector('#ledger-scope').textContent='The source ledger is temporarily unavailable.';});
})();
