import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  
  // Eliminar las cookies
  cookieStore.delete('calendar_access_token');
  cookieStore.delete('calendar_refresh_token');

  return Response.json({ success: true });
} 