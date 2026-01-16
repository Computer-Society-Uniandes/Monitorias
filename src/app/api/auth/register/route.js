/**
 * Register API Route
 * POST /api/auth/register - Register a new user
 */

import { NextResponse } from 'next/server';
import * as authService from '@/lib/services/auth.service';

/**
 * POST /api/auth/register
 * Body: { name, email, password, phone, majorId, isTutor? }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.email || !body.password || !body.phone || !body.majorId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, email, password, phone, majorId',
        },
        { status: 400 }
      );
    }
    
    const result = await authService.register(body);
    
    return NextResponse.json(
      {
        success: true,
        uid: result.uid,
        customToken: result.customToken,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error during registration',
      },
      { status: 400 }
    );
  }
}

