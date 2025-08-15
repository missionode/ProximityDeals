import { mountChrome, $, toast, openLightbox } from './ui.js';
import { store } from './store.js';
import { api } from './api.js';
import { updateAllProximity, sortByProximityThenDistance } from './proximity.js';
import { buildSignedCouponPayload } from './security.js';

function geolocate(){
  return new Promise((res)=> {
    if(!navigator.geolocation) return res(null);
    navigator.geolocation.getCurrentPosition(
      p => res({lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy}),
      () => res(null),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  });
}

let FEED = { filter: null, q: '', radius: 5000, pos: null };
let debounceT=null;

async function pageIndex(){
  mountChrome('feed');
  updateAllProximity();
  FEED.pos = await geolocate();
  const list = api.coupons.listActive();
  list.forEach((c,i)=> { if(!('lat' in c)){ c.lat = 8.52 + 0.02*i; c.lng = 76.94 + 0.01*i; } });
  bindSearchUI();
  renderFeed(list);
}

function bindSearchUI(){
  const q = $('#q');
  const radius = $('#radius');
  q.value = FEED.q;
  radius.value = String(FEED.radius);
  q.addEventListener('input', ()=>{
    clearTimeout(debounceT);
    debounceT = setTimeout(()=>{ FEED.q = q.value.trim().toLowerCase(); renderFeed(); }, 200);
  });
  radius.addEventListener('change', ()=>{ FEED.radius = Number(radius.value); renderFeed(); });
  document.querySelectorAll('[data-filter]').forEach(b=>{
    b.addEventListener('click', ()=>{
      FEED.filter = b.getAttribute('data-filter');
      renderFeed();
    });
  });
  document.querySelector('[data-reset]').addEventListener('click', ()=>{
    FEED = { filter: null, q: '', radius: 5000, pos: FEED.pos };
    q.value=''; radius.value='5000';
    renderFeed();
  });
}

function renderFeed(seed){
  const wrap = $('#feed');
  const all = seed || api.coupons.listActive();
  let items = all.slice();
  if(FEED.q){
    const q = FEED.q;
    items = items.filter(c=> (c.title+c.description).toLowerCase().includes(q));
  }
  if(FEED.pos && FEED.radius>0){
    items = items.filter(c=> {
      if(!(c.lat&&c.lng)) return true;
      return dist(FEED.pos.lat,FEED.pos.lng,c.lat,c.lng) <= FEED.radius;
    });
  }
  if(FEED.filter==='new'){
    items.sort((a,b)=> (b.createdAt??0)-(a.createdAt??0));
  }else if(FEED.filter==='trending'){
    items.sort((a,b)=> {
      const ra = recentRedemptionsCount(a.id,7);
      const rb = recentRedemptionsCount(b.id,7);
      if(rb!==ra) return rb-ra;
      return (b.createdAt??0)-(a.createdAt??0);
    });
  }else{
    items = sortByProximityThenDistance(items, FEED.pos||{lat:8.52,lng:76.94});
  }
  wrap.innerHTML = items.map(renderCouponCard).join('') || emptyState();
  document.querySelectorAll('[data-flag]').forEach(btn=>{
    btn.addEventListener('click', e=>{
      api.flags.add(e.currentTarget.dataset.flag, 'OTHER');
      toast('Flag submitted');
      renderFeed();
    });
  });
  document.querySelectorAll('[data-qr]').forEach(async img=>{
    img.addEventListener('click', async e=>{
      const id = e.currentTarget.getAttribute('data-qr');
      const payload = await buildSignedCouponPayload(id);
      const json = JSON.stringify(payload);
      const big = `https://api.qrserver.com/v1/create-qr-code/?size=480x480&data=${encodeURIComponent(json)}`;
      const html = `
        <div class="space-y-3" role="dialog" aria-modal="true">
          <img src="${big}" class="w-[80vw] max-w-[520px] h-auto rounded-xl mx-auto" alt="Coupon QR"/>
          <div class="flex gap-2 justify-center">
            <a href="scan.html" class="btn-primary">Open Scanner</a>
            <button id="pd_copy_qr" class="btn-ghost">Copy Payload</button>
          </div>
          <textarea id="pd_payload" class="input w-full" rows="3" readonly>${json}</textarea>
        </div>`;
      openLightbox(html);
      setTimeout(()=>{
        const btn = document.getElementById('pd_copy_qr');
        btn?.addEventListener('click', async ()=>{
          try{ await navigator.clipboard.writeText(json); toast('Payload copied'); }catch{ toast('Copy failed', false); }
        });
      },0);
    });
  });
}

function renderCouponCard(c){
  const uses = c.uses ?? 0;
  const expiry = c.type==='OFFER' ? `<span class="badge">Expires: ${new Date(c.expiryAt).toLocaleDateString()}</span>` : `<span class="badge">No expiry</span>`;
  const limit = c.type==='OFFER' ? `<span class="badge">Uses: ${uses}/${c.maxUses}</span>` : `<span class="badge">Unlimited</span>`;
  const type = c.type==='OFFER' ? 'Offer' : 'Service';
  const thumb = `data-qr="${c.id}"`;
  return `
  <article class="card">
    <div class="flex items-start justify-between gap-4">
      <div class="flex-1">
        <h3 class="text-lg font-semibold">${c.title} <span class="badge">${type}</span></h3>
        <p class="text-sm text-slate-600 dark:text-slate-300 mt-1">${c.description}</p>
        <div class="mt-2 flex flex-wrap gap-2">${expiry}${limit}</div>
        <div class="mt-3 flex gap-2">
          <a class="btn-ghost" href="create.html?id=${c.id}">Edit</a>
          <button class="btn-ghost" data-flag="${c.id}">Flag</button>
          <a class="btn-primary" href="scan.html">Redeem</a>
        </div>
      </div>
      <div class="shrink-0 grid place-items-center">
        <img ${thumb} class="w-24 h-24 rounded-xl shadow cursor-pointer" alt="QR"/>
        <span class="text-xs text-slate-500 dark:text-slate-400 mt-1">Tap to enlarge</span>
      </div>
    </div>
  </article>`;
}

function emptyState(){
  return `<div class="card text-center">
    <p class="text-slate-600 dark:text-slate-300">No coupons yet. Create your first one.</p>
    <a href="create.html" class="btn-primary mt-3">Create Coupon</a>
  </div>`;
}

async function pageCreate(){
  mountChrome('create');
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  if(id){
    const c = JSON.parse(JSON.stringify((await import('./api.js')).api.coupons.byId(id)));
    if(!c) return;
    const f = document.getElementById('couponForm');
    f.type.value = c.type;
    f.title.value = c.title;
    f.description.value = c.description;
    if(c.type==='OFFER'){
      document.getElementById('offerFields').classList.remove('hidden');
      f.expiryAt.valueAsDate = new Date(c.expiryAt);
      f.maxUses.value = c.maxUses;
    }
    document.getElementById('deleteBtn').classList.remove('hidden');
    document.getElementById('deleteBtn').addEventListener('click', ()=>{
      api.coupons.remove(id); location.href='index.html';
    });
    f.addEventListener('submit', e=>{
      e.preventDefault();
      const data = Object.fromEntries(new FormData(f).entries());
      const patch = { title: data.title, description: data.description };
      if(data.type==='OFFER'){
        patch.expiryAt = data.expiryAt;
        patch.maxUses = Number(data.maxUses||1);
      }
      api.coupons.update(id, patch);
      location.href='index.html';
    });
  }else{
    document.getElementById('deleteBtn').remove();
    const f = document.getElementById('couponForm');
    f.addEventListener('submit', e=>{
      e.preventDefault();
      const data = Object.fromEntries(new FormData(f).entries());
      api.coupons.create(data);
      location.href='index.html';
    });
  }
  document.getElementById('type').addEventListener('change', (e)=>{
    const v = e.target.value;
    document.getElementById('offerFields').classList.toggle('hidden', v!=='OFFER');
  });
}

async function pageProfile(){
  mountChrome('profile');
  const me = store.me;
  const prox = me.proximity ?? 0;
  document.getElementById('meName').textContent = me.name || 'You';
  document.getElementById('meProx').textContent = prox.toFixed(2);
  const days = 14;
  const labels = [];
  const values = [];
  for(let i=days-1;i>=0;i--){
    const d = new Date(Date.now()-i*86400000);
    const count = store.redemptions.filter(r=>{
      const cr = store.coupons.find(c=> c.id===r.couponId)?.creatorId===me.id;
      const rd = new Date(r.redeemedAt);
      return cr && rd.toDateString()===d.toDateString();
    }).length;
    labels.push(d); values.push(count);
  }
  const w=300,h=60,max=Math.max(1,...values),pts=values.map((v,i)=>`${(i/(values.length-1))*w},${h-(v/max)*h}`).join(' ');
  document.getElementById('breakdown').innerHTML = `
    <div class="badge">Referrals: ${store.referrals.filter(r=> r.inviterId===me.id).length}</div>
    <div class="badge">Coupons: ${store.coupons.filter(c=> c.creatorId===me.id).length}</div>
    <div class="badge">Redemptions (7d): ${store.redemptions.filter(r=> Date.now()-r.redeemedAt < 7*86400000 && store.coupons.find(c=> c.id===r.couponId)?.creatorId===me.id).length}</div>
    <div class="mt-3">
      <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <polyline fill="none" stroke="currentColor" stroke-width="2" points="${pts}"></polyline>
      </svg>
      <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">Last 14 days</div>
    </div>
  `;
}

async function pagePreferences(){
  mountChrome('prefs');
  const backupBtn = document.getElementById('backupBtn');
  const importInput = document.getElementById('importInput');
  const autoToggle = document.getElementById('autoToggle');
  const forgetBtn = document.getElementById('forgetBtn');
  const filenameInput = document.getElementById('filename');
  backupBtn.addEventListener('click', ()=>{
    const name = filenameInput.value || 'proximity-deals-backup.json';
    store.export(name);
  });
  importInput.addEventListener('change', async (e)=>{
    const file = e.target.files[0];
    if(!file) return;
    try { await store.import(file); location.reload(); }
    catch { alert('Invalid JSON'); }
  });
  autoToggle.addEventListener('change', ()=>{
    if(autoToggle.checked){
      const name = filenameInput.value || 'proximity-deals-auto.json';
      store.enableAutosave(name, 60000);
    } else store.disableAutosave();
  });
  forgetBtn.addEventListener('click', ()=> { store.forgetBackup(); alert('Backup forgotten.'); });
  setInterval(()=> store.runAutosaveTick(), 15000);
}

async function pageHelp(){ mountChrome('help'); }
async function pageScan(){ mountChrome('scan'); }
async function pageAuth(){ mountChrome(); }

function dist(lat1,lon1,lat2,lon2){
  const R=6371e3; const toRad=x=>x*Math.PI/180;
  const dphi = toRad(lat2-lat1), dl = toRad(lon2-lon1);
  const a = Math.sin(dphi/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dl/2)**2;
  return 2*R*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function recentRedemptionsCount(couponId, days){
  const start = Date.now()-days*86400000;
  return store.redemptions.filter(r=> r.couponId===couponId && r.redeemedAt>=start).length;
}

const routes = {
  'index.html': pageIndex,
  '': pageIndex,
  'create.html': pageCreate,
  'profile.html': pageProfile,
  'preferences.html': pagePreferences,
  'help.html': pageHelp,
  'scan.html': pageScan,
  'auth.html': pageAuth
};
const page = location.pathname.split('/').pop();
(routes[page]||routes[''])();
