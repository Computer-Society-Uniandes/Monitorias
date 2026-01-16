/**
 * Firebase Auth Middleware for Next.js API Routes
 * Verifies Firebase ID tokens from Authorization header
 */

import { getAuth } from '../firebase/admin';

/**
 * Verify Firebase ID token from request
 * @param {Request} request - Next.js request object
 * @returns {Promise<Object>} Decoded token with user info
 */
export async function verifyAuthToken(request) {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');

  if (!authHeader || typeof authHeader !== 'string') {
    throw new Error('No Authorization header provided');
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new Error('Invalid Authorization header format. Expected: Bearer <token>');
  }

  const token = parts[1];

  try {
    const auth = getAuth();
    const decoded = await auth.verifyIdToken(token);
    
    return {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name || decoded.displayName || null,
      claims: decoded,
    };
  } catch (err) {
    console.error('Token verification failed:', err);
    throw new Error('Invalid or expired token');
  }
}

/**
 * Middleware wrapper for protected routes
 * Usage: const user = await requireAuth(request);
 */
export async function requireAuth(request) {
  try {
    return await verifyAuthToken(request);
  } catch (error) {
    throw error;
  }
}

const authMiddleware = {
  verifyAuthToken,
  requireAuth,
};

export default authMiddleware;
