import { getTokens } from '../../../services/integrations/GoogleCalendarService';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      return Response.redirect(new URL('/?error=oauth_error', request.url));
    }

    if (!code) {
      console.error('No code provided');
      return Response.redirect(new URL('/?error=no_code', request.url));
    }

    try {
      const tokens = await getTokens(code);
      
      if (!tokens.access_token) {
        throw new Error('No access token received');
      }

      // Create the redirect URL with success parameter
      // Default to /home, but this could be enhanced to redirect based on user role
      const redirectUrl = new URL('/home', request.url);
      redirectUrl.searchParams.set('calendar_connected', 'true');
      
      // Create the response with the redirect
      const response = new Response(null, {
        status: 302,
        headers: {
          'Location': redirectUrl.toString()
        }
      });

      // Set access token cookie with secure flags
      const cookieOptions = {
        Path: '/',
        HttpOnly: true,
        Secure: process.env.NODE_ENV === 'production',
        SameSite: 'Lax',
        MaxAge: 3600 // 1 hour
      };

      // Set access token cookie
      console.log('Setting access token cookie...');
      response.headers.append(
        'Set-Cookie',
        `calendar_access_token=${tokens.access_token}; ${Object.entries(cookieOptions)
          .map(([key, value]) => `${key}=${value}`)
          .join('; ')}`
      );

      // If we have a refresh token, set it with a longer expiration
      if (tokens.refresh_token) {
        const refreshCookieOptions = {
          ...cookieOptions,
          MaxAge: 30 * 24 * 3600 // 30 days
        };
        
        response.headers.append(
          'Set-Cookie',
          `calendar_refresh_token=${tokens.refresh_token}; ${Object.entries(refreshCookieOptions)
            .map(([key, value]) => `${key}=${value}`)
            .join('; ')}`
        );
      }

      return response;
    } catch (tokenError) {
      console.error('Error exchanging code for tokens:', tokenError);
      return Response.redirect(new URL('/?error=token_exchange_failed', request.url));
    }
  } catch (error) {
    console.error('Error in callback:', error);
    return Response.redirect(new URL('/?error=server_error', request.url));
  }
} 