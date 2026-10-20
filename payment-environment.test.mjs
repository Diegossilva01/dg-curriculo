import test from 'node:test';
import assert from 'node:assert/strict';
import {verifiedPayment,verifyProviderPayment} from './lib/payments.mjs';
const env={MP_MODE:'test',MP_COLLECTOR_ID:'123'};
const order={id:'order-1',user_id:'owner-1',collector_id:'123',mode:'test',price_cents:1490,currency:'BRL'};
const payment={id:456,external_reference:order.id,collector_id:123,live_mode:true,currency_id:'BRL',transaction_amount:14.9,status:'approved',metadata:{order_id:order.id,user_id:order.user_id}};
const seller={id:123,tags:['test_user']};
test('live_mode true in test requires server-confirmed matching test seller',async()=>{
 let calls=[];
 assert.equal((await verifyProviderPayment(payment,order,env,async path=>{calls.push(path);return seller;})).status,'approved');
 assert.deepEqual(calls,['/users/me']);
 for(const account of [null,{}, {id:123,tags:[]},{id:999,tags:['test_user']},{id:123,tags:'test_user'}])
 await assert.rejects(()=>verifyProviderPayment(payment,order,env,async()=>account),/Ambiente/);
 await assert.rejects(()=>verifyProviderPayment(payment,order,env,async()=>{throw Error('provider unavailable');}),/provider unavailable/);
 assert.throws(()=>verifiedPayment(payment,order,env),/Ambiente/);
});
test('confirmed test seller never bypasses value, ownership, receiver or mode checks',()=>{
 for(const change of [{transaction_amount:1},{collector_id:999},{external_reference:'wrong'},{currency_id:'USD'},{metadata:{order_id:order.id,user_id:'wrong'}}])
 assert.throws(()=>verifiedPayment({...payment,...change},order,env,seller));
 assert.throws(()=>verifiedPayment(payment,order,{...env,MP_MODE:'production'},seller),/Ambiente/);
 assert.throws(()=>verifiedPayment({...payment,live_mode:false},{...order,mode:'production'},{...env,MP_MODE:'production'},seller),/Ambiente/);
});
test('normal sandbox payment needs no account lookup and refunds still revoke',async()=>{
 assert.equal((await verifyProviderPayment({...payment,live_mode:false},order,env,async()=>{throw Error('unexpected call');})).status,'approved');
 assert.equal(verifiedPayment({...payment,status:'pending'},order,env,seller).status,'pending');
 assert.equal(verifiedPayment({...payment,transaction_amount_refunded:1},order,env,seller).status,'revoked');
});
