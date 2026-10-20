(function(root){
'use strict';
const cache=new Map();
const digits=value=>String(value||'').replace(/\D/g,'');
const valid=value=>/^[\d\s-]+$/.test(String(value||''))&&digits(value).length===8;
async function lookup(value,fetcher=root.fetch){
 if(!valid(value))throw Error('Informe um CEP com oito números.');
 const cep=digits(value);if(cache.has(cep))return {...cache.get(cep)};
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),7000);
 try{
  const response=await fetcher('https://viacep.com.br/ws/'+cep+'/json/',{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});
  if(!response.ok)throw Error('lookup failed');
  const body=await response.json();
  if(body.erro)throw Error('CEP não encontrado. Confira os números ou preencha o endereço manualmente.');
  if(typeof body.localidade!=='string'||typeof body.uf!=='string')throw Error('lookup failed');
  const result={postal:body.cep||cep,address:typeof body.logradouro==='string'?body.logradouro:'',city:body.localidade+', '+body.uf};
  cache.set(cep,result);return {...result};
 }catch(error){if(error.message.startsWith('CEP não encontrado'))throw error;throw Error('Não foi possível consultar o CEP agora. Você pode preencher o endereço manualmente.');}
 finally{clearTimeout(timer);}
}
root.TrajetoriaPostal={valid,lookup};
if(typeof module!=='undefined')module.exports=root.TrajetoriaPostal;
if(typeof document==='undefined')return;
let request=0;
document.addEventListener('input',async event=>{
 const input=event.target;if(input.name!=='postal')return;
 const sequence=++request,source=data,documentId=library.activeId,value=input.value;
 const status=message=>{const el=document.getElementById('postal-status');if(el)el.textContent=message;};
 if(!valid(value)){status('Informe oito números para buscar o endereço.');return;}
 const before={address:source.address,city:source.city};status('Buscando endereço…');
 try{
  const found=await lookup(value);
  if(sequence!==request||data!==source||library.activeId!==documentId||data.postal!==value)return;
  for(const key of ['address','city']){
   // Never overwrite an address or city already entered by the user.
   if(!before[key]&&data[key]===before[key]){
    data[key]=found[key];const field=document.querySelector('input[name="'+key+'"]');if(field)field.value=found[key];
   }
  }
  save();status('CEP encontrado. Confira cidade e endereço; acrescente o número se desejar.');
 }catch(error){if(sequence===request&&data===source)status(error.message);}
});
})(globalThis);
