import { mountChrome, $, toast } from './ui.js';
import { store } from './store.js';
import { updateAllProximity } from './proximity.js';
const state = { inviter: null };
document.addEventListener('DOMContentLoaded', async ()=>{
  mountChrome();
  startScanner();
  $('#usePayload').addEventListener('click', ()=>{ handlePayload($('#manual').value.trim()); });
  $('#createBtn').addEventListener('click', ()=>{
    const name = $('#name').value.trim() || 'New User';
    const phone = $('#phone').value.trim() || '+91XXXXXXXXXX';
    if(!state.inviter){ toast('Scan or paste a referral first', false); return; }
    const newUser = { id: crypto.randomUUID(), name, phone, inviterId: state.inviter.inviter_id, proximity: 0, referrals: 0 };
    store.users = [...store.users, newUser];
    store.me = newUser;
    const referral = { id: crypto.randomUUID(), inviterId: state.inviter.inviter_id, inviteeId: newUser.id, joinedAt: Date.now() };
    store.referrals = [referral, ...store.referrals];
    updateAllProximity();
    $('#profileStep').classList.add('hidden');
    $('#doneStep').classList.remove('hidden');
    toast('Joined successfully ✅');
  });
});
function setScanStatus(text){ $('#scanStatus').textContent = text; }
async function startScanner(){
  const video = $('#video');
  if(!('BarcodeDetector' in window)){ setScanStatus('Camera not supported. Paste payload.'); return; }
  try{
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }});
    video.srcObject = stream;
    await video.play();
    const detector = new BarcodeDetector({ formats: ['qr_code'] });
    tick(detector, video);
  }catch(e){ setScanStatus('Camera blocked. Paste payload.'); }
}
async function tick(detector, video){
  if(video.readyState === video.HAVE_ENOUGH_DATA){
    try{
      const barcodes = await detector.detect(video);
      if(barcodes.length){ const value = barcodes[0].rawValue; stop(video); handlePayload(value); return; }
    }catch(e){}
  }
  requestAnimationFrame(()=> tick(detector, video));
}
function stop(video){ video.srcObject?.getTracks().forEach(t=> t.stop()); }
function handlePayload(raw){
  try{
    const obj = JSON.parse(raw);
    if(obj.type !== 'referral' || !obj.inviter_id) throw new Error();
    state.inviter = obj;
    setScanStatus(`Inviter: ${obj.inviter_name || obj.inviter_id}`);
    $('#profileStep').classList.remove('hidden');
    toast('Referral detected ✅');
  }catch{ toast('Invalid referral payload', false); }
}
