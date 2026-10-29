/* Small progressive enhancements. Page content remains readable without JavaScript. */
document.querySelectorAll('[data-sp-tabs]').forEach(group=>{
 const buttons=[...group.querySelectorAll('[role="tab"]')];
 const choose=button=>{buttons.forEach(item=>{const active=item===button;item.setAttribute('aria-selected',String(active));item.tabIndex=active?0:-1;const panel=document.getElementById(item.getAttribute('aria-controls'));if(panel)panel.hidden=!active;});};
 buttons.forEach((button,index)=>{button.addEventListener('click',()=>choose(button));button.addEventListener('keydown',event=>{let i=index;if(event.key==='ArrowRight')i=(index+1)%buttons.length;else if(event.key==='ArrowLeft')i=(index-1+buttons.length)%buttons.length;else if(event.key==='Home')i=0;else if(event.key==='End')i=buttons.length-1;else return;event.preventDefault();choose(buttons[i]);buttons[i].focus();});});
});
document.querySelectorAll('[data-sp-catalog]').forEach(catalog=>{
 const buttons=[...catalog.querySelectorAll('[data-filter]')],items=[...catalog.querySelectorAll('[data-category]')],search=catalog.querySelector('[data-search]'),count=catalog.querySelector('[data-result-count]'),empty=catalog.querySelector('[data-empty]');
 let active='all';
 function update(){const terms=(search?.value||'').trim().toLowerCase().split(/\s+/).filter(Boolean);let visible=0;items.forEach(item=>{const match=(active==='all'||item.dataset.category.split(' ').includes(active))&&terms.every(term=>item.textContent.toLowerCase().includes(term));item.hidden=!match;if(match)visible++;});if(count){const noun=catalog.dataset.resultNoun||'results';count.textContent=`${visible} ${visible===1?noun.replace(/s$/,''):noun}`;}if(empty)empty.hidden=visible!==0;}
 buttons.forEach(button=>button.addEventListener('click',()=>{active=button.dataset.filter;buttons.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));update();}));search?.addEventListener('input',update);update();
});
