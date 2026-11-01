import { tripSchema } from '@/lib/travel';
import { discover } from '@/lib/travel-server';
import { assertOrigin, owner } from '@/lib/tinyfish';
export async function POST(request:Request){try{assertOrigin(request);const user=owner(request);const trip=tripSchema.parse(await request.json());return Response.json({sources:await discover(trip,user)},{headers:{'Cache-Control':'no-store'}});}catch(e){return Response.json({error:e instanceof Error?e.message:'Discovery failed'},{status:400});}}
