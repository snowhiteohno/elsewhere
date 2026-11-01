import { configuration } from '@/lib/tinyfish';
export async function GET(){return Response.json(configuration(),{headers:{'Cache-Control':'no-store'}});}
