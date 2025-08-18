import { cookies } from 'next/headers';
import { google } from 'googleapis';

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
    
    // Obtener la lista de calendarios
    const response = await calendar.calendarList.list();

    // Transformar la respuesta para incluir solo la información relevante
    const calendars = response.data.items.map(cal => ({
      id: cal.id,
      summary: cal.summary,
      description: cal.description,
      primary: cal.primary || false,
      backgroundColor: cal.backgroundColor,
      foregroundColor: cal.foregroundColor,
      accessRole: cal.accessRole
    }));

    return Response.json(calendars);
  } catch (error) {
    console.error('Error fetching calendars:', error);
    return Response.json({ 
      error: 'Error fetching calendars',
      details: error.message 
    }, { status: 500 });
  }
}   