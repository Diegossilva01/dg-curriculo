import test from 'node:test';
import assert from 'node:assert/strict';
import C from './model.js';
const luminance=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
test('theme follows selected hue and preserves readable text on saturated backgrounds',()=>{
 for(const color of ['#315c4b','#f58b0c','#ffffff','#000000','#c5c5d0','#22c9dc','#ff5577','#123e89']){
  const p=C.colorPalette(color),a=luminance(p.color),b=luminance(p.contrast);
  assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,color+' contrast');
  assert.equal(p.color,color);assert.ok(C.paperStyle({...C.blank(),color}).includes('--resume-panel:'+p.panel));
 }
 assert.notEqual(C.colorPalette('#f58b0c').panel,C.colorPalette('#123e89').panel);
 assert.equal(C.colorPalette('url(bad)').color,'#315c4b');
});
