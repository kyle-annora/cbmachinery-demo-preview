const tabs=[...document.querySelectorAll('[role="tab"]')];
function selectTab(index,focus=false){
 tabs.forEach((tab,i)=>{const active=i===index;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;document.getElementById(tab.getAttribute('aria-controls')).hidden=!active;});
 if(focus)tabs[index].focus({preventScroll:true});
 window.scrollTo({top:0,behavior:'auto'});
}
tabs.forEach((tab,index)=>{
 tab.addEventListener('click',()=>selectTab(index));
 tab.addEventListener('keydown',event=>{let next=index;if(event.key==='ArrowRight')next=(index+1)%tabs.length;else if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;event.preventDefault();selectTab(next,true);});
});
