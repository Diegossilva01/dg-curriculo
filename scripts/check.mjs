import {readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
async function files(folder){const result=[];for(const entry of await readdir(folder,{withFileTypes:true})){if(['node_modules','dist','.git','.vercel','test-artifacts'].includes(entry.name))continue;const path=folder+'/'+entry.name;if(entry.isDirectory())result.push(...await files(path));else if(/\.(?:mjs|js)$/.test(entry.name))result.push(path);}return result;}
for(const file of await files('.'))execFileSync(process.execPath,['--check',file],{stdio:'pipe'});
console.log('Sintaxe JavaScript verificada.');
