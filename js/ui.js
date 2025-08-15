export function $(sel, root=document){ return root.querySelector(sel); }
export function $all(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }
export function setThemeFromPref(){
  const pref = localStorage.getItem('pd_theme') || 'light';
  document.documentElement.classList.toggle('dark', pref==='dark');
}
export function toggleTheme(){
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('pd_theme', isDark ? 'dark' : 'light');
}
export function nav(active=''){
  return `
  <header class="site-header">
    <div class="mx-auto max-w-6xl px-4 py-3 md:py-4 flex items-center justify-between">
      <a href="index.html" class="flex items-center gap-3">
        <img src="assets/logos/logoipsum-396.svg" alt="mark" class="h-9 w-9 logo-color"/>
        <span class="brand-title text-brand">Proximity Deals</span>
      </a>
      <nav class="hidden md:flex items-center gap-1.5">
        ${link('index.html','Feed', active==='feed')}
        ${link('create.html','Create', active==='create')}
        ${link('scan.html','Scan', active==='scan')}
        ${link('charges.html','Charges', active==='charges')}
        ${link('referrals.html','Referrals', active==='referrals')}
        ${link('profile.html','Profile', active==='profile')}
        ${link('preferences.html','Preferences', active==='prefs')}
        ${link('help.html','Help', active==='help')}
        ${link('appeals.html','Appeals', active==='appeals')}
        <button id="themeBtn" class="nav-pill" title="Toggle theme">🌓</button>
      </nav>
      <button id="menuBtn" class="md:hidden nav-pill" aria-label="Menu">☰</button>
    </div>
    <div id="mobileNav" class="md:hidden px-4 pb-3 space-y-2 hidden">
      ${link('index.html','Feed', active==='feed', true)}
      ${link('create.html','Create', active==='create', true)}
      ${link('scan.html','Scan', active==='scan', true)}
      ${link('charges.html','Charges', active==='charges', true)}
      ${link('referrals.html','Referrals', active==='referrals', true)}
      ${link('profile.html','Profile', active==='profile', true)}
      ${link('preferences.html','Preferences', active==='prefs', true)}
      ${link('help.html','Help', active==='help', true)}
      ${link('appeals.html','Appeals', active==='appeals', true)}
    </div>
  </header>`;
}
function link(href, label, active=false, mobile=false){
  const cls = mobile ? `nav-pill w-full ${active?'active':''}` : `nav-pill ${active?'active':''}`;
  return `<a class="${cls}" href="${href}">${label}</a>`;
}
export function mountChrome(active){
  setThemeFromPref();
  const shell = document.getElementById('app-shell');
  shell.innerHTML = nav(active);
  document.getElementById('themeBtn')?.addEventListener('click', toggleTheme);
  const menuBtn = document.getElementById('menuBtn');
  const mobileNav = document.getElementById('mobileNav');
  menuBtn?.addEventListener('click', ()=> mobileNav.classList.toggle('hidden'));
}
export function toast(msg, ok=true){
  const t = document.createElement('div');
  t.className = `fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl text-sm shadow ${ok ? 'bg-green-600 text-white' : 'bg-rose-600 text-white'}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(()=> t.remove(), 2400);
}
export function openLightbox(innerHTML){
  closeLightbox();
  const wrap = document.createElement('div');
  wrap.id = 'pd_lightbox';
  wrap.className = 'fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur';
  wrap.innerHTML = `
    <div class="relative max-w-full">
      <button id="pd_lb_close" class="absolute -top-4 -right-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-full h-10 w-10 shadow flex items-center justify-center">✕</button>
      <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow max-w-[92vw]">${innerHTML}</div>
    </div>`;
  document.body.appendChild(wrap);
  document.getElementById('pd_lb_close').addEventListener('click', closeLightbox);
  wrap.addEventListener('click', e=>{ if(e.target===wrap) closeLightbox(); });
  document.addEventListener('keydown', escClose, { once: true });
}
export function closeLightbox(){
  const el = document.getElementById('pd_lightbox');
  if(el) el.remove();
}
function escClose(e){ if(e.key==='Escape') closeLightbox(); }
