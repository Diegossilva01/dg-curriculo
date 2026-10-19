import test from 'node:test';
import assert from 'node:assert/strict';
import {handle} from './lib/api.mjs';
import {CURRENT_OFFER,offerConfig,checkoutConfig} from './lib/config.mjs';
import {createRequire} from 'node:module';
const C=createRequire(import.meta.url)('./model.js');
const A='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',B='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const resumeId='11111111-1111-4111-8111-111111111111',orderId='22222222-2222-4222-8222-222222222222';
const doc={id:resumeId,user_id:A,client_id:'purchased-draft',data:C.normalize({first:'Álvaro',last:'Gonçalves',summary:'Informações do servidor'})};
const grantId='33333333-3333-4333-8333-333333333333';
const originalEnv=Object.fromEntries(['SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','SUPABASE_SERVICE_ROLE_KEY','MP_MODE','MP_ACCESS_TOKEN','MP_COLLECTOR_ID'].map(k=>[k,process.env[k]]));
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});}
async function exercise({actor=A,state='none',format='pdf',requestBody}={}){const originalFetch=globalThis.fetch;let rendererPaymentCalls=0;Object.assign(process.env,{SUPABASE_URL:'https://database.example',SUPABASE_PUBLISHABLE_KEY:'test-public',SUPABASE_SERVICE_ROLE_KEY:'test-service',MP_MODE:'test',MP_ACCESS_TOKEN:'test-token',MP_COLLECTOR_ID:'123'});
// A transport fixture, not a simulated successful checkout. No external request is performed.
globalThis.fetch=async(url,options={})=>{const u=new URL(url),body=options.body?JSON.parse(options.body):{};
if(u.pathname==='/auth/v1/user')return json({id:actor,email:'fixture@example.com'});
if(u.pathname==='/rest/v1/rpc/check_rate_limit')return json(null);
if(u.pathname==='/rest/v1/resumes'){const requestedUser=u.searchParams.get('user_id');return json(requestedUser==='eq.'+A&&u.searchParams.get('id')==='eq.'+resumeId?[doc]:[]);}
if(u.pathname==='/rest/v1/rpc/require_specific_document_access'){
 const permitted=state==='valid'&&body.p_user===A&&body.p_key===doc.client_id;
 return permitted?json(grantId):json({code:'P0001',message:'ACCESS_DENIED'},400);
}
if(u.pathname==='/rest/v1/entitlements')return json([{order_id:orderId}]);
if(u.pathname==='/rest/v1/payment_records')return json([{payment_id:'444'}]);
if(u.pathname==='/v1/payments/444'){rendererPaymentCalls++;return json({id:444,collector_id:123,external_reference:orderId,live_mode:false,transaction_amount:14.90,currency_id:'BRL',status:'approved',metadata:{order_id:orderId,user_id:A},date_last_updated:'2026-10-19T10:00:00Z',date_approved:'2026-10-19T10:00:00Z'});}
if(u.pathname==='/rest/v1/orders')return json([{id:orderId,user_id:A,collector_id:'123',mode:'test',price_cents:1490,currency:'BRL'}]);
if(u.pathname==='/rest/v1/rpc/apply_verified_payment')return json('approved');
throw Error('Unexpected fixture request: '+u.pathname);};
try{let result;const headers={};const res={statusCode:200,setHeader(k,v){headers[k]=v;},end(value){result={status:this.statusCode,content:Buffer.isBuffer(value)?value.toString('utf8'):value,headers};}};await handle({url:'/api/export',method:'POST',headers:{authorization:'Bearer fixture-token','content-type':'application/json'},body:requestBody||{resumeId,format}},res);return {...result,paymentCalls:rendererPaymentCalls};}finally{globalThis.fetch=originalFetch;for(const [key,value]of Object.entries(originalEnv))if(value===undefined)delete process.env[key];else process.env[key]=value;}}
test('oferta atual é R$14,90 / um currículo / 30 dias / pagamento único / sem desconto',()=>{assert.equal(CURRENT_OFFER.price_cents,1490);assert.equal(CURRENT_OFFER.duration_days,30);assert.equal(CURRENT_OFFER.resume_limit,1);assert.equal(CURRENT_OFFER.recurring,false);assert.equal(CURRENT_OFFER.discount_cents,0);assert.equal(offerConfig({}).terms_defined,true);assert.equal(offerConfig({}).enabled,false);const env={SELLER_NAME:'fixture',SELLER_DOCUMENT:'fixture',CONTACT_EMAIL:'fixture@example.com',LEGAL_ADDRESS:'fixture',PAYMENTS_ENABLED:'true',MP_MODE:'production'};assert.equal(offerConfig(env).enabled,false);assert.equal(offerConfig({...env,PRICE_CENTS:'1'}).enabled,false);assert.throws(()=>checkoutConfig(env));});
test('PDF, DOCX e TXT não são gerados sem compra válida',async()=>{for(const format of ['pdf','docx','txt']){const result=await exercise({format,state:'none'});assert.equal(result.status,403,format);assert.equal(result.paymentCalls,0);assert.ok(!result.headers['Content-Disposition']);}});
test('outra conta não consegue exportar o currículo nem com direito próprio',async()=>{for(const format of ['pdf','docx','txt']){const result=await exercise({actor:B,state:'valid',format});assert.equal(result.status,404,format);assert.equal(result.paymentCalls,0);}});
test('acesso expirado e compra de outro currículo são recusados',async()=>{for(const state of ['expired','other-document'])for(const format of ['pdf','docx','txt']){const result=await exercise({state,format});assert.equal(result.status,403,`${state}/${format}`);assert.equal(result.paymentCalls,0);}});
test('payload local com pago=true não fornece conteúdo ou propriedade ao exportador',async()=>{const legacy=await exercise({state:'valid',requestBody:{format:'pdf',documentKey:doc.client_id,data:doc.data,paid:true}});assert.equal(legacy.status,400);const paid=await exercise({state:'valid',format:'txt',requestBody:{resumeId,format:'txt',data:{first:'CONTEUDO_INJETADO'},paid:true}});assert.equal(paid.status,200);assert.ok(paid.content.includes('Álvaro'));assert.ok(paid.content.includes('Informações do servidor'));assert.ok(!paid.content.includes('CONTEUDO_INJETADO'));assert.ok(paid.paymentCalls>0);assert.equal(paid.headers['Cache-Control'],'no-store');assert.ok(paid.headers['Content-Disposition'].startsWith('attachment;'));});
test('prévia contém conteúdo e marcas repetidas; renderizador final não recebe as marcas',()=>{const data=C.normalize({first:'Álvaro',summary:'Conteúdo para conferir'});const preview=C.previewHTML(data);assert.ok(preview.includes('Conteúdo para conferir'));assert.ok(preview.includes('preview-watermark'));assert.equal((preview.match(/TRAJETÓRIA · PRÉVIA/g)||[]).length,16);assert.ok(!C.resumeHTML(data).includes('preview-watermark'));});
