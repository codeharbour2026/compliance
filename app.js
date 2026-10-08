const sb=supabase.createClient(CRM_CONFIG.url,CRM_CONFIG.anonKey);
const $=s=>document.querySelector(s);
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'$'+Number(n||0).toLocaleString('en-AU');
const fdate=d=>d?new Date(String(d).slice(0,10)+'T00:00:00').toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'}):'';
const today=()=>new Date().toISOString().slice(0,10);
function toast(m){let t=$('#toast');if(!t){t=document.createElement('div');t.id='toast';document.body.append(t)}t.textContent=m;t.hidden=false;setTimeout(()=>t.hidden=true,4000)}

const NAV=[
['Dashboard',[['index.html','Home'],['soon.html?p=Reports','Reports',1]]],
['Sales',[['leads.html','Leads'],['contacts.html','Contacts'],['soon.html?p=Companies','Companies',1],['pipeline.html','Deals'],['soon.html?p=Quotes','Quotes',1],['soon.html?p=Orders','Orders',1]]],
['Support',[['tickets.html','Tickets'],['soon.html?p=Knowledge+Base','Knowledge Base',1]]],
['Marketing',[['soon.html?p=Campaigns','Campaigns',1],['soon.html?p=Forms','Forms',1]]],
['Operations',[['tasks.html','Tasks'],['soon.html?p=Calendar','Calendar',1],['soon.html?p=Documents','Documents',1],['activity.html','Activity log']]],
['Administration',[['soon.html?p=Users','Users',1],['soon.html?p=Teams','Teams',1],['soon.html?p=Permissions','Permissions',1],['soon.html?p=Audit+Logs','Audit Logs',1],['soon.html?p=Settings','Settings',1]]]];

async function start(){
  const cur=(location.pathname.split('/').pop()||'index.html')+location.search;
  $('#nav').innerHTML='<b>CRM</b>'+NAV.map(([g,items])=>`<h4>${g}</h4>`+items.map(([h,l,soon])=>`<a href="${h}" class="${h===cur?'on':''}${soon?' soon':''}">${l}</a>`).join('')).join('');
  return{};
}

function formDialog(cfg,row,refs,done){
  const d=document.createElement('dialog'),r=row||{...cfg.defaults};
  const fs=cfg.fields.filter(f=>!f.ro);
  d.innerHTML=`<form method="dialog"><h2>${row?'Edit':'New'} ${cfg.singular}</h2>`+fs.map(f=>{
    const v=r[f.k]??'';let i;
    if(f.type==='textarea')i=`<textarea name="${f.k}" rows="3">${esc(v)}</textarea>`;
    else if(f.options||f.ref){const o=f.ref?refs[f.k].map(x=>[x.id,x[f.refLabel]]):f.options.map(x=>[x,x]);i=`<select name="${f.k}">${f.ref?'<option value="">None</option>':''}${o.map(([a,b])=>`<option value="${esc(a)}"${a==v?' selected':''}>${esc(b)}</option>`).join('')}</select>`}
    else if(f.type==='checkbox')i=`<input type="checkbox" name="${f.k}"${v?' checked':''}>`;
    else i=`<input name="${f.k}" type="${f.type||'text'}" value="${esc(v)}"${f.req?' required':''}>`;
    return`<label>${f.label}${i}</label>`}).join('')+`<div class="row"><button class="btn" value="save">Save</button><button class="btn ghost" value="cancel" formnovalidate>Cancel</button>${row?'<button class="btn danger" value="del" formnovalidate>Delete</button>':''}</div></form>`;
  document.body.append(d);d.showModal();
  d.onclose=async()=>{
    const act=d.returnValue,fm=new FormData(d.querySelector('form'));d.remove();
    if(act==='del'){if(!confirm('Delete this '+cfg.singular+'? This cannot be undone.'))return;const{error}=await sb.from(cfg.table).delete().eq('id',row.id);if(error)toast(error.message);return done()}
    if(act!=='save')return;
    const o={};
    fs.forEach(f=>{let v=fm.get(f.k);if(f.type==='checkbox')v=v==='on';else if(v===''||v===null)v=null;else if(f.type==='number')v=Number(v);o[f.k]=v});
    const{error}=row?await sb.from(cfg.table).update(o).eq('id',row.id):await sb.from(cfg.table).insert(o);
    if(error)toast(error.message);done();
  };
}
async function loadRefs(cfg){const refs={};for(const f of cfg.fields)if(f.ref){const{data}=await sb.from(f.ref).select('id,'+f.refLabel).order(f.refLabel);refs[f.k]=data||[]}return refs}

async function resource(cfg){
  const refs=await loadRefs(cfg);let rows=[];
  $('#main').innerHTML=`<div class="top"><h1>${cfg.title}</h1><button class="btn" id="new">New ${cfg.singular}</button></div><div class="tools"><input id="q" type="search" placeholder="Search" aria-label="Search"></div><div class="table"><table><thead><tr>${cfg.cols.map(c=>`<th>${cfg.fields.find(f=>f.k===c).label}</th>`).join('')}</tr></thead><tbody id="rows"></tbody></table></div>`;
  const cell=(r,k)=>{const f=cfg.fields.find(f=>f.k===k),v=r[k];
    if(f.ref)return esc((refs[k].find(x=>x.id===v)||{})[f.refLabel]||'');
    if(f.type==='checkbox')return v?'✓':'';
    if(f.money)return money(v);if(f.type==='date')return fdate(v);
    if(f.badge&&v)return`<span class="tag" data-v="${esc(v)}">${esc(v)}</span>`;return esc(v)};
  const draw=()=>{const q=$('#q').value.toLowerCase();
    $('#rows').innerHTML=rows.filter(r=>!q||cfg.cols.map(k=>cell(r,k)).join(' ').toLowerCase().includes(q)).map(r=>`<tr data-id="${r.id}" tabindex="0">${cfg.cols.map(k=>`<td>${cell(r,k)}</td>`).join('')}</tr>`).join('')||`<tr><td colspan="${cfg.cols.length}" class="mute">Nothing here yet.</td></tr>`};
  const load=async()=>{let q=sb.from(cfg.table).select('*').order(cfg.order||'created_at',{ascending:!!cfg.asc});
    for(const k in cfg.where||{})q=q.eq(k,cfg.where[k]);
    const{data,error}=await q;if(error)toast(error.message);rows=data||[];draw()};
  $('#q').oninput=draw;$('#new').onclick=()=>formDialog(cfg,null,refs,load);
  const open=e=>{const tr=e.target.closest('tr[data-id]');if(tr)formDialog(cfg,rows.find(r=>r.id==tr.dataset.id),refs,load)};
  $('#rows').onclick=open;$('#rows').onkeydown=e=>e.key==='Enter'&&open(e);
  load();
}

const CONTACT_FIELDS=[
  {k:'name',label:'Name',req:1},{k:'email',label:'Email',type:'email'},{k:'phone',label:'Phone',type:'tel'},{k:'company',label:'Company'},
  {k:'status',label:'Status',options:['Lead','Active','Inactive'],badge:1},
  {k:'lead_stage',label:'Lead stage',options:['New','Contacted','Qualified','Lost','Won'],badge:1},
  {k:'source',label:'Lead source',options:['Website','Referral','Social media','Cold call','Other']},
  {k:'past_orders',label:'Past orders'},{k:'total_spent',label:'Total spent ($)',type:'number',money:1},
  {k:'last_contact',label:'Last contact',type:'date'},{k:'notes',label:'Notes',type:'textarea'}];
