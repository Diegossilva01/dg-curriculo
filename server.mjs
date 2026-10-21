import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {dirname,resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from './scripts/build.mjs';
import {handle} from './lib/api.mjs';
const root=dirname(fileURLToPath(import.meta.url));try{process.loadEnvFile(resolve(root,'.env.local'));}catch(e){if(e.code!=='ENOENT')throw e;}
await build();
const dist=resolve(root,'dist'),port=Number(process.env.PORT||3000),types={'.svg':'image/svg+xml','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8'};
const server=http.createServer(async(req,res)=>{const url=new URL(req.url,'http://localhost');if(url.pathname.startsWith('/api/'))return handle(req,res);if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}try{let path=decodeURIComponent(url.pathname);if(!extname(path))path=path.replace(/\/$/,'')+'/index.html';const file=resolve(dist,'.'+path);if(!file.startsWith(dist+'/')){res.writeHead(404).end();return;}const content=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'}).end(req.method==='HEAD'?undefined:content);}catch{res.writeHead(404).end('Não encontrado');}});
server.on('error',e=>{console.error(`Não foi possível iniciar em 127.0.0.1:${port}: ${e.code||e.message}`);process.exitCode=1;});server.listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port} · Editor: http://127.0.0.1:${port}/editor/`));
