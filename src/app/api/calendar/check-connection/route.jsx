import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('calendar_access_token');
    
    console.log('Checking connection - Access token exists:', !!accessToken);
    
    return Response.json({
      connected: !!accessToken,
      debug: {
        hasToken: !!accessToken,
        tokenValue: accessToken?.value ? '[REDACTED]' : null
      }
    });
  } catch (error) {
    console.error('Error in check-connection endpoint:', error);
    return Response.json({
      connected: false,
      error: error.message
    });
  }
} 