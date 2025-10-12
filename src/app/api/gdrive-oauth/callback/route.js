import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/gdrive-oauth/callback'
);

/**
 * GET - Callback de OAuth después de que el usuario autoriza
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        new URL('/home?drive_error=access_denied', request.url)
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: 'No authorization code received' },
        { status: 400 }
      );
    }

    console.log('📝 Intercambiando código por tokens...');

    // Intercambiar código por tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    console.log('✅ Tokens obtenidos exitosamente');

    // Guardar tokens en cookies (encriptados en producción)
    const cookieStore = cookies();
    
    // Access token
    cookieStore.set('gdrive_access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hora
    });

    // Refresh token (si está disponible)
    if (tokens.refresh_token) {
      cookieStore.set('gdrive_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 días
      });
    }

    // Obtener info del usuario
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    cookieStore.set('gdrive_user_email', userInfo.data.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 días
    });

    console.log('✅ Google Drive conectado para:', userInfo.data.email);

    // Redirigir de vuelta a la aplicación con mensaje de éxito
    return NextResponse.redirect(
      new URL('/home?drive_connected=true', request.url)
    );

  } catch (error) {
    console.error('Error en OAuth callback:', error);
    return NextResponse.redirect(
      new URL('/home?drive_error=authorization_failed', request.url)
    );
  }
}
