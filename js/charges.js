import { mountChrome, $, toast } from './ui.js';
import { store } from './store.js';
document.addEventListener('DOMContentLoaded', ()=>{
  mountChrome('charges');
  render();
  $('#exportCsv').addEventListener('click', exportCsv);
  $('#printBtn').addEventListener('click', ()=> window.print());
  const shareBtn = $('#shareBtn');
  if(navigator.share){ shareBtn.addEventListener('click', shareCsv); } else { shareBtn.disabled=true; }
});
function render(){
  const mine = store.charges.filter(c=> c.userId===store.me.id).sort((a,b)=> (b.createdAt??0)-(a.createdAt??0));
  const cont = $('#charges');
  cont.innerHTML = mine.length ? mine.map(c=> row(c)).join('') : `<p class="text-sm text-slate-600 dark:text-slate-300">No charges yet.</p>`;
  const total = mine.reduce((s,c)=> s+(c.amountInPaise||100),0)/100;
  $('#total').textContent = `Total: ₹${total.toFixed(2)}`;
}
function row(c){
  const dt = new Date(c.createdAt||Date.now());
  return `
  <div class="flex items-center justify-between border border-slate-200 dark:border-slate-800 rounded-2xl p-3">
    <div>
      <div class="font-semibold">₹${(c.amountInPaise||100)/100}</div>
      <div class="text-xs text-slate-500 dark:text-slate-400">${dt.toLocaleString('en-IN')}</div>
    </div>
    <div class="badge">First redemption of day</div>
  </div>`;
}
function exportCsv(){
  const mine = store.charges.filter(c=> c.userId===store.me.id).sort((a,b)=> (b.createdAt??0)-(a.createdAt??0));
  const header = ['date','amount'];
  const rows = mine.map(c=> [new Date(c.createdAt||Date.now()).toISOString(), (c.amountInPaise||100)/100]);
  const csv = [header.join(','), ...rows.map(r=> r.join(','))].join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'charges.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}
async function shareCsv(){
  const mine = store.charges.filter(c=> c.userId===store.me.id).sort((a,b)=> (b.createdAt??0)-(a.createdAt??0));
  const header = ['date','amount'];
  const rows = mine.map(c=> [new Date(c.createdAt||Date.now()).toISOString(), (c.amountInPaise||100)/100]);
  const csv = [header.join(','), ...rows.map(r=> r.join(','))].join('\n');
  await navigator.share({ title:'Charges', text: csv });
}
