import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),C=require('./model.js'),A=require('./assistant-core.js');
test('names use capitals consistently in saved data and assistant output without losing accents or mixed spelling',()=>{
 assert.equal(C.formatName('joão pedro'),'João Pedro');
 assert.equal(C.formatName('santos da silva'),'Santos da Silva');
 assert.equal(C.formatName("ana-clara d’ávila"),"Ana-Clara D’Ávila");
 assert.equal(C.formatName('McDonald'),'McDonald');
 const raw={first:'diego',last:'santos da silva'};
 assert.equal(C.normalize(raw).last,'Santos da Silva');
 assert.equal(raw.last,'santos da silva');
 const d=A.makeResume({contact:{...raw,role:'Vendedor',email:'diego@example.com'},skills:'Comunicação'});
 assert.equal(d.first,'Diego');assert.equal(d.last,'Santos da Silva');
});
test('month picker round trips existing dates and preserves free text when it cannot parse it',()=>{
 for(const [human,month] of [['Jan 2023','2023-01'],['Dez 2022','2022-12'],['fevereiro 2020','2020-02']]){assert.equal(C.monthValue(human),month);assert.equal(C.monthValue(C.monthLabel(month)),month);}
 assert.equal(C.monthValue('Atual'),'');assert.equal(C.monthLabel('Atual'),'Atual');
 assert.equal(C.monthValue('2023'),'');assert.equal(C.monthLabel('2023'),'2023');
 assert.equal(C.monthValue('2023-13'),'');assert.equal(C.monthLabel(''), '');
});
