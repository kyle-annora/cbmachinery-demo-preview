(() => {
 const input=document.querySelector('[data-ed-news-search]'),year=document.querySelector('[data-ed-news-year]');
 if(!input||!year)return;
 const items=[...document.querySelectorAll('[data-ed-news-item]')],count=document.querySelector('[data-ed-news-count]'),empty=document.querySelector('[data-ed-news-empty]');
 function filter(){const terms=input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);let n=0;items.forEach(item=>{item.hidden=(!year.value?false:item.dataset.year!==year.value)||!terms.every(t=>item.textContent.toLowerCase().includes(t));if(!item.hidden)n++;});count.textContent=n+' '+(n===1?'article':'articles');empty.hidden=n!==0;}
 input.addEventListener('input',filter);year.addEventListener('change',filter);
})();
