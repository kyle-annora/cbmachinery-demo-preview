(() => {
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const labels={'migrated':'已迁入 Demo','replacement':'重设计流程','migrated-review':'本轮代表稿','partial':'现有摘要','missing':'尚未迁入'};
 const search=document.querySelector('#ledger-search'),group=document.querySelector('#ledger-group'),status=document.querySelector('#ledger-status');
 const list=a=>'<ul>'+a.map(x=>`<li>${esc(x)}</li>`).join('')+'</ul>';
 fetch('content-ledger.json').then(r=>{if(!r.ok)throw Error(r.status);return r.json()}).then(data=>{
  const entries=data.entries;document.querySelector('#ledger-scope').textContent=`本轮清单覆盖 ${entries.length} 个核心页面，逐页记录原始内容、当前缺口与建议去向。对应页面均可从清单打开；40 篇原站新闻已另行整理为本地文章。核对日期：${data.verifiedOn}。`;
  [...new Set(entries.map(e=>e.group))].sort().forEach(x=>{const o=document.createElement('option');o.value=x;o.textContent=x;group.append(o)});
  function render(){
   const term=search.value.trim().toLowerCase();const shown=entries.filter(e=>(!group.value||e.group===group.value)&&(!status.value||e.status===status.value)&&JSON.stringify([e.title,e.sourceUrl,e.keyContent]).toLowerCase().includes(term));
   document.querySelector('#ledger-count').textContent=`显示 ${shown.length} / ${entries.length} 个页面`;
   document.querySelector('#ledger-empty').hidden=shown.length!==0;
   document.querySelector('#ledger-rows').innerHTML=shown.map(e=>globalThis.CB_PAGES_HTML(`<tr><td><strong>${esc(e.title)}</strong><small>${esc(e.group)}</small><a href="${esc(e.sourceUrl)}" target="_blank" rel="noopener">原站页面 ↗</a><small>${esc(new URL(e.sourceUrl).pathname)}</small></td><td><span class="rv-status" data-status="${esc(e.status)}">${labels[e.status]||esc(e.status)}</span>${e.destination?globalThis.CB_PAGES_HTML(`<br><a href="${esc(e.destination)}">打开本地页面 ↗</a>`):''}<small>本地路径</small><span>${esc(e.destination||e.proposedDestination||'待确定')}</span>${e.currentDestination?`<small>现有 Demo：${esc(e.currentDestination)}</small>`:''}</td><td data-label="必须保留的内容">${list(e.keyContent||[])}</td><td data-label="待确认／缺口">${list(e.gaps||[])}</td></tr>`)).join('');
  }
  [search,group,status].forEach(el=>el.addEventListener('input',render));render();
  const exclusions=data.exclusions;
  if(Array.isArray(exclusions))document.querySelector('#ledger-exclusions').innerHTML='<p>这些项目单独保留记录，未算入核心页面覆盖。</p>'+list(exclusions.map(e=>typeof e==='string'?e:JSON.stringify(e)));
  else if(exclusions){document.querySelector('#ledger-exclusions').innerHTML=globalThis.CB_PAGES_HTML(`<p>官网 sitemap 共 ${data.counts.sourcePages} 个页面，本轮核对其中 ${entries.length} 个核心页面。另有 ${exclusions.pageUrls.length} 个法律／电商页面需要后续明确处理方式；${data.counts.migratedPosts||0} 篇新闻文章已整理到本地归档，另保留源 URL 和核验记录。</p><ul>${exclusions.pageUrls.map(url=>globalThis.CB_PAGES_HTML(`<li><a href="${esc(url)}">${esc(new URL(url).pathname)}</a></li>`)).join('')}</ul><p>全部文章 URL、来源图片及核验记录见完整 JSON 与迁移文档。</p>`);}
 }).catch(()=>{document.querySelector('#ledger-error').hidden=false;document.querySelector('#ledger-scope').textContent='来源清单暂时无法读取。';});
})();
