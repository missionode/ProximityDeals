import { store } from './store.js';
import { importKey, hmacSign, hmacVerify } from './crypto.js';
const SECRET = 'demo-secret';
export async function buildSignedCouponPayload(couponId){
  const key = await importKey(SECRET);
  const nonce = crypto.randomUUID();
  const issuedAt = Date.now();
  const expAt = issuedAt + 60000;
  const msg = `${couponId}|${nonce}|${issuedAt}|${expAt}`;
  const sig = await hmacSign(key, msg);
  return { type:'coupon', coupon_id: couponId, nonce, issued_at: issuedAt, exp_at: expAt, sig };
}
export async function verifyAndConsume(payload){
  if(payload?.type!=='coupon') throw new Error('Bad payload');
  const { coupon_id, nonce, issued_at, exp_at, sig } = payload;
  if(!coupon_id||!nonce||!issued_at||!exp_at||!sig) throw new Error('Bad payload');
  const now = Date.now();
  if(now < issued_at-90000 || now > exp_at+90000) throw new Error('Expired');
  const used = store.noncesUsed.find(n=> n.nonce===nonce);
  if(used) throw new Error('Already used');
  const key = await importKey(SECRET);
  const ok = await hmacVerify(key, `${coupon_id}|${nonce}|${issued_at}|${exp_at}`, sig);
  if(!ok) throw new Error('Invalid signature');
  store.noncesUsed = [{ nonce, usedAt: now }, ...store.noncesUsed].slice(0,5000);
  return coupon_id;
}
export function guardDuplicateLocal(couponId){
  const now = Date.now();
  const last = store.deviceRedeemGuards.find(x=> x.couponId===couponId);
  if(last && now - last.at < 60000) return false;
  store.deviceRedeemGuards = [{ couponId, at: now }, ...store.deviceRedeemGuards].slice(0,200);
  return true;
}
