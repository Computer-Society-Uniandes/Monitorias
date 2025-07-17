import { cookies } from 'next/headers';
import { google } from 'googleapis';
import { createEvent, deleteEvent } from '../../../services/googleCalendarService';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('calendar_access_token')?.value;

    if (!accessToken) {
      return Response.json({ error: 'No access token found' }, { status: 401 });
    }

    // Configurar el cliente OAuth2
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Establecer las credenciales
    oauth2Client.setCredentials({
      access_token: accessToken
    });

    const calendar = google.calendar({ 
      version: 'v3',
      auth: oauth2Client
    });
    
    // Obtener eventos de los próximos 7 días
    const now = new Date();
    const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: oneWeekLater.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    return Response.json(response.data.items || []);
  } catch (error) {
    console.error('Error fetching events:', error);
    return Response.json({ 
      error: 'Error fetching events',
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const accessToken = request.headers.get('authorization')?.split(' ')[1];
    const event = await request.json();

    if (!accessToken) {
      return Response.json({ error: 'Access token required' }, { status: 401 });
    }

    const createdEvent = await createEvent(accessToken, event);
    return Response.json(createdEvent);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const accessToken = request.headers.get('authorization')?.split(' ')[1];
    const eventId = searchParams.get('eventId');

    if (!accessToken || !eventId) {
      return Response.json({ error: 'Access token and event ID required' }, { status: 401 });
    }

    await deleteEvent(accessToken, eventId);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
} 