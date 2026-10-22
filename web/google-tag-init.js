(function(root){
'use strict';
let config;try{config=JSON.parse(document.getElementById('measurement-config').textContent);}catch{return;}
if(!config.enabled||config.gtmId||!/^AW-\d{5,20}$/.test(config.adsId||''))return;
root.dataLayer=root.dataLayer||[];
root.gtag=function(){root.dataLayer.push(arguments);};
root.gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
try{const saved=JSON.parse(localStorage.getItem('trajetoria.measurement-consent.v1')||'null');if(saved)root.gtag('consent','update',{analytics_storage:saved.analytics===true?'granted':'denied',ad_storage:saved.ads===true?'granted':'denied',ad_user_data:saved.ads===true?'granted':'denied',ad_personalization:'denied'});}catch{}
root.gtag('js',new Date());
const path=location.pathname;
const cleanPath=path.startsWith('/pagamento')?'/pagamento/':path.startsWith('/auth')?'/auth/':path.startsWith('/editor')?'/editor/':path.startsWith('/meus-curriculos')?'/meus-curriculos/':path;
root.gtag('set',{page_location:location.origin+cleanPath,page_referrer:'',page_title:'Capricha CV',ads_data_redaction:true});
root.gtag('config',config.adsId,{allow_enhanced_conversions:false,allow_ad_personalization_signals:false});
})(typeof window!=='undefined'?window:globalThis);
