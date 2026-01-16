/**
 * Auth Service
 * Handles Firebase Authentication operations
 */

import { getAuth } from '../firebase/admin';
import * as userService from './user.service';
import axios from 'axios';

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

/**
 * Normalize phone number to international format
 * @param {string} phone - Phone number
 * @returns {string|undefined}
 */
function normalizePhone(phone) {
  if (!phone) return undefined;
  const trimmed = phone.replace(/\s+/g, '');
  if (!trimmed.startsWith('+') && trimmed.length === 10) {
    // Assuming Colombia (+57)
    return `+57${trimmed}`;
  }
  return trimmed;
}

/**
 * Get user-friendly error message
 * @param {string} code - Error code
 * @returns {string}
 */
function getErrorMessage(code) {
  const map = {
    'EMAIL_NOT_FOUND': 'No se encontró ningún usuario con este email',
    'INVALID_PASSWORD': 'Contraseña incorrecta',
    'USER_DISABLED': 'Esta cuenta ha sido deshabilitada',
    'EMAIL_EXISTS': 'Este email ya está registrado',
    'WEAK_PASSWORD : Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
    'auth/user-not-found': 'No se encontró ningún usuario con este email',
    'auth/wrong-password': 'Contraseña incorrecta',
    'auth/email-already-in-use': 'Este email ya está registrado',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
    'auth/invalid-email': 'El email no es válido',
    'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
  };
  return map[code] || 'Error de autenticación. Intenta nuevamente.';
}

/**
 * Register a new user
 * @param {Object} payload - Registration data
 * @returns {Promise<Object>}
 */
export async function register(payload) {
  try {
    console.log('Registering user:', payload);
    const auth = getAuth();
    
    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email: payload.email,
      password: payload.password,
      displayName: payload.name,
      phoneNumber: normalizePhone(payload.phone),
    });

    // Update display name if provided
    if (payload.name) {
      await auth.updateUser(userRecord.uid, { displayName: payload.name });
    }

    // Create Firestore profile
    const profile = {
      name: payload.name,
      email: payload.email.toLowerCase(),
      isTutor: !!payload.isTutor,
      phone: normalizePhone(payload.phone),
      majorId: payload.majorId,
    };

    try {
      await userService.saveUser(userRecord.uid, profile);
    } catch (firestoreErr) {
      console.error('Failed to persist profile after creating Auth user — rolling back', firestoreErr);
      // Rollback: delete auth user
      try {
        await auth.deleteUser(userRecord.uid);
      } catch (delErr) {
        console.error('Rollback failed deleting auth user', delErr);
      }
      throw firestoreErr;
    }

    // Create custom token for immediate login
    const customToken = await auth.createCustomToken(userRecord.uid);

    return {
      success: true,
      uid: userRecord.uid,
      customToken,
    };
  } catch (error) {
    console.error('Register error:', error?.message || error);
    throw new Error(getErrorMessage(error?.code || error?.message));
  }
}

/**
 * Login with email and password (uses Firebase REST API)
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>}
 */
export async function login(email, password) {
  if (!FIREBASE_API_KEY) {
    console.error('FIREBASE_API_KEY missing');
    throw new Error('Server misconfiguration: FIREBASE_API_KEY missing');
  }

  try {
    const resp = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      { email, password, returnSecureToken: true },
      { timeout: 10000 }
    );

    return {
      success: true,
      ...resp.data,
    };
  } catch (err) {
    console.warn('Login failed:', err?.response?.data || err.message);
    const code = err?.response?.data?.error?.message || err?.message;
    throw new Error(getErrorMessage(code));
  }
}

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Firebase refresh token
 * @returns {Promise<Object>}
 */
export async function refresh(refreshToken) {
  if (!FIREBASE_API_KEY) {
    console.error('FIREBASE_API_KEY missing');
    throw new Error('Server misconfiguration: FIREBASE_API_KEY missing');
  }

  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refreshToken);

    const resp = await axios.post(
      `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`,
      params.toString(),
      { 
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, 
        timeout: 10000 
      }
    );

    return { 
      success: true, 
      ...resp.data 
    };
  } catch (err) {
    console.warn('Refresh token failed:', err?.response?.data || err.message);
    throw new Error('Refresh token inválido');
  }
}

/**
 * Revoke all refresh tokens for a user (logout)
 * @param {string} uid - User UID
 * @returns {Promise<Object>}
 */
export async function revokeRefreshTokens(uid) {
  try {
    const auth = getAuth();
    await auth.revokeRefreshTokens(uid);
    return { success: true };
  } catch (err) {
    console.error('Error revoking refresh tokens:', err);
    throw err;
  }
}

/**
 * Verify ID token
 * @param {string} idToken - Firebase ID token
 * @returns {Promise<Object>}
 */
export async function verifyIdToken(idToken) {
  try {
    const auth = getAuth();
    const decoded = await auth.verifyIdToken(idToken);
    return { success: true, decoded };
  } catch (err) {
    console.warn('verifyIdToken failed:', err?.message || err);
    throw new Error('Token inválido o expirado');
  }
}

export default {
  register,
  login,
  refresh,
  revokeRefreshTokens,
  verifyIdToken,
};

