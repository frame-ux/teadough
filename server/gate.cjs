const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.join(__dirname,'content');
const cookieName='__Host-teadoough';
const ttl=7*24*60*60;
const attempts=new Map();
function equal(a,b){return crypto.timingSafeEqual(crypto.createHash('sha256').update(a).digest(),crypto.createHash('sha256').update(b).digest())}
function sign(value){return crypto.createHmac('sha256',process.env.SITE_SESSION_SECRET).update(value).digest('hex')}
function authenticated(req){
  const cookies=(req.headers.cookie||'').split(';').map(x=>x.trim());
  const value=cookies.find(x=>x.startsWith(cookieName+'='))?.slice(cookieName.length+1)||'';
  const [expires,signature]=value.split('.');
  return !!signature&&/^\d+$/.test(expires)&&Number(expires)>Date.now()&&Number(expires)<=Date.now()+ttl*1000+60000&&equal(signature,sign(expires));
}
function escape(s){return s.replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]))}
function nextPath(value){return typeof value==='string'&&value.startsWith('/')&&!value.startsWith('//')&&!/[\\\r\n]/.test(value)?value:'/'}
function login(res,next,error=''){
 res.setHeader('Content-Type','text/html; charset=utf-8');
 res.end(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Teadoough — Open the archive</title><style>*{box-sizing:border-box}body{margin:0;min-height:100svh;display:grid;place-items:center;background:#fffefa;color:#353333;font:14px Arial,sans-serif;padding:30px}main{width:100%;max-width:350px}h1{font-size:48px;letter-spacing:-3px;margin:0 0 35px;font-weight:900}h2{font:italic 30px Georgia,serif;margin:0 0 15px;line-height:1.15}p{line-height:1.65;color:#777268;font-size:13px;margin:0 0 30px}label{display:block;font-size:11px;margin-bottom:10px}input{display:block;width:100%;border:1px solid #35333340;background:#fffefa;color:#353333;padding:15px;border-radius:0;font:16px Arial}button{width:100%;border:0;background:#353333;color:#fffefa;padding:16px;margin-top:12px;font:12px Arial;cursor:pointer}input:focus,button:focus-visible{outline:2px solid #ec008c;outline-offset:4px}.error{color:#b52154;font-size:12px;margin:15px 0}.sprinkle{position:fixed;width:6px;height:28px;border-radius:6px;transform:rotate(30deg);background:#ec008c;left:12%;top:15%}.sprinkle:nth-of-type(2){left:auto;right:12%;top:26%;background:#0fb4d0;transform:rotate(-40deg)}.sprinkle:nth-of-type(3){top:auto;bottom:12%;left:22%;background:#ffd500;transform:rotate(-30deg)}small{display:block;margin-top:30px;color:#8c877e;font-size:10px}</style><body><i class="sprinkle" aria-hidden="true"></i><i class="sprinkle" aria-hidden="true"></i><i class="sprinkle" aria-hidden="true"></i><main><h1>teadoough</h1><h2>A little sprinkle<br>of the past.</h2><p>Enter the password to open the archive.</p><form action="/unlock" method="post"><input type="hidden" name="next" value="${escape(nextPath(next))}"><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" required maxlength="200" autofocus>${error?`<p class="error" role="alert">${escape(error)}</p>`:''}<button type="submit">Open the archive →</button></form><small>Doughnuts and Tea · Since 1803</small></main></body></html>`);
}
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');res.setHeader('Vary','Cookie');res.setHeader('X-Robots-Tag','noindex, nofollow');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');
 if(!process.env.SITE_PASSWORD||!process.env.SITE_SESSION_SECRET){res.statusCode=503;return res.end('The archive is temporarily closed.');}
 let url;try{url=new URL(req.url,'https://'+(req.headers.host||'localhost'));}catch{res.statusCode=400;return res.end('Invalid request');}
 if(req.method==='POST'){
  let origin;try{origin=new URL(req.headers.origin||'');}catch{res.statusCode=403;return res.end('Please submit the form from this site.');}
  if(origin.host!==req.headers.host){res.statusCode=403;return res.end('Please submit the form from this site.');}
  if(url.pathname==='/logout'){res.setHeader('Set-Cookie',`${cookieName}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);res.statusCode=303;res.setHeader('Location','/');return res.end();}
  if(url.pathname!=='/unlock'){res.statusCode=405;return res.end('Method not allowed');}
  const ip=(req.headers['x-forwarded-for']||'unknown').split(',')[0];const now=Date.now();
  if(attempts.size>5000)attempts.clear();let rate=attempts.get(ip);if(!rate||now-rate.since>15*60000)rate={since:now,count:0};
  if(rate.count>=10){res.statusCode=429;res.setHeader('Retry-After','900');return login(res,'/','Too many attempts. Please try again later.');}
  let body='';try{for await(const chunk of req){body+=chunk.toString();if(body.length>2048){res.statusCode=413;return res.end('Request too large');}}}catch{res.statusCode=400;return res.end('Invalid request');}
  const form=new URLSearchParams(body);
  if(!equal(form.get('password')||'',process.env.SITE_PASSWORD)){rate.count++;attempts.set(ip,rate);res.statusCode=401;return login(res,form.get('next')||'/','That password didn’t match. Try again.');}
  attempts.delete(ip);const expires=String(Date.now()+ttl*1000);res.setHeader('Set-Cookie',`${cookieName}=${expires}.${sign(expires)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${ttl}`);res.statusCode=303;res.setHeader('Location',nextPath(form.get('next')));return res.end();
 }
 if(!['GET','HEAD'].includes(req.method)){res.statusCode=405;return res.end('Method not allowed');}
 if(!authenticated(req)){
   res.statusCode=401;
   if(req.method==='HEAD')return res.end();
   if(path.extname(url.pathname)&&url.pathname!=='/index.html'){res.setHeader('Content-Type','text/plain');return res.end('Password required');}
   return login(res,url.pathname+url.search);
 }
 let pathname;try{pathname=decodeURIComponent(url.pathname);}catch{res.statusCode=400;return res.end('Invalid path');}
 const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root+path.sep)){res.statusCode=404;return res.end('Not found');}
 let stat;try{stat=await fs.promises.stat(file);if(!stat.isFile())throw new Error();}catch{res.statusCode=404;return res.end('Not found');}
 const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.mp4':'video/mp4','.svg':'image/svg+xml'};
 res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.setHeader('Accept-Ranges','bytes');
 let start=0,end=stat.size-1;
 if(req.headers.range){
   const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
   if(match&&(match[1]||match[2])){
     if(!match[1])start=Math.max(0,stat.size-Number(match[2]));else{start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}
     if(start>end||start>=stat.size){res.statusCode=416;res.setHeader('Content-Range',`bytes */${stat.size}`);return res.end();}
     res.statusCode=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${stat.size}`);
   }else{res.statusCode=416;return res.end();}
 }
 res.setHeader('Content-Length',end-start+1);if(req.method==='HEAD')return res.end();
 fs.createReadStream(file,{start,end}).on('error',()=>{if(!res.headersSent)res.statusCode=500;res.end();}).pipe(res);
};
