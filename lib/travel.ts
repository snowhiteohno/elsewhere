import { z } from 'zod';

export const CATEGORIES = ['stays','transport','experiences','rentals','restaurants'] as const;
export type Category = typeof CATEGORIES[number];
export const categoryNames:Record<Category,string>={stays:'Stays',transport:'Getting there',experiences:'Experiences',rentals:'Rentals',restaurants:'Restaurants'};
export const currencies=['USD','EUR','GBP','INR','JPY','AUD','CAD','THB','IDR','AED','CHF','SGD'] as const;
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v,'Use a valid date');
export const tripSchema=z.object({destination:z.string().trim().min(2).max(120),origin:z.string().trim().min(2).max(120),start:date,end:date,travelers:z.number().int().min(1).max(12),budget:z.number().positive().max(100000000),currency:z.enum(currencies),interests:z.string().trim().max(600),pace:z.enum(['relaxed','balanced','packed']),categories:z.array(z.enum(CATEGORIES)).min(1).max(5)}).superRefine((v,c)=>{const days=(Date.parse(v.end)-Date.parse(v.start))/86400000;if(days<1||days>14)c.addIssue({code:'custom',message:'Choose a trip of 1–14 nights.'});if(v.start<new Date().toISOString().slice(0,10))c.addIssue({code:'custom',message:'Choose a departure date today or later.'});if(new Set(v.categories).size!==v.categories.length)c.addIssue({code:'custom',message:'Choose each category only once.'});});
export type Trip = z.infer<typeof tripSchema>;
export type Source={title:string;url:string;snippet:string;domain:string};
export type Discovery={category:Category;sources:Source[];ticket:string;error?:string};
export const offerSchema=z.object({title:z.string().min(1).max(220),provider:z.string().max(140),url:z.string().max(2500),imageUrl:z.string().max(2500),location:z.string().max(250),description:z.string().max(1200),startDate:z.string().max(10),endDate:z.string().max(10),startTime:z.string().max(80),endTime:z.string().max(80),timezone:z.string().max(80),totalAmount:z.number().nonnegative().max(1000000000).nullable(),currency:z.string().regex(/^[A-Z]{3}$/),priceStatus:z.enum(['total','from','unknown']),priceDetail:z.string().max(500),taxesIncluded:z.boolean().nullable(),availability:z.enum(['available','unavailable','not_checked','login_required','request_only']),bookingMode:z.enum(['online','request','external','none']),dateChecked:z.boolean(),cancellation:z.string().max(1000),requirements:z.array(z.string().max(500)).max(12),evidence:z.string().min(1).max(1600),suggestedDay:z.number().int().min(1).max(15),durationMinutes:z.number().int().min(0).max(20000),notes:z.string().max(1000)});
export type Offer=z.infer<typeof offerSchema>&{id:string;category:Category;jobId:string;checkedAt:string};
export const researchSchema=z.object({summary:z.string().max(2000),offers:z.array(offerSchema).max(6),warnings:z.array(z.string().max(800)).max(12),visitedUrls:z.array(z.string().max(2500)).max(20)});
export const preparationSchema=z.object({status:z.enum(['ready','payment_required','login_required','unavailable','blocked','request_only']),summary:z.string().max(2000),bookingUrl:z.string().max(2500),selection:z.string().max(1800),totalAmount:z.number().nonnegative().nullable(),currency:z.string().regex(/^[A-Z]{3}$/),terms:z.string().max(2500),requiredFields:z.array(z.enum(['name','email','phone','notes'])).max(4),canSubmitFreeReservation:z.boolean(),noPaymentOrPenalty:z.boolean(),submissionKind:z.enum(['reservation','request','none']),submitButton:z.string().max(150),evidence:z.string().max(2000),handoffInstructions:z.string().max(1500)});
export type Preparation=z.infer<typeof preparationSchema>;
export const reservationSchema=z.object({status:z.enum(['confirmed','request_submitted','not_submitted','needs_user']),confirmationNumber:z.string().max(200),summary:z.string().max(1600),bookingUrl:z.string().max(2500),evidence:z.string().max(2000)});
export type Reservation=z.infer<typeof reservationSchema>;
export type TravelJob={id:string;phase:'research'|'prepare'|'reserve';category:Category;status:string;runId?:string;steps:string[];streamingUrl?:string;screenshotUrl?:string;offers?:Offer[];summary?:string;warnings?:string[];preparation?:Preparation;reservation?:Reservation;error?:string;createdAt:number};
export type BoardItem={offer:Offer;day:number;time:string};

export function publicUrl(value:unknown):string|undefined{
 if(typeof value!=='string'||value.length>2500)return;
 try{const u=new URL(value);const host=u.hostname.toLowerCase();if(u.protocol!=='https:'||u.username||u.password||u.port&&u.port!=='443'||!host.includes('.')||/^\d+(\.\d+){3}$/.test(host)||host.includes(':')||/(^|\.)(localhost|local|internal|test|invalid|example|onion)$/.test(host)||/\.(local|internal|localhost)$/.test(host))return;
 for(const key of u.searchParams.keys())if(/^(access_token|token|auth|password|secret|sessionid|session_id|email|phone|api_key)$/i.test(key))return;
 return u.href;}catch{return;}
}
export function formatMoney(amount:number,currency:string){try{return new Intl.NumberFormat('en',{style:'currency',currency,maximumFractionDigits:currency==='JPY'?0:2}).format(amount)}catch{return `${currency} ${amount.toFixed(2)}`}}
export function tripDays(trip:Trip){return Math.round((Date.parse(trip.end)-Date.parse(trip.start))/86400000)+1;}
export function dateForDay(trip:Trip,day:number){return new Date(Date.parse(trip.start)+(day-1)*86400000).toISOString().slice(0,10);}
export function budgetTotals(items:BoardItem[]){const totals:Record<string,number>={};let unknown=0;for(const {offer:o} of items){if(o.totalAmount===null||o.priceStatus!=='total'||!o.dateChecked){unknown++;continue;}totals[o.currency]=(totals[o.currency]||0)+o.totalAmount;}return {totals,unknown};}
export function scheduleWarnings(items:BoardItem[],trip:Trip){const warnings:string[]=[];for(const item of items){const o=item.offer;if(o.startDate&&o.dateChecked&&o.startDate!==dateForDay(trip,item.day)&&o.category!=='stays')warnings.push(`${o.title}: the selected day differs from the checked date. Recheck before booking.`);if(o.availability!=='available')warnings.push(`${o.title}: date-specific availability is not confirmed.`);}
 const timed=items.filter(x=>x.time&&x.offer.category!=='stays');for(let i=0;i<timed.length;i++)for(let j=i+1;j<timed.length;j++){const a=timed[i],b=timed[j];if(a.day!==b.day)continue;const mins=(s:string)=>Number(s.slice(0,2))*60+Number(s.slice(3,5));const aStart=mins(a.time),bStart=mins(b.time);if(aStart<bStart+b.offer.durationMinutes&&bStart<aStart+a.offer.durationMinutes)warnings.push(`${a.offer.title} overlaps ${b.offer.title}.`);}return [...new Set(warnings)];}
export function canReserve(p:Preparation){return p.status==='ready'&&p.canSubmitFreeReservation&&p.noPaymentOrPenalty&&p.totalAmount===0&&p.submissionKind==='reservation'&&!!p.submitButton&&!!publicUrl(p.bookingUrl);}
export function calendarFile(items:BoardItem[],trip:Trip){const esc=(s:string)=>s.replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Elsewhere//Travel//EN',...items.flatMap(({offer:o,day,time})=>{const d=dateForDay(trip,day).replace(/-/g,'');return ['BEGIN:VEVENT',`UID:${o.id}@elsewhere`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+Z/,'Z')}`,time?`DTSTART:${d}T${time.replace(':','')}00`:`DTSTART;VALUE=DATE:${d}`,`SUMMARY:${esc(o.title+' (plan, not a booking)')}`,`LOCATION:${esc(o.location)}`,`DESCRIPTION:${esc(`${o.url}\n${o.priceDetail}\n${o.notes}`)}`,'END:VEVENT'];}),'END:VCALENDAR'].join('\r\n');}

/** Assemble only dated, available evidence; this never invents an event or changes a checked date. */
export function draftItinerary(offers:Offer[],trip:Trip):BoardItem[]{
 const result:BoardItem[]=[];const seen=new Set<string>();const used=new Set<Category>();
 const ranked=[...offers].filter(o=>o.availability==='available'&&o.dateChecked).sort((a,b)=>Number(b.priceStatus==='total')-Number(a.priceStatus==='total'));
 for(const o of ranked){const key=o.title.toLowerCase().replace(/\W/g,'');if(seen.has(key))continue;
 if(['stays','transport','rentals'].includes(o.category)&&used.has(o.category))continue;
 const day=Math.floor((Date.parse(o.startDate)-Date.parse(trip.start))/86400000)+1;if(day<1||day>tripDays(trip))continue;
 const count=result.filter(x=>x.day===day&&['experiences','restaurants'].includes(x.offer.category)).length;
 if(['experiences','restaurants'].includes(o.category)&&count>=(trip.pace==='relaxed'?2:trip.pace==='packed'?5:3))continue;
 const item={offer:o,day,time:/^\d{2}:\d{2}$/.test(o.startTime)?o.startTime:''};
 if(scheduleWarnings([...result,item],trip).some(w=>w.includes('overlaps')))continue;
 result.push(item);used.add(o.category);seen.add(key);
 }
 return result;
}
