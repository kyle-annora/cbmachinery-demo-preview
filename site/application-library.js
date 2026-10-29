(() => {
  const input=document.querySelector('#case-search');
  const cases=[...document.querySelectorAll('.pc-case')];
  const count=document.querySelector('#case-count');
  function filter(){
    const term=input.value.trim().toLowerCase();let visible=0;
    cases.forEach(item=>{item.hidden=!item.dataset.search.toLowerCase().includes(term);if(!item.hidden)visible++;});
    count.textContent=`${visible} ${visible===1?'case':'cases'}${term?' found':' published'}`;
    document.querySelector('#case-empty').hidden=visible!==0;
  }
  input.addEventListener('input',filter);
  function followHash(){
    const id=decodeURIComponent(location.hash.slice(1));
    const match=cases.find(item=>item.id===id);if(!match)return;
    input.value='';filter();cases.forEach(item=>item.open=item===match);
    requestAnimationFrame(()=>match.scrollIntoView({block:'start'}));
  }
  window.addEventListener('hashchange',followHash);followHash();
})();
