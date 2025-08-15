import { store } from './store.js';
const W_REDEEM = 1.0;
const W_FREQ7 = 0.5;
const W_REF = 2.0;
export function computeProximity(userId){
  const coupons = store.coupons.filter(c=> c.creatorId===userId);
  const redemptions = store.redemptions.filter(r=> coupons.some(c=> c.id===r.couponId));
  const uniqueRedeemers = new Set(redemptions.map(r=> r.userId));
  const sevenDaysAgo = Date.now() - 7*86400000;
  const freq7 = redemptions.filter(r=> r.redeemedAt >= sevenDaysAgo).length;
  const referrals = store.referrals.filter(x=> x.inviterId===userId).length;
  const credits = store.users.find(u=> u.id===userId)?.proxCredits || 0;
  return uniqueRedeemers.size * W_REDEEM + freq7 * W_FREQ7 + referrals * W_REF + credits;
}
export function updateAllProximity(){
  store.users = store.users.map(u => ({...u, proximity: computeProximity(u.id)}));
}
export function sortByProximityThenDistance(items, myPos){
  return items.sort((a,b)=>{
    const aCreator = store.users.find(u=> u.id===a.creatorId);
    const bCreator = store.users.find(u=> u.id===b.creatorId);
    const pa = aCreator?.proximity ?? 0;
    const pb = bCreator?.proximity ?? 0;
    if(pb !== pa) return pb - pa;
    if(myPos && a.lat && a.lng && b.lat && b.lng){
      const da = dist(myPos.lat,myPos.lng,a.lat,a.lng);
      const db = dist(myPos.lat,myPos.lng,b.lat,b.lng);
      return da - db;
    }
    return (b.createdAt??0) - (a.createdAt??0);
  });
}
function dist(lat1,lon1,lat2,lon2){
  const R=6371e3; const toRad=x=>x*Math.PI/180;
  const dphi = toRad(lat2-lat1), dl = toRad(lon2-lon1);
  const a = Math.sin(dphi/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dl/2)**2;
  return 2*R*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
