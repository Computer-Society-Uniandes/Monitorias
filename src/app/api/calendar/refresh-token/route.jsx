import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { refreshAccessTokenFromCookies } from '../../../services/CalendarAuthService';

export async function POST() {
  try {
    const result = await refreshAccessTokenFromCookies();

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || 'No refresh token found. Please reconnect your Google Calendar.',
        needsReconnection: result.needsReconnection || true
      }, { status: 401 });
    }

    const credentials = result.credentials;

    // Build response and set cookies similar to previous implementation
    const response = NextResponse.json({ success: true, message: 'Token refreshed successfully' });

    const cookieOptions = {
      Path: '/',
      HttpOnly: true,
      Secure: process.env.NODE_ENV === 'production',
      SameSite: 'Lax',
      MaxAge: 3600 // 1 hour
    };

    response.headers.append(
      'Set-Cookie',
      `calendar_access_token=${credentials.access_token}; ${Object.entries(cookieOptions)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ')}`
    );

    if (credentials.refresh_token) {
      const refreshCookieOptions = { ...cookieOptions, MaxAge: 30 * 24 * 3600 };
      response.headers.append(
        'Set-Cookie',
        `calendar_refresh_token=${credentials.refresh_token}; ${Object.entries(refreshCookieOptions)
          .map(([key, value]) => `${key}=${value}`)
          .join('; ')}`
      );
    }

    return response;
  } catch (error) {
    console.error('Error refreshing token (route):', error);
    return NextResponse.json({ error: 'Failed to refresh token', details: error.message, needsReconnection: true }, { status: 500 });
  }
}