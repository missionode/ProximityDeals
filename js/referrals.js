import { mountChrome, $, toast } from './ui.js';
import { store } from './store.js';
document.addEventListener('DOMContentLoaded', ()=>{
  mountChrome('referrals');
  const mine = store.referrals.filter(r=> r.inviterId===store.me.id).sort((a,b)=> (b.joinedAt??0)-(a.joinedAt??0));
  const cont = $('#list');
  cont.innerHTML = mine.length ? mine.map(r=> {
    const u = store.users.find(x=> x.id===r.inviteeId);
    return `
    <div class="flex items-center justify-between border border-slate-200 dark:border-slate-800 rounded-2xl p-3">
      <div>
        <div class="font-semibold">${u?.name || r.inviteeId}</div>
        <div class="text-xs text-slate-500 dark:text-slate-400">${new Date(r.joinedAt).toLocaleString('en-IN')}</div>
      </div>
      <div class="badge">Referral</div>
    </div>`;
  }).join('') : `<p class="text-sm text-slate-600 dark:text-slate-300">No referrals yet.</p>`;
});
