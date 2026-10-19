import {HttpError} from './config.mjs';
function envKeys(){const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_PUBLISHABLE_KEY;if(!url||!key)throw new HttpError(503,'Supabase ainda não configurado.');return {url:url.replace(/\/$/,''),key};}
// Thin PostgREST transport. No passwords or auth sessions are stored by this server.
class Query {
 constructor(db,table){this.db=db;this.table=table;this.method='GET';this.params=new URLSearchParams();this.headers={};}
 select(columns='*'){this.params.set('select',columns);this.headers.Prefer='return=representation';return this;}
 eq(column,value){this.params.set(column,'eq.'+value);return this;}
 order(column,{ascending=true}={}){this.params.set('order',column+'.'+(ascending?'asc':'desc'));return this;}
 limit(n){this.params.set('limit',String(n));return this;}
 insert(body){this.method='POST';this.body=body;return this;}
 update(body){this.method='PATCH';this.body=body;return this;}
 delete(){this.method='DELETE';return this;}
 single(){this.one=true;return this;}
 maybeSingle(){this.one=true;this.optional=true;return this;}
 then(resolve,reject){return this.execute().then(resolve,reject);}
 async execute(){const result=await this.db.request('/rest/v1/'+this.table+'?'+this.params,{method:this.method,body:this.body,headers:this.headers});if(!result.error&&this.one){if(result.data?.length===1)result.data=result.data[0];else if(this.optional&&!result.data?.length)result.data=null;else result.error={code:'ROW_COUNT',message:'Unexpected number of rows'};}return result;}
}
export function database(key,token=key){const {url}=envKeys();return {from:table=>new Query(database(key,token),table),async request(path,{method='GET',body,headers={}}={}){const res=await fetch(url+path,{method,headers:{apikey:key,Authorization:'Bearer '+token,'Content-Type':'application/json',...headers},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(12000)});const raw=await res.text();let parsed;try{parsed=raw?JSON.parse(raw):null;}catch{parsed=null;}return res.ok?{data:parsed,error:null}:{data:null,error:{code:parsed?.code||String(res.status),message:parsed?.message||'Database request failed'}};},rpc(name,body){return this.request('/rest/v1/rpc/'+name,{method:'POST',body});}};}
export function admin(){envKeys();const key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!key)throw new HttpError(503,'Banco de dados ainda não configurado.');return database(key);}
export async function authenticate(req){const authorization=req.headers.authorization;if(!/^Bearer [^ ]+$/.test(authorization||''))throw new HttpError(401,'Entre na sua conta.');const {url,key}=envKeys();const response=await fetch(url+'/auth/v1/user',{headers:{apikey:key,Authorization:authorization},signal:AbortSignal.timeout(10000)});if(!response.ok)throw new HttpError(401,'Sessão expirada. Entre novamente.');const user=await response.json();if(!user.id)throw new HttpError(401,'Sessão inválida.');return {user,db:database(key,authorization.slice(7)),token:authorization.slice(7)};}
export function dbError(error){if(!error)return;if(error.message?.includes('REVISION_CONFLICT'))throw new HttpError(409,'O currículo foi alterado em outra sessão. Abra a versão da conta antes de substituir.');if(error.message?.includes('QUOTA_EXCEEDED'))throw new HttpError(403,'A quantidade de currículos desta compra foi atingida.');if(error.message?.includes('ACCESS_DENIED')||error.code==='42501')throw new HttpError(403,'Compra válida necessária para este recurso.');throw new HttpError(500,'Não foi possível concluir a operação no banco.');}
export async function requireRight(userId,documentKey,capability,{allocate=false}={}){if(!/^[\w-]{1,128}$/.test(documentKey||''))throw new HttpError(400,'Identificador de currículo inválido.');const {data,error}=await admin().rpc('require_specific_document_access',{p_user:userId,p_key:documentKey,p_capability:capability,p_allocate:allocate,p_mode:process.env.MP_MODE||'test'});dbError(error);if(!data)throw new HttpError(403,'Compra válida necessária.');return data;}
