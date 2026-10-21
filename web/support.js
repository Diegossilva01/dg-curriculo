(function(){
'use strict';
function start(){
 const link=document.createElement('a');link.className='cv-whatsapp';link.href='https://wa.me/5511977030517?text='+encodeURIComponent('Olá! Preciso de ajuda com o Capricha CV.');link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label','Pedir ajuda pelo WhatsApp');link.title='Pedir ajuda pelo WhatsApp';
 link.innerHTML='<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false"><path fill="currentColor" d="M20.52 3.48A11.88 11.88 0 0 0 12.04 0C5.46 0 .1 5.35.1 11.94c0 2.1.55 4.15 1.6 5.96L0 24l6.25-1.64a11.9 11.9 0 0 0 5.79 1.48h.01C18.63 23.84 24 18.49 24 11.9a11.85 11.85 0 0 0-3.48-8.42ZM12.05 21.82a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.71.97.99-3.62-.24-.37a9.88 9.88 0 0 1-1.52-5.27c0-5.47 4.45-9.92 9.93-9.92a9.85 9.85 0 0 1 7.02 2.91 9.87 9.87 0 0 1 2.9 7.02c0 5.47-4.45 9.87-9.97 9.87Zm5.44-7.39c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.9-.8-1.5-1.78-1.68-2.08-.17-.3-.02-.46.13-.61.13-.13.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.26.3-1.03 1.02-1.03 2.49s1.06 2.89 1.2 3.09c.15.2 2.1 3.2 5.08 4.49.7.3 1.26.48 1.7.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.3.18-1.42-.08-.13-.27-.2-.57-.35Z"/></svg><span>Precisa de ajuda?</span>';
 document.body.append(link);
 const stack=[];let frame=0;
 function place(){frame=0;const dialogs=stack.filter(d=>d.isConnected&&d.open),host=dialogs.at(-1)||document.body;if(link.parentNode!==host)host.append(link);const gallery=document.getElementById('model-gallery');link.classList.toggle('cv-whatsapp-gallery',host===document.body&&!!gallery&&!gallery.hidden);}
 const observer=new MutationObserver(records=>{for(const record of records)if(record.type==='attributes'&&record.attributeName==='open'&&record.target.tagName==='DIALOG'){const dialog=record.target,index=stack.indexOf(dialog);if(index>=0)stack.splice(index,1);if(dialog.open)stack.push(dialog);}if(!frame)frame=requestAnimationFrame(place);});
 observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','open']});place();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
