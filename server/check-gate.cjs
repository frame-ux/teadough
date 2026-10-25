const {Readable,Writable}=require('node:stream');
const assert=require('node:assert/strict');
process.env.SITE_PASSWORD='archive-test-password';process.env.SITE_SESSION_SECRET='test-secret-only-not-used-in-production';
const handler=require('../.vercel/output/functions/gate.func/index.js');
async function request(url,{method='GET',body='',headers={}}={}){
 const req=Readable.from(body?[Buffer.from(body)]:[]);req.url=url;req.method=method;req.headers={host:'archive.test',...headers};
 const chunks=[];const res=new Writable({write(chunk,encoding,done){chunks.push(chunk);done()}});res.statusCode=200;res.headers={};res.setHeader=(k,v)=>{res.headers[k.toLowerCase()]=v};
 const finished=new Promise((resolve,reject)=>{res.on('finish',resolve);res.on('error',reject)});await handler(req,res);await finished;return {status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks)};
}
(async()=>{
 let r=await request('/');assert.equal(r.status,401);assert.match(r.body.toString(),/Enter the password/);assert.doesNotMatch(r.body.toString(),/£10,000/);
 for(const url of ['/assets/teadough-film.mp4','/index.html','/style.css','/server/gate.cjs']){r=await request(url);assert.equal(r.status,401)}
 r=await request('/unlock',{method:'POST',body:'password=incorrect',headers:{origin:'https://archive.test'}});assert.equal(r.status,401);
 r=await request('/unlock',{method:'POST',body:'password=archive-test-password&next=%2F',headers:{origin:'https://other.test'}});assert.equal(r.status,403);
 r=await request('/unlock',{method:'POST',body:'password=archive-test-password&next=%2F',headers:{origin:'https://archive.test'}});assert.equal(r.status,303);assert.match(r.headers['set-cookie'],/HttpOnly; Secure; SameSite=Lax/);const cookie=r.headers['set-cookie'].split(';')[0];
 r=await request('/',{headers:{cookie}});assert.equal(r.status,200);assert.match(r.body.toString(),/£10,000/);assert.match(r.headers['cache-control'],/no-store/);
 r=await request('/assets/teadough-film.mp4',{headers:{cookie,range:'bytes=0-99'}});assert.equal(r.status,206);assert.equal(r.body.length,100);assert.match(r.headers['content-range'],/^bytes 0-99\/1071464$/);
 r=await request('/assets/teadough-film.mp4',{headers:{cookie,range:'bytes=999999999-'}});assert.equal(r.status,416);
 r=await request('/server/gate.cjs',{headers:{cookie}});assert.equal(r.status,404);
 r=await request('/logout',{method:'POST',headers:{cookie,origin:'https://archive.test'}});assert.equal(r.status,303);assert.match(r.headers['set-cookie'],/Max-Age=0/);
 console.log('PASS: password required for pages/media, wrong password, origin validation, secure session, authorized content, video byte ranges, invalid range, private code, logout.');
})().catch(e=>{console.error(e);process.exit(1)});
