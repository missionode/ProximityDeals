const NS = 'pd';
const KEYS = {
  users: `${NS}_users`,
  me: `${NS}_me`,
  coupons: `${NS}_coupons`,
  redemptions: `${NS}_redemptions`,
  flags: `${NS}_flags`,
  charges: `${NS}_charges`,
  referrals: `${NS}_referrals`,
  appeals: `${NS}_appeals`,
  noncesUsed: `${NS}_nonces_used`,
  deviceGuards: `${NS}_dev_guards`,
  backup: `${NS}_backup`,
  autosave: `${NS}_autosave`
};
function jget(key, fallback){
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function jset(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
export const store = {
  get users(){ return jget(KEYS.users, []); },
  set users(v){ jset(KEYS.users, v); },
  get me(){ return jget(KEYS.me, null); },
  set me(v){ jset(KEYS.me, v); },
  get coupons(){ return jget(KEYS.coupons, []); },
  set coupons(v){ jset(KEYS.coupons, v); },
  get redemptions(){ return jget(KEYS.redemptions, []); },
  set redemptions(v){ jset(KEYS.redemptions, v); },
  get flags(){ return jget(KEYS.flags, []); },
  set flags(v){ jset(KEYS.flags, v); },
  get charges(){ return jget(KEYS.charges, []); },
  set charges(v){ jset(KEYS.charges, v); },
  get referrals(){ return jget(KEYS.referrals, []); },
  set referrals(v){ jset(KEYS.referrals, v); },
  get appeals(){ return jget(KEYS.appeals, []); },
  set appeals(v){ jset(KEYS.appeals, v); },
  get noncesUsed(){ return jget(KEYS.noncesUsed, []); },
  set noncesUsed(v){ jset(KEYS.noncesUsed, v); },
  get deviceRedeemGuards(){ return jget(KEYS.deviceGuards, []); },
  set deviceRedeemGuards(v){ jset(KEYS.deviceGuards, v); },
  dump(){
    return {
      users: this.users, me: this.me, coupons: this.coupons,
      redemptions: this.redemptions, flags: this.flags,
      charges: this.charges, referrals: this.referrals, appeals: this.appeals,
      noncesUsed: this.noncesUsed, deviceRedeemGuards: this.deviceRedeemGuards
    };
  },
  load(json){
    if(json.users) this.users = json.users;
    if(json.me) this.me = json.me;
    if(json.coupons) this.coupons = json.coupons;
    if(json.redemptions) this.redemptions = json.redemptions;
    if(json.flags) this.flags = json.flags;
    if(json.charges) this.charges = json.charges;
    if(json.referrals) this.referrals = json.referrals;
    if(json.appeals) this.appeals = json.appeals;
    if(json.noncesUsed) this.noncesUsed = json.noncesUsed;
    if(json.deviceRedeemGuards) this.deviceRedeemGuards = json.deviceRedeemGuards;
  },
  export(filename='proximity-deals-backup.json'){
    const blob = new Blob([JSON.stringify(this.dump(), null, 2)], {type: 'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  },
  import(file){
    return new Promise((res, rej)=>{
      const r = new FileReader();
      r.onload = () => {
        try { const data = JSON.parse(r.result); this.load(data); res(true); }
        catch(e){ rej(e); }
      };
      r.onerror = rej;
      r.readAsText(file);
    });
  },
  forgetBackup(){
    localStorage.removeItem(KEYS.backup);
  },
  enableAutosave(filename='proximity-deals-auto.json', intervalMs=60000){
    localStorage.setItem(KEYS.autosave, JSON.stringify({filename, intervalMs, on:true}));
  },
  disableAutosave(){ localStorage.removeItem(KEYS.autosave); },
  runAutosaveTick(){
    const cfg = jget(KEYS.autosave, null);
    if(!cfg?.on) return;
    localStorage.setItem(KEYS.backup, JSON.stringify({at: Date.now(), data: this.dump()}));
  }
};
(function seed(){
  if(!store.me){
    const me = { id: crypto.randomUUID(), name: 'You', inviterId: null, proximity: 0, referrals: 0, proxCredits: 0 };
    store.me = me;
    store.users = [me];
  }
  if(store.coupons.length === 0){
    const now = Date.now();
    store.coupons = [
      {id: crypto.randomUUID(), creatorId: store.me.id, type:'SERVICE', title:'Free 30-min Consultation', description:'Web dev consult.', isActive:true, createdAt: now},
      {id: crypto.randomUUID(), creatorId: store.me.id, type:'OFFER', title:'Free Coffee', description:'One free coffee', expiryAt: now + 3*86400000, maxUses: 3, uses: 0, isActive:true, createdAt: now}
    ];
  }
  if(!store.appeals) store.appeals = [];
  if(!store.noncesUsed) store.noncesUsed = [];
  if(!store.deviceRedeemGuards) store.deviceRedeemGuards = [];
})();
