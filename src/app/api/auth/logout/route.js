/**
 * Logout API Route
 * POST /api/auth/logout - Revoke refresh tokens (server-side logout)
 */

import { NextResponse } from 'next/server';
import * as authService from '@/lib/services/auth.service';

/**
 * POST /api/auth/logout
 * Body: { uid }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    
    if (!body.uid) {
      return NextResponse.json(
        {
          success: false,
          error: 'uid is required',
        },
        { status: 400 }
      );
    }
    
    await authService.revokeRefreshTokens(body.uid);
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Logout failed',
      },
      { status: 500 }
    );
  }
}

