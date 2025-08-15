import { mountChrome, $, toast } from './ui.js';
import { api } from './api.js';
import { buildSignedCouponPayload } from './security.js';
document.addEventListener('DOMContentLoaded', async ()=>{
  mountChrome('feed');
  const p = new URLSearchParams(location.search);
  const id = p.get('id');
  const c = api.coupons.byId(id);
  if(!c){ location.href='index.html'; return; }
  $('#title').textContent = c.title;
  const payload = await buildSignedCouponPayload(c.id);
  const json = JSON.stringify(payload);
  $('#payload').value = json;
  const qrURL = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(json)}`;
  $('#qrImg').src = qrURL;
  $('#copyBtn').addEventListener('click', async ()=>{
    try{ await navigator.clipboard.writeText(json); toast('Payload copied'); }
    catch{ toast('Copy failed', false); }
  });
});
