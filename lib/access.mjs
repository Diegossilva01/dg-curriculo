import {admin,dbError,requireRight} from './supabase.mjs';
import {reconcile} from './payments.mjs';
import {HttpError} from './config.mjs';
// Re-fetches the payment before a protected operation, even if a webhook was missed.
export async function access(userId,key,capability,{allocate=true}={}){const grant=await requireRight(userId,key,capability,{allocate});const db=admin();const {data:entitlement,error}=await db.from('entitlements').select('order_id').eq('id',grant).eq('user_id',userId).single();dbError(error);const {data:payments,error:paymentError}=await db.from('payment_records').select('payment_id').eq('order_id',entitlement.order_id).eq('status','approved').limit(10);dbError(paymentError);if(!payments?.length)throw new HttpError(403,'Pagamento ainda não confirmado.');for(const payment of payments)await reconcile(payment.payment_id);await requireRight(userId,key,capability,{allocate:false});return grant;}
