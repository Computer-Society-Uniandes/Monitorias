import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('calendar_access_token');

  return Response.json({
    isConnected: !!accessToken
  });
} 