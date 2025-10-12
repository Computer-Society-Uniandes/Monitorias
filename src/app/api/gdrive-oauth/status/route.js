import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * GET - Verifica si el usuario tiene una conexión OAuth activa con Google Drive
 */
export async function GET() {
  try {
    const cookieStore = cookies();
    
    const accessToken = cookieStore.get('gdrive_access_token')?.value;
    const refreshToken = cookieStore.get('gdrive_refresh_token')?.value;
    const userEmail = cookieStore.get('gdrive_user_email')?.value;

    const isConnected = !!(accessToken || refreshToken);

    return NextResponse.json({
      connected: isConnected,
      email: isConnected ? userEmail : null,
      hasRefreshToken: !!refreshToken,
    });

  } catch (error) {
    console.error('Error verificando conexión de Google Drive:', error);
    return NextResponse.json(
      { connected: false, error: error.message },
      { status: 500 }
    );
  }
}
