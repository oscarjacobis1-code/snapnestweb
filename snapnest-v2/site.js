function setMenuOpen(open){
 const menu=document.querySelector('.menu');
 const links=document.querySelector('.navlinks');
 if(!menu||!links)return;
 links.classList.toggle('open',open);
 menu.setAttribute('aria-expanded',String(open));
}
function toggleMenu(){
 const links=document.querySelector('.navlinks');
 if(links)setMenuOpen(!links.classList.contains('open'));
}
document.addEventListener('DOMContentLoaded',()=>{
 const menu=document.querySelector('.menu');
 const links=document.querySelector('.navlinks');
 if(!menu||!links)return;
 menu.setAttribute('aria-expanded','false');
 links.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>setMenuOpen(false)));
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&links.classList.contains('open')){
   setMenuOpen(false);
   menu.focus();
  }
 });
});
