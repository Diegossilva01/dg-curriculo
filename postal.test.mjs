import test from 'node:test';
import assert from 'node:assert/strict';
import postal from './postal.js';
test('CEP validates length and rejects letters before fetching',async()=>{
 assert.equal(postal.valid('01001-000'),true);assert.equal(postal.valid('01001'),false);assert.equal(postal.valid('a01001000'),false);
 await assert.rejects(postal.lookup('123',()=>{throw Error('must not fetch');}),/oito/);
});
test('CEP maps provider address and city and caches successful requests',async()=>{
 let calls=0;const fetcher=async(url)=>{calls++;assert.equal(url,'https://viacep.com.br/ws/01001000/json/');return {ok:true,json:async()=>({cep:'01001-000',logradouro:'Praça da Sé',localidade:'São Paulo',uf:'SP'})};};
 assert.deepEqual(await postal.lookup('01001-000',fetcher),{postal:'01001-000',address:'Praça da Sé',city:'São Paulo, SP'});
 const result=await postal.lookup('01001000',fetcher);result.city='changed';assert.equal((await postal.lookup('01001000',fetcher)).city,'São Paulo, SP');assert.equal(calls,1);
});
test('unknown CEP and provider failures allow manual entry with useful messages',async()=>{
 await assert.rejects(postal.lookup('99999999',async()=>({ok:true,json:async()=>({erro:true})})),/CEP não encontrado/);
 await assert.rejects(postal.lookup('88888888',async()=>{throw Error('offline');}),/manualmente/);
});
