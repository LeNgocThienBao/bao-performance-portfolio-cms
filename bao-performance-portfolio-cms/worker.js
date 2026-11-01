const DEFAULT_CONTENT = {
  name: "Bảo Lê",
  heroKicker: "Performance Marketing · Creative Production",
  heroLead: "Digital Marketing Specialist tại DONG TAY LAND, tập trung vào Performance Marketing trong lĩnh vực bất động sản. Công việc bao gồm triển khai và tối ưu quảng cáo đa kênh, theo dõi chất lượng lead, phân tích hiệu quả chiến dịch và phối hợp sản xuất nội dung quảng cáo.",
  jobTitle: "Digital Marketing Specialist",
  experienceMeta: "DONG TAY LAND · 06/2024 — Present",
  locationMeta: "Vietnam · Real Estate",
  projects: [
    { title: "Performance Marketing", description: "Triển khai và theo dõi chiến dịch quảng cáo bất động sản trên Meta Ads, Google Ads, TikTok Ads, Microsoft Ads và các nền tảng phù hợp. Case study và số liệu sẽ được bổ sung khi có dữ liệu được phép công khai." },
    { title: "Campaign Optimization", description: "Theo dõi CPM, CPC, CTR, chi phí lead và chất lượng lead; phân tích tín hiệu theo dự án, nhóm quảng cáo và nội dung để đề xuất hướng tối ưu. Không công bố số liệu nội bộ khi chưa được phép." },
    { title: "Creative Production", description: "Hỗ trợ sản xuất nội dung quảng cáo, bao gồm quay và dựng video ngắn, biên tập nội dung và điều chỉnh định dạng cho các nền tảng digital." },
    { title: "Advertising Design", description: "Thiết kế và điều chỉnh banner, poster và ấn phẩm quảng cáo bằng Photoshop, Illustrator, After Effects và Canva." }
  ]
};
const enc = new TextEncoder();
function b64url(bytes){return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_')}
async function sign(value,secret){const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return b64url(await crypto.subtle.sign('HMAC',key,enc.encode(value)))}
async function validSession(req,env){
 const cookie=req.headers.get('Cookie')||'',m=cookie.match(/(?:^|; )bao_portfolio_session_v2=([^;]+)/);if(!m||!env.SESSION_SECRET)return false;
 const [exp,sig]=m[1].split('.');if(!exp||!sig||Number(exp)<Date.now())return false;
 return (await sign(exp,env.SESSION_SECRET))===sig;
}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}})}
async function getContent(env){
 try{const row=await env.DB.prepare('SELECT content FROM bao_portfolio_content_v2 WHERE id=1').first();if(row?.content)return JSON.parse(row.content)}catch(e){}
 return DEFAULT_CONTENT;
}
async function api(req,env,url){
 if(url.pathname==='/api/content'&&req.method==='GET')return json(await getContent(env));
 if(url.pathname==='/api/login'&&req.method==='POST'){
  if(!env.ADMIN_PASSWORD||!env.SESSION_SECRET)return json({error:'Admin secrets chưa được cấu hình trên Cloudflare.'},503);
  let body={};try{body=await req.json()}catch(e){}
  if(typeof body.password!=='string'||body.password!==env.ADMIN_PASSWORD)return json({error:'Mật khẩu không chính xác.'},401);
  const exp=String(Date.now()+8*60*60*1000),sig=await sign(exp,env.SESSION_SECRET);
  return new Response(JSON.stringify({ok:true}),{headers:{'content-type':'application/json','cache-control':'no-store','set-cookie':`bao_portfolio_session_v2=${exp}.${sig}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`}});
 }
 if(url.pathname==='/api/session'&&req.method==='GET')return json({authenticated:await validSession(req,env)});
 if(url.pathname==='/api/logout'&&req.method==='POST')return new Response('',{status:204,headers:{'set-cookie':'bao_portfolio_session_v2=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'}});
 if(url.pathname==='/api/content'&&req.method==='PUT'){
  if(!(await validSession(req,env)))return json({error:'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'},401);
  const origin=req.headers.get('Origin');if(origin&&origin!==url.origin)return json({error:'Origin không hợp lệ.'},403);
  let data;try{data=await req.json()}catch(e){return json({error:'Dữ liệu JSON không hợp lệ.'},400)}
  if(!data||typeof data!=='object'||typeof data.name!=='string'||!Array.isArray(data.projects)||data.projects.length!==4)return json({error:'Cần có tên hiển thị và đúng 4 mục công việc.'},400);
  const clean={name:data.name.trim().slice(0,100),heroKicker:String(data.heroKicker||'').slice(0,180),heroLead:String(data.heroLead||'').slice(0,1000),jobTitle:String(data.jobTitle||'').slice(0,120),experienceMeta:String(data.experienceMeta||'').slice(0,180),locationMeta:String(data.locationMeta||'').slice(0,180),projects:data.projects.map(p=>({title:String(p.title||'').slice(0,180),description:String(p.description||'').slice(0,1000)}))};
  if(!clean.name)return json({error:'Tên hiển thị không được để trống.'},400);
  await env.DB.prepare('INSERT INTO bao_portfolio_content_v2 (id,content,updated_at) VALUES (1,?,CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET content=excluded.content,updated_at=CURRENT_TIMESTAMP').bind(JSON.stringify(clean)).run();
  return json({ok:true});
 }
 return json({error:'Not found'},404);
}
export default {async fetch(req,env){const url=new URL(req.url);if(url.pathname.startsWith('/api/'))return api(req,env,url);if(url.pathname==='/admin'||url.pathname==='/admin/')return env.ASSETS.fetch(new Request(new URL('/admin.html',url),req));return env.ASSETS.fetch(req)}};
