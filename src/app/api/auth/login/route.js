/**
 * Login API Route
 * POST /api/auth/login - Login with email and password
 */

import { NextResponse } from 'next/server';
import * as authService from '@/lib/services/auth.service';

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    
    if (!body.email || !body.password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email and password are required',
        },
        { status: 400 }
      );
    }
    
    const result = await authService.login(body.email, body.password);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Login failed',
      },
      { status: 401 }
    );
  }
}

