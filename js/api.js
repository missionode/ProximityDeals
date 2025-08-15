import { store } from './store.js';
import { updateAllProximity } from './proximity.js';
export const api = {
  me(){ return store.me; },
  setMeName(name){ store.me = {...store.me, name}; return store.me; },
  coupons: {
    create(data){
      const base = { id: crypto.randomUUID(), creatorId: store.me.id, title: data.title, description: data.description, isActive: true, createdAt: Date.now() };
      let c;
      if(data.type === 'OFFER'){
        c = {...base, type:'OFFER', expiryAt: new Date(data.expiryAt).getTime(), maxUses: Number(data.maxUses||1), uses:0};
      }else{
        c = {...base, type:'SERVICE'};
      }
      store.coupons = [...store.coupons, c];
      updateAllProximity();
      return c;
    },
    update(id, patch){
      store.coupons = store.coupons.map(c=> c.id===id ? {...c, ...patch, updatedAt: Date.now()} : c);
      updateAllProximity();
      return store.coupons.find(c=> c.id===id);
    },
    remove(id){
      store.coupons = store.coupons.filter(c=> c.id!==id);
      updateAllProximity();
      return true;
    },
    listActive(){ return store.coupons.filter(c=> c.isActive !== false); },
    byId(id){ return store.coupons.find(c=> c.id===id); }
  },
  flags: {
    add(couponId, reason='OTHER'){
      store.flags = [...store.flags, {id: crypto.randomUUID(), couponId, reason, createdAt: Date.now()}];
      const count = store.flags.filter(f=> f.couponId===couponId).length;
      if(count>=3){
        const c = store.coupons.find(c=> c.id===couponId);
        if(c){ c.isActive=false; store.coupons = [...store.coupons]; }
      }
      return true;
    }
  },
  redemptions: {
    redeem({couponId, lat, lng}){
      const c = store.coupons.find(x=> x.id===couponId);
      if(!c || c.isActive===false) throw new Error('Coupon inactive');
      if(c.type==='OFFER'){
        if(!c.expiryAt || c.expiryAt < Date.now()) throw new Error('Expired');
        if(c.uses >= c.maxUses) throw new Error('Max uses exceeded');
        c.uses += 1;
        if(c.uses >= c.maxUses) c.isActive=false;
        store.coupons = [...store.coupons];
      }
      const r = { id: crypto.randomUUID(), couponId, userId: store.me.id, redeemedAt: Date.now(), lat, lng };
      store.redemptions = [r, ...store.redemptions];
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const already = store.charges.find(ch=> ch.userId===store.me.id && ch.chargeDateLocal===today);
      if(!already){
        store.charges = [{ id: crypto.randomUUID(), userId: store.me.id, chargeDateLocal: today, amountInPaise: 100, createdAt: Date.now() }, ...store.charges];
      }
      updateAllProximity();
      return r;
    }
  },
  appeals: {
    listMine(){
      const myId = store.me.id;
      const mineSuspended = store.coupons.filter(c=> c.creatorId===myId && c.isActive===false);
      const appeals = store.appeals.filter(a=> mineSuspended.some(c=> c.id===a.couponId));
      const appealedIds = new Set(appeals.map(a=> a.couponId));
      const canAppeal = mineSuspended.filter(c=> !appealedIds.has(c.id));
      const submitted = appeals.map(a=> ({...a, coupon: store.coupons.find(c=> c.id===a.couponId)}));
      return { canAppeal, submitted };
    },
    submit(couponId, evidenceUrl){
      const myId = store.me.id;
      const c = store.coupons.find(c=> c.id===couponId && c.creatorId===myId);
      if(!c) throw new Error('Invalid coupon');
      if(c.isActive!==false) throw new Error('Coupon not suspended');
      const exists = store.appeals.find(a=> a.couponId===couponId);
      if(exists) throw new Error('Appeal already submitted');
      const appeal = { id: crypto.randomUUID(), couponId, creatorId: myId, evidenceUrl, status: 'PENDING', submittedAt: Date.now() };
      store.appeals = [appeal, ...store.appeals];
      return appeal;
    }
  }
};
