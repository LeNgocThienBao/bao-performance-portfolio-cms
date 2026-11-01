(async()=>{
 const set=(id,value)=>{const el=document.getElementById(id);if(el&&typeof value==='string')el.textContent=value};
 try{const r=await fetch('/api/content');if(!r.ok)return;const d=await r.json();
  set('brandName',d.name);set('footerName',d.name);set('heroKicker',d.heroKicker);set('heroLead',d.heroLead);set('jobTitle',d.jobTitle);set('experienceMeta',d.experienceMeta);set('locationMeta',d.locationMeta);
  (d.projects||[]).forEach((p,i)=>{set(`project${i+1}Title`,p.title);set(`project${i+1}Desc`,p.description);set(`project${i+1}Meta`,p.meta||'')});
 }catch(e){/* Keep static content visible if the CMS is temporarily unavailable. */}
})();