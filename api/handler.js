// Vercel Node function entry; dynamic imports keep local/build usable without Chromium installed.
module.exports=async function handler(req,res){const {handle}=await import('../lib/api.mjs');return handle(req,res);};
