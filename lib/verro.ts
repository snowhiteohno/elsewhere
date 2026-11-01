export const STORES = [
  { id: 'blinkit', name: 'Blinkit', url: 'https://blinkit.com', color: '#f8cb46', mark: 'b' },
  { id: 'zepto', name: 'Zepto', url: 'https://www.zepto.com', color: '#6226bc', mark: 'z' },
  { id: 'instamart', name: 'Instamart', url: 'https://www.swiggy.com/instamart', color: '#f87328', mark: 'i' },
] as const;
export type StoreId = typeof STORES[number]['id'];
export type Item = { id: string; name: string; amount: number; unit: 'g'|'ml'|'count'; requirements: string[] };
export type Brief = { items: Item[]; address: string; mode: 'exact'|'flexible'; delivery: 'today'|'any'; coupons: boolean };
export type Match = { itemId: string; product: string; brand: string; productId: string; variant: string; packLabel: string; imageUrl: string; amount: number; unit: Item['unit']; packs: number; price: number; url: string; checks: { requirement: string; verdict: 'met'|'failed'|'unknown'; evidence: string }[]; status: 'matched'|'missing'|'unknown'; evidence: string };
export type Quote = { store: StoreId; checkoutUrl: string; checkoutKind: 'direct'|'store_cart'|'unavailable'; checkoutEvidence: string; currency: 'INR'; items: Match[]; addressConfirmed: boolean; deliveryConfirmed: boolean; checkoutReached: boolean; existingCartClear: boolean; subtotal: number; delivery: number; platform: number; other: number; discount: number; total: number; coupon: string; eta: string; checkedAt: string; note: string; referee: boolean; source: 'live' };
export type Validation = { eligible: boolean; reasons: string[] };
export function parseList(text: string): Item[] {
  return text.split(/\n/).map(x=>x.trim().replace(/^[-•]\s*/, '')).filter(Boolean).map((line,i)=>{
    const parts = line.split(',').map(x=>x.trim()).filter(Boolean);
    const qty = line.match(/\b(\d+(?:\.\d+)?)\s*(kg|ml|litres?|liters?|l|g|pcs?|pieces?|packs?)\b/i);
    const u = qty?.[2].toLowerCase();
    const unit: Item['unit'] = u === 'kg'||u === 'g' ? 'g' : u && /^(ml|l)/.test(u) ? 'ml' : 'count';
    const amount = qty ? Number(qty[1]) * (u === 'kg'||(unit==='ml'&&u!=='ml') ? 1000 : 1) : 1;
    const name = parts[0].replace(/\b\d+(?:\.\d+)?\s*(kg|ml|litres?|liters?|l|g|pcs?|pieces?|packs?)\b/i,'').trim();
    const requirements = parts.slice(1).filter(x=>!/^\d+(?:\.\d+)?\s*(kg|ml|litres?|liters?|l|g|pcs?|pieces?|packs?)$/i.test(x));
    return {id:`item-${i+1}`,name,amount,unit,requirements};
  });
}
export function quantity(amount: number, unit: Item['unit']) { return unit==='g'&&amount>=1000 ? `${amount/1000} kg` : unit==='ml'&&amount>=1000 ? `${amount/1000} L` : `${amount} ${unit==='count'?'item'+(amount===1?'':'s'):unit}`; }
export function money(paise: number) { return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:paise%100?2:0}).format(paise/100); }
export function validateQuote(q: Quote, brief: Brief): Validation {
  const reasons: string[]=[];
  if(q.source!=='live') reasons.push('Only live store quotes can be ranked');
  if(q.currency!=='INR') reasons.push('Currency is not INR');
  if(!q.checkoutReached) reasons.push('Checkout not reached');
  if(!q.addressConfirmed) reasons.push('Address not confirmed');
  if(!q.deliveryConfirmed) reasons.push('Delivery requirement not confirmed');
  if(!q.existingCartClear) reasons.push('Existing cart contents need review');
  const fields=[q.subtotal,q.delivery,q.platform,q.other,q.discount,q.total];
  if(fields.some(v=>!Number.isSafeInteger(v)||v<0)) reasons.push('Invalid amount');
  if(q.subtotal+q.delivery+q.platform+q.other-q.discount!==q.total) reasons.push('Checkout breakdown does not reconcile');
  if(q.items.length!==brief.items.length||new Set(q.items.map(x=>x.itemId)).size!==brief.items.length) reasons.push('Cart item count does not match');
  for(const wanted of brief.items){
    const match=q.items.find(x=>x.itemId===wanted.id);
    if(!match || match.status!=='matched'){reasons.push(`${wanted.name}: missing or unverified`);continue;}
    if(match.unit!==wanted.unit||match.amount*match.packs!==wanted.amount||!Number.isInteger(match.packs)||match.packs<1||match.amount<=0) reasons.push(`${wanted.name}: quantity mismatch`);
    if(!match.brand.trim()||!match.productId.trim()||!match.packLabel.trim()) reasons.push(`${wanted.name}: exact product identity is missing`);
    if(!match.evidence.trim()||!match.product.trim()) reasons.push(`${wanted.name}: missing product evidence`);
    const required=[...wanted.requirements, ...(brief.mode==='exact' ? [`Exact product: ${wanted.name}`] : [`Product type: ${wanted.name}`])];
    for(const req of required){ const check=match.checks.find(c=>c.requirement===req); if(!check||check.verdict!=='met'||!check.evidence.trim()) reasons.push(`${wanted.name}: ${req} not verified`); }
    if(!Number.isSafeInteger(match.price)||match.price<0) reasons.push(`${wanted.name}: invalid price`);
    if(!storeUrl(match.url,q.store)) reasons.push(`${wanted.name}: invalid evidence URL`);
  }
  if(q.items.reduce((n,x)=>n+x.price,0)!==q.subtotal) reasons.push('Line prices do not match subtotal');
  const age=Date.now()-Date.parse(q.checkedAt);
  if(!Number.isFinite(age)||age>10*60_000||age< -60_000) reasons.push('Quote is stale or timestamp is invalid');
  return {eligible:reasons.length===0,reasons};
}
export function rankedQuotes(quotes: Quote[], brief: Brief){ return quotes.filter(q=>validateQuote(q,brief).eligible).sort((a,b)=>a.total-b.total); }

export function storeUrl(value: string, store: StoreId): string | null {
  try { const url=new URL(value);const base=new URL(STORES.find(s=>s.id===store)!.url).hostname.replace(/^www\./,'');
    if(url.protocol!=='https:'||url.username||url.password||url.port||!(url.hostname===base||url.hostname.endsWith('.'+base)))return null;
    if([...url.searchParams.keys()].some(k=>/(token|session|auth|otp|password|secret)/i.test(k)))return null;
    return url.href;
  } catch { return null; }
}
export function imageUrl(value:string): string|null {
  try {const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.port||!u.hostname.includes('.')||u.hostname==='localhost'||u.hostname.endsWith('.local')||u.hostname.endsWith('.internal')||/^[\d.]+$/.test(u.hostname)||u.hostname.includes(':'))return null;return u.href;}catch{return null;}
}
export function handoff(q:Quote,brief:Brief):{url:string;direct:boolean;label:string}|null {
  if(!q.referee||!validateQuote(q,brief).eligible||!q.checkoutEvidence.trim()||q.checkoutKind==='unavailable')return null;
  const url=storeUrl(q.checkoutUrl,q.store);if(!url)return null;
  const store=STORES.find(s=>s.id===q.store)!;
  // A homepage cannot become a checkout deep link just because the agent labelled it one.
  const path=new URL(url);const direct=q.checkoutKind==='direct'&&(path.pathname!=='/'||path.search.length>0||path.hash.length>0);
  return {url,direct,label:direct?`Continue to ${store.name} checkout`:`Open ${store.name}`};
}
