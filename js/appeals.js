import { mountChrome, $, toast } from './ui.js';
import { api } from './api.js';
import { store } from './store.js';
import { updateAllProximity } from './proximity.js';
document.addEventListener('DOMContentLoaded', ()=>{
  mountChrome('appeals');
  render();
  setInterval(tickResolve, 5000);
});
function render(){
  const data = api.appeals.listMine();
  const makeCreateCard = c => `
    <div class="border border-slate-200 dark:border-slate-800 rounded-2xl p-3">
      <div class="flex items-center justify-between gap-3">
        <div>
          <div class="font-semibold">${c.title}</div>
          <div class="text-sm text-slate-600 dark:text-slate-300">${c.type==='OFFER'?'Offer':'Service'}</div>
        </div>
        <div class="flex items-center gap-2">
          <input class="input w-64" placeholder="Evidence URL" data-evidence="${c.id}"/>
          <button class="btn-primary" data-appeal="${c.id}">Submit Appeal</button>
        </div>
      </div>
    </div>`;
  const makeSubmittedCard = a => `
    <div class="border border-slate-200 dark:border-slate-800 rounded-2xl p-3">
      <div class="flex items-center justify-between gap-3">
        <div>
          <div class="font-semibold">${a.coupon?.title || a.couponId}</div>
          <div class="text-sm text-slate-600 dark:text-slate-300">Status: ${a.status}</div>
        </div>
        <a href="${a.evidenceUrl}" target="_blank" class="btn-ghost">Evidence</a>
      </div>
    </div>`;
  document.getElementById('appealCreate').innerHTML = data.canAppeal.length ? data.canAppeal.map(makeCreateCard).join('') : `<p class="text-sm text-slate-600 dark:text-slate-300">No suspended coupons without an appeal.</p>`;
  document.getElementById('appealList').innerHTML = data.submitted.length ? data.submitted.map(makeSubmittedCard).join('') : `<p class="text-sm text-slate-600 dark:text-slate-300">No appeals yet.</p>`;
  document.querySelectorAll('[data-appeal]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.getAttribute('data-appeal');
      const ev = document.querySelector(`[data-evidence="${id}"]`).value.trim();
      if(!ev){ toast('Add evidence URL', false); return; }
      try{ api.appeals.submit(id, ev); toast('Appeal submitted'); render(); }
      catch(e){ toast(e.message, false); }
    });
  });
}
function tickResolve(){
  const mine = store.appeals.filter(a=> a.creatorId===store.me.id && a.status==='PENDING');
  mine.forEach(a=>{
    if(Date.now()-a.submittedAt>15000){
      const ok = Math.random()>0.4;
      a.status = ok ? 'RESOLVED' : 'REJECTED';
      if(ok){
        const c = store.coupons.find(c=> c.id===a.couponId);
        if(c){ c.isActive=true; store.coupons=[...store.coupons]; }
        const me = store.users.find(u=> u.id===store.me.id);
        me.proxCredits = (me.proxCredits||0) + 0.5;
        store.users=[...store.users];
        updateAllProximity();
      }
      store.appeals=[...store.appeals];
    }
  });
}
