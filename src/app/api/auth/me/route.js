/**
 * Get Current User API Route
 * GET /api/auth/me - Get current authenticated user (protected)
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/middleware/auth.middleware';
import * as userService from '../../../../lib/services/user.service';

/**
 * GET /api/auth/me
 * Headers: Authorization: Bearer <idToken>
 */
export async function GET(request) {
  try {
    // Verify authentication
    const userPayload = await requireAuth(request);
    
    // Try to get full user profile from Firestore
    let user;
    try {
      user = await userService.getUserById(userPayload.uid);
    } catch (error) {
      // If user not found in Firestore, return auth payload
      console.warn(`User ${userPayload.uid} not found in Firestore, returning auth payload`);
      user = null;
    }
    
    return NextResponse.json({
      success: true,
      user: user || userPayload,
    });
  } catch (error) {
    console.error('Auth/me error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unauthorized',
      },
      { status: 401 }
    );
  }
}

