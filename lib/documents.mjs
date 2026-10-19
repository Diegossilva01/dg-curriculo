import {admin,dbError} from './supabase.mjs';
import {HttpError} from './config.mjs';
export const validUUID=id=>/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(id||'');
export async function loadOwnedResume(user,id){if(!validUUID(id))throw new HttpError(400,'Identificador do currículo salvo inválido.');const {data,error}=await admin().from('resumes').select('*').eq('id',id).eq('user_id',user.id).maybeSingle();dbError(error);if(!data||data.user_id!==user.id)throw new HttpError(404,'Currículo não encontrado.');return data;}
