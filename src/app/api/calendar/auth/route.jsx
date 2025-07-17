import { getAuthUrl } from '../../../services/GoogleCalendarService';

export async function GET() {
  try {
    const url = getAuthUrl();
    return Response.redirect(url);
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return new Response(JSON.stringify({ error: 'Error generating auth URL' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}