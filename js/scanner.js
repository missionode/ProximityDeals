import { mountChrome, $, toast } from './ui.js';
import { api } from './api.js';
import { verifyAndConsume, guardDuplicateLocal } from './security.js';
document.addEventListener('DOMContentLoaded', async ()=>{
  mountChrome('scan');
  const video = $('#video');
  const manual = $('#manualCode');
  const redeemBtn = $('#redeemManual');
  const permHelp = $('#permHelp');
  let lastFix = null;
  async function start(){
    if('BarcodeDetector' in window){
      try{
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }});
        video.srcObject = stream;
        await video.play();
        const detector = new BarcodeDetector({ formats: ['qr_code'] });
        tick(detector);
      }catch(e){
        permHelp.classList.remove('hidden');
      }
    }else{
      permHelp.textContent = 'Scanner not supported on this browser. Use paste below.';
      permHelp.classList.remove('hidden');
    }
    if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition(p=>{
        lastFix = p;
        if(p.coords.accuracy>200){
          permHelp.textContent = 'Low GPS accuracy detected. Nearby ranking may be limited.';
          permHelp.classList.remove('hidden');
        }
      },()=>{}, { enableHighAccuracy:true, timeout:5000 });
    }
  }
  async function tick(detector){
    if(video.readyState === video.HAVE_ENOUGH_DATA){
      try{
        const barcodes = await detector.detect(video);
        if(barcodes.length){
          const value = barcodes[0].rawValue;
          handleCode(value);
          stop();
          return;
        }
      }catch(e){}
    }
    requestAnimationFrame(()=> tick(detector));
  }
  function stop(){
    const stream = video.srcObject;
    stream?.getTracks().forEach(t=> t.stop());
  }
  async function handleCode(val){
    let obj=null;
    try{ obj = JSON.parse(val); }catch{ toast('Invalid QR', false); return; }
    try{
      const couponId = await verifyAndConsume(obj);
      if(!guardDuplicateLocal(couponId)) throw new Error('Duplicate scan blocked');
      api.redemptions.redeem({ couponId });
      toast('Redeemed via scan ✅');
      setTimeout(()=> location.href='index.html', 700);
    }catch(err){ toast(err.message, false); }
  }
  redeemBtn.addEventListener('click', async ()=>{
    try{
      const obj = JSON.parse(manual.value.trim());
      const couponId = await verifyAndConsume(obj);
      if(!guardDuplicateLocal(couponId)) throw new Error('Duplicate scan blocked');
      api.redemptions.redeem({ couponId });
      toast('Redeemed ✅');
      setTimeout(()=> location.href='index.html', 700);
    }catch(err){ toast(err.message || 'Invalid payload', false); }
  });
  start();
});
