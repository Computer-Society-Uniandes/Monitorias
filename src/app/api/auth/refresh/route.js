/**
 * Refresh Token API Route
 * POST /api/auth/refresh - Refresh access token
 */

import { NextResponse } from 'next/server';
import * as authService from '@/lib/services/auth.service';

/**
 * POST /api/auth/refresh
 * Body: { refreshToken }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    
    if (!body.refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'refreshToken is required',
        },
        { status: 400 }
      );
    }
    
    const result = await authService.refresh(body.refreshToken);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Refresh error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Refresh token failed',
      },
      { status: 401 }
    );
  }
}

