import { mountChrome, $, toast } from './ui.js';
import { store } from './store.js';
document.addEventListener('DOMContentLoaded', ()=>{
  mountChrome();
  $('#linkBtn').addEventListener('click', ()=>{
    const vpa = $('#vpa').value.trim();
    if(!vpa){ toast('Enter VPA', false); return; }
    const me = store.me;
    store.me = {...me, vpa, vpaLinkedAt: Date.now()};
    $('#status').textContent = 'UPI linked for demo';
    toast('UPI linked');
  });
});
