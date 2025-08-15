export async function importKey(secret){
  const enc = new TextEncoder().encode(secret);
  return await crypto.subtle.importKey('raw', enc, {name:'HMAC', hash:'SHA-256'}, false, ['sign','verify']);
}
export async function hmacSign(key, msg){
  const data = new TextEncoder().encode(msg);
  const sig = await crypto.subtle.sign('HMAC', key, data);
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}
export async function hmacVerify(key, msg, sigB64){
  const data = new TextEncoder().encode(msg);
  const sig = Uint8Array.from(atob(sigB64), c=>c.charCodeAt(0));
  return await crypto.subtle.verify('HMAC', key, sig, data);
}
