/* Lightweight inventory search; all content is rendered before scripts run. */
(() => {
 const search=document.querySelector('#inventory-search');
 if(!search)return;
 const items=[...document.querySelectorAll('[data-stock]')];
 const count=document.querySelector('#inventory-count');
 const empty=document.createElement('p');empty.className='mc-empty';empty.textContent='No listings match your search. Try a stock number or machine model.';empty.hidden=true;document.querySelector('.mc-stock-grid').after(empty);
 function filter(){const terms=search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);let n=0;items.forEach(item=>{item.hidden=!terms.every(t=>item.textContent.toLowerCase().includes(t));if(!item.hidden)n++;});count.textContent=`${n} published ${n===1?'listing':'listings'}`;empty.hidden=n!==0; const additional=document.querySelector('.mc-stock-additional'); if(additional)additional.hidden=![...additional.querySelectorAll('[data-stock]')].some(item=>!item.hidden);}
 search.addEventListener('input',filter);filter();
})();
