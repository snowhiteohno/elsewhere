import { travelConfig } from '@/lib/travel-server';
import { guestSessionCookie } from '@/lib/travel-session';
export async function GET(request:Request){const config=travelConfig();const headers=new Headers({'Cache-Control':'no-store'});if(config.enabled){const cookie=await guestSessionCookie(request);if(cookie)headers.set('Set-Cookie',cookie);}return Response.json(config,{headers});}
