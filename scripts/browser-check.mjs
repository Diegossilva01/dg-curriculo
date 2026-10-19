// Run in a normal Terminal with Chrome's existing CDP endpoint available.
// Uses a separate origin and a temporary tab; never touches reference tabs or port 3000 drafts.
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
if(!globalThis.WebSocket)throw Error('Este teste requer Node.js 22 ou superior.');
const port=Number(process.env.QA_PORT||3311),origin=`http://127.0.0.1:${port}`;
const output=resolve(root,'test-artifacts');
const child=spawn(process.execPath,['server.mjs'],{cwd:root,env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});
let socket,target,session,seq=0;const pending=new Map();let stderr='';child.stderr.on('data',d=>stderr+=d.toString());
async function request(method,params={},attached=true){
  const id=++seq;
  const result=new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>{pending.delete(id);reject(Error('Tempo esgotado: '+method));},12000);
    pending.set(id,{
      resolve:value=>{clearTimeout(timeout);resolve(value);},
      reject:error=>{clearTimeout(timeout);reject(error);}
    });
  });
  socket.send(JSON.stringify({id,method,params,...(attached&&session?{sessionId:session}:{})}));
  return result;
}
async function evaluate(expression){const result=await request('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value;}
async function until(expression){for(let n=0;n<60;n++){if(await evaluate(expression))return;await new Promise(r=>setTimeout(r,100));}throw Error('Condição não atendida: '+expression);}
async function screenshot(name){const {data}=await request('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(resolve(output,name+'.png'),Buffer.from(data,'base64'));}
try{
  await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error(stderr||'Servidor de QA não iniciou.')),4000);child.stdout.once('data',()=>{clearTimeout(timeout);resolve();});child.once('exit',()=>{clearTimeout(timeout);reject(Error(stderr||'Servidor de QA encerrou.'));});});
  const version=await fetch('http://127.0.0.1:9222/json/version').then(r=>r.json());socket=new WebSocket(version.webSocketDebuggerUrl);await once(socket,'open');socket.addEventListener('message',event=>{const message=JSON.parse(event.data);if(!message.id)return;const handler=pending.get(message.id);if(handler){pending.delete(message.id);message.error?handler.reject(Error(message.error.message)):handler.resolve(message.result);}});
  ({targetId:target}=await request('Target.createTarget',{url:origin+'/editor/'},false));({sessionId:session}=await request('Target.attachToTarget',{targetId:target,flatten:true},false));await request('Page.enable');await request('Runtime.enable');await until(`typeof C!=='undefined'&&document.querySelectorAll('.gallery-card').length===10`);await mkdir(output,{recursive:true});
  await request('Emulation.setDeviceMetricsOverride',{width:1360,height:900,deviceScaleFactor:1,mobile:false});await evaluate('fitPapers()');await screenshot('gallery-desktop');
  await evaluate(`document.querySelector('#use-model').click();document.querySelector('#start-new').click();`);
  await evaluate(`const input=(name,value)=>{const e=document.querySelector('[name="'+name+'"]');e.value=value;e.dispatchEvent(new Event('input',{bubbles:true}));};input('first','Teste');input('last','Trajetória');input('email','teste@example.com');document.querySelector('#next').click();`);
  assert.equal(await evaluate('step'),1);
  await evaluate(`document.querySelector('[data-add="experience"]').click();const e=document.querySelector('[name="experience.0.role"]');e.value='Cargo preservado';e.dispatchEvent(new Event('input',{bubbles:true}));`);
  assert.equal(await evaluate('data.experience[0].role'),'Cargo preservado');
  await request('Page.reload');await until(`typeof data!=='undefined'&&data.experience[0]?.role==='Cargo preservado'`);
  await evaluate(`step=0;render()`);await request('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await evaluate('fitPapers()');assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'),true,'Sem transbordamento no celular');await screenshot('editor-mobile');
  const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aRC8AAAAASUVORK5CYII=';
  await evaluate(`new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>{photoImage=i;drawCrop();document.querySelector('#apply-photo').click();resolve();};i.onerror=reject;i.src='data:image/png;base64,${png}';})`);assert.equal(await evaluate(`data.photo.startsWith('data:image/jpeg;base64,')`),true);
  await evaluate(`data=normalize({...data,template:'profissional',experience:Array.from({length:35},(_,i)=>({role:'Experiência '+i,company:'Empresa',description:('Atividade documentada '+i+'\\n').repeat(10)})),customSections:[{id:'custom-final',title:'Última seção',body:'MARCADOR_FINAL_PDF'}]});save();step=9;render();openPreview();syncPrintSettings();`);
  await request('Emulation.setDeviceMetricsOverride',{width:1360,height:900,deviceScaleFactor:1,mobile:false});await request('Emulation.setEmulatedMedia',{media:'print'});
  const pdf=await request('Page.printToPDF',{printBackground:true,preferCSSPageSize:true});await writeFile(resolve(output,'curriculo-longo.pdf'),Buffer.from(pdf.data,'base64'));assert.ok(Buffer.from(pdf.data,'base64').length>20000);await request('Emulation.setEmulatedMedia',{media:'screen'});await screenshot('long-preview');
  // Confirm persistence roundtrip with photo and all formatting.
  assert.equal(await evaluate(`JSON.parse(localStorage.getItem(KEY)).documents.find(d=>d.id===library.activeId).data.photo===data.photo`),true);
  // A dedicated QA origin must not retain test documents after success.
  await evaluate('localStorage.removeItem(KEY)');console.log('QA local: galeria, edição, recarga, celular, foto e PDF da prévia exercitados. Este PDF NÃO é a exportação paga do servidor. Artefatos em test-artifacts/. Revise visualmente; a função de PDF paga exige teste separado com credenciais e Chromium.');
}catch(error){console.error('QA incompleta: '+error.message);process.exitCode=1;}
finally{if(socket&&socket.readyState===1){if(target)await request('Target.closeTarget',{targetId:target},false).catch(()=>{});socket.close();}child.kill();}
