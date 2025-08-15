import { mountChrome, $, toast } from './ui.js';
import { store } from './store.js';
document.addEventListener('DOMContentLoaded', ()=>{
  mountChrome('profile');
  const me = store.me;
  $('#inviterName').textContent = me.name || 'You';
  const payload = { type: 'referral', inviter_id: me.id, inviter_name: me.name || 'You', issued_at: new Date().toISOString() };
  const json = JSON.stringify(payload);
  $('#payload').value = json;
  const qrURL = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(json)}`;
  $('#qrImg').src = qrURL;
  $('#copyBtn').addEventListener('click', async ()=>{
    try { await navigator.clipboard.writeText(json); toast('Payload copied'); }
    catch { toast('Copy failed', false); }
  });
});
