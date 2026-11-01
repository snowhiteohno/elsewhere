import { z } from 'zod';
import { assertOrigin } from '@/lib/tinyfish';
import { travelOwner } from '@/lib/travel-session';
import { cancelJob, inspectJob, prepareOffer, reserveOffer, startResearch } from '@/lib/travel-server';
const schema=z.discriminatedUnion('action',[
 z.object({action:z.literal('start'),ticket:z.string().max(30000),sourceUrl:z.string().max(2500).optional(),requestId:z.string().uuid()}),
 z.object({action:z.literal('poll'),id:z.string().min(1).max(100)}),
 z.object({action:z.literal('cancel'),id:z.string().min(1).max(100)}),
 z.object({action:z.literal('prepare'),id:z.string().max(100),offerId:z.string().max(120),requestId:z.string().uuid()}),
 z.object({action:z.literal('reserve'),id:z.string().max(100),consent:z.literal(true),contact:z.object({name:z.string().trim().min(2).max(100),email:z.string().email().max(150),phone:z.string().trim().max(40),notes:z.string().max(500)})})
]);
export async function POST(request:Request){try{assertOrigin(request);const user=await travelOwner(request);const body=schema.parse(await request.json());const result=body.action==='start'?await startResearch(body.ticket,body.sourceUrl,body.requestId,user):body.action==='prepare'?await prepareOffer(body.id,body.offerId,body.requestId,user):body.action==='reserve'?await reserveOffer(body.id,user,body.contact,body.consent):body.action==='cancel'?await cancelJob(body.id,user):await inspectJob(body.id,user);return Response.json(result,{headers:{'Cache-Control':'no-store'}});}catch(e){return Response.json({error:e instanceof z.ZodError?e.issues.map(i=>i.message).join(' '):e instanceof Error?e.message:'Trip action failed'},{status:400});}}
