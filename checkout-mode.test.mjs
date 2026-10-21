import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

test('checkout reuses retries within one environment and starts a separate order after switching mode', async()=>{
 const storage=new Map([['trajetoria.checkout.user.doc.export_pdf.v1','legacy-test-key']]);
 const requests=[];let mode='test',click,serial=0;
 const button={id:'checkout-start',innerHTML:'Continuar'};
 const dialog={dataset:{capability:'export_pdf',key:'doc'}};
 const context={console,URLSearchParams,Intl,Date,JSON,Error,
  TrajetoriaAuth:{getSession:async()=>({user:{id:'user'},access_token:'token'}),settings:async()=>({offer:{mode,version:'v1'}})},
  C:{uid:()=>`request-${++serial}`},persist:()=>true,
  document:{querySelector:s=>s==='#offer-dialog'?dialog:null,addEventListener:(type,fn)=>{if(type==='click')click=fn;}},
  window:{addEventListener(){}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
  location:{assign(){}},
  fetch:async(url,options)=>url==='/api/access'?{ok:false,status:403,json:async()=>({error:'Compra necessária'})}:{ok:true,json:async()=>{requests.push(JSON.parse(options.body).requestKey);return {order_id:'order',url:'https://www.mercadopago.com.br/checkout'};}}
 };
 vm.runInNewContext(readFileSync(new URL('./business.js',import.meta.url),'utf8'),context);
 const purchase=()=>click({target:{closest:()=>button}});
 await purchase();await purchase();mode='production';await purchase();await purchase();
 assert.deepEqual(requests,['request-1','request-1','request-2','request-2']);
 assert.equal(storage.get('trajetoria.checkout.user.doc.export_pdf.v1'),'legacy-test-key');
});
