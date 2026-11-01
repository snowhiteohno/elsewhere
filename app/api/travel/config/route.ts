import { travelConfig } from '@/lib/travel-server';
export async function GET(){return Response.json(travelConfig(),{headers:{'Cache-Control':'no-store'}});}
