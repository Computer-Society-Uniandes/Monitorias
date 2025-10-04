export async function GET() {
  try {
    const config = {
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasRedirectUri: !!process.env.GOOGLE_REDIRECT_URI,
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
      nodeEnv: process.env.NODE_ENV
    };

    // No exponer el client secret real
    if (config.hasClientSecret) {
      config.clientSecretPreview = process.env.GOOGLE_CLIENT_SECRET.substring(0, 10) + '...';
    }

    return Response.json({
      message: 'Google Calendar OAuth Configuration Debug',
      config,
      status: 'success'
    });
  } catch (error) {
    return Response.json({
      error: 'Debug endpoint error',
      message: error.message,
      status: 'error'
    }, { status: 500 });
  }
}
