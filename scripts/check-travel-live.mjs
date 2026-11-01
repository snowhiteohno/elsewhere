import {writeFileSync,readFileSync,existsSync} from 'node:fs';
const base='http://127.0.0.1:3004';
async function api(path,data){const r=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify(data)});const j=await r.json();if(!r.ok)throw new Error(j.error);return j;}
const stateFile='work/travel-live-check.json';
if(process.argv[2]==='start'){
 if(existsSync(stateFile))throw new Error('Existing test run record found. Poll it rather than starting duplicates.');
 const trips=[{destination:'Kyoto, Japan',origin:'Tokyo, Japan',start:'2026-11-20',end:'2026-11-23',travelers:2,budget:100000,currency:'JPY',interests:'Traditional tea ceremony',pace:'balanced',categories:['experiences']},{destination:'Lisbon, Portugal',origin:'London, United Kingdom',start:'2026-11-20',end:'2026-11-23',travelers:2,budget:1000,currency:'EUR',interests:'Central walkable neighbourhood, private room',pace:'balanced',categories:['stays']}];
 const records=[];for(const trip of trips){const {sources}=await api('/api/travel/discover',trip);console.log(JSON.stringify({destination:trip.destination,sources:sources.map(s=>({category:s.category,domains:s.sources.map(x=>x.domain),error:s.error}))}));const source=sources.find(s=>s.ticket);if(!source)continue;const requestId=crypto.randomUUID();records.push({trip,requestId,sources});writeFileSync(stateFile,JSON.stringify(records));const job=await api('/api/travel/jobs',{action:'start',ticket:source.ticket,requestId});records.at(-1).job=job;writeFileSync(stateFile,JSON.stringify(records));console.log(JSON.stringify(job));}
}else if(process.argv[2]==='retry-rejected'){
 const records=JSON.parse(readFileSync(stateFile,'utf8'));for(const r of records){if(!r.job?.error?.startsWith('TinyFish 400:'))continue;r.previous=r.job;r.requestId=crypto.randomUUID();writeFileSync(stateFile,JSON.stringify(records));r.job=await api('/api/travel/jobs',{action:'start',ticket:r.sources[0].ticket,requestId:r.requestId});writeFileSync(stateFile,JSON.stringify(records));console.log(JSON.stringify(r.job));}
}else{
 const records=JSON.parse(readFileSync(stateFile,'utf8'));for(const record of records){const job=await api('/api/travel/jobs',{action:'poll',id:record.job?.id||record.requestId});record.job=job;console.log(JSON.stringify({destination:record.trip.destination,...job}));}writeFileSync(stateFile,JSON.stringify(records));
}
