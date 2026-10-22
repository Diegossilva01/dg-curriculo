// Only order facts checked by the existing authenticated reconciliation route are eligible.
export function purchaseReceipt(order,env=process.env){
 if(order.status!=='approved'||order.mode!=='production'||env.MP_MODE!=='production')return null;
 if(env.VERCEL_ENV&&env.VERCEL_ENV!=='production')return null;
 if(!/^[a-f\d-]{36}$/i.test(order.id||'')||!Number.isSafeInteger(Number(order.price_cents))||Number(order.price_cents)<=0||order.currency!=='BRL')return null;
 return {transaction_id:order.id,value:Number(order.price_cents)/100,currency:'BRL'};
}
export function measurementConfig(env=process.env){
 const id=/^GTM-[A-Z0-9]{4,30}$/.test(env.GTM_CONTAINER_ID||'')?env.GTM_CONTAINER_ID:null;
 const production=env.VERCEL_ENV==='production'||(!env.VERCEL_ENV&&env.NODE_ENV==='production');
 const adsId=/^AW-\d{5,20}$/.test(env.GOOGLE_ADS_TAG_ID||'AW-17755074618')?(env.GOOGLE_ADS_TAG_ID||'AW-17755074618'):null;
 const label=env.GOOGLE_ADS_CONVERSION_LABEL??(adsId==='AW-17755074618'?'1hIfCN_umqUdELrgo5JC':'');
 const adsConversionLabel=/^[A-Za-z0-9_-]{5,100}$/.test(label)?label:null;
 return {enabled:env.MEASUREMENT_ENABLED!=='false'&&!!(id||adsId)&&(production||env.MEASUREMENT_ALLOW_NONPRODUCTION==='true'),gtmId:id,adsId:id?null:adsId,adsConversionLabel:id?null:adsConversionLabel};
}
