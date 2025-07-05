import { cookies } from 'next/headers';
import { google } from 'googleapis';

export async function GET(request, { params }) {
  try {
    const { calendarId } = params;
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
      calendarId: calendarId,
      timeMin: now.toISOString(),
      timeMax: oneWeekLater.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 100 // Limitar a 100 eventos para evitar sobrecarga
    });

    // Transformar la respuesta para incluir solo la información relevante
    const events = response.data.items.map(event => ({
      id: event.id,
      summary: event.summary,
      description: event.description,
      start: event.start,
      end: event.end,
      location: event.location,
      status: event.status,
      creator: event.creator,
      attendees: event.attendees,
      htmlLink: event.htmlLink
    }));

    return Response.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    
    // Manejar errores específicos
    if (error.code === 404) {
      return Response.json({ 
        error: 'Calendar not found',
        details: 'The specified calendar ID does not exist or you do not have access to it'
      }, { status: 404 });
    }

    if (error.code === 403) {
      return Response.json({ 
        error: 'Access denied',
        details: 'You do not have permission to access this calendar'
      }, { status: 403 });
    }

    return Response.json({ 
      error: 'Error fetching events',
      details: error.message 
    }, { status: 500 });
  }
} 