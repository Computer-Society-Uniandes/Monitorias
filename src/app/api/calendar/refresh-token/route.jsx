import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('calendar_refresh_token');

    if (!refreshToken) {
      return NextResponse.json({ 
        error: 'No refresh token found. Please reconnect your Google Calendar.',
        needsReconnection: true
      }, { status: 401 });
    }

    console.log('Attempting to refresh Google Calendar token...');

    // Set the refresh token
    oauth2Client.setCredentials({
      refresh_token: refreshToken.value
    });

    // Refresh the access token
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    if (!credentials.access_token) {
      throw new Error('No access token received from refresh');
    }

    console.log('Token refreshed successfully');

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Token refreshed successfully'
    });

    // Update the access token cookie
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

    // If we got a new refresh token, update it too
    if (credentials.refresh_token) {
      const refreshCookieOptions = {
        ...cookieOptions,
        MaxAge: 30 * 24 * 3600 // 30 days
      };
      
      response.headers.append(
        'Set-Cookie',
        `calendar_refresh_token=${credentials.refresh_token}; ${Object.entries(refreshCookieOptions)
          .map(([key, value]) => `${key}=${value}`)
          .join('; ')}`
      );
    }

    return response;

  } catch (error) {
    console.error('Error refreshing token:', error);
    
    // If refresh fails, user needs to reconnect
    if (error.message.includes('invalid_grant') || error.message.includes('Token has been expired')) {
      return NextResponse.json({ 
        error: 'Refresh token expired. Please reconnect your Google Calendar.',
        needsReconnection: true
      }, { status: 401 });
    }

    return NextResponse.json({ 
      error: 'Failed to refresh token',
      details: error.message,
      needsReconnection: true
    }, { status: 500 });
  }
} 