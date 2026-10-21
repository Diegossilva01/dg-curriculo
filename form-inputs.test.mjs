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
test('guided courses preserve selected dates, institution and hours while accepting older interviews',()=>{
 const contact={first:'Ana',last:'Silva',role:'Atendente'};
 const d=A.makeResume({contact,courses:[{title:'Excel',institution:'Escola',date:'Ago 2024',hours:'40 horas'}]});
 assert.equal(d.courses[0].date,'Ago 2024');assert.equal(d.courses[0].hours,'40 horas');assert.equal(d.courses[0].institution,'Escola');
 assert.ok(C.sectionContent(d,'courses').includes('40 horas'));
 const old=A.makeResume({contact,courses:'Excel\nInformática'});
 assert.deepEqual(old.courses.map(c=>c.title),['Excel','Informática']);
});
test('assistant uses its selected photo without changing the source draft and allows explicitly removing it',()=>{
 const source=C.normalize({photo:'data:image/png;base64,aGVsbG8='}),contact={first:'Ana',last:'Silva',role:'Vendedora'},photo='data:image/jpeg;base64,aGVsbG8=';
 assert.equal(A.makeResume({contact,photo},source).photo,photo);
 assert.equal(A.makeResume({contact,photo:''},source).photo,'');
 assert.equal(A.makeResume({contact},source).photo,source.photo);
 assert.equal(source.photo,'data:image/png;base64,aGVsbG8=');
});
