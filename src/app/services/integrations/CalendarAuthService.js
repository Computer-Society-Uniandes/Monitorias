import { cookies } from 'next/headers';
import { google } from 'googleapis';
import { NextResponse } from 'next/server';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

/**
 * Refresh access token using refresh token stored in cookies (server-side).
 * Returns an object { success: boolean, accessToken?: string, error?: string, needsReconnection?: boolean }
 */
export async function refreshAccessTokenFromCookies() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('calendar_refresh_token');

    if (!refreshToken) {
      return { success: false, error: 'No refresh token found', needsReconnection: true };
    }

    oauth2Client.setCredentials({ refresh_token: refreshToken.value });

    // refreshAccessToken is deprecated in newer googleapis versions, but keep compatibility
    const res = await oauth2Client.refreshAccessToken();
    const { credentials } = res;

    if (!credentials || !credentials.access_token) {
      return { success: false, error: 'No access token received from refresh', needsReconnection: true };
    }

    // Return new access token (cookies will be set by route when called via HTTP; here we return token)
    return { success: true, accessToken: credentials.access_token, credentials };
  } catch (error) {
    console.error('CalendarAuthService.refreshAccessTokenFromCookies error:', error);
    // Common errors: invalid_grant (refresh token revoked/expired)
    const needsReconnection = error.message && (error.message.includes('invalid_grant') || error.message.includes('expired'));
    return { success: false, error: error.message, needsReconnection };
  }
}
