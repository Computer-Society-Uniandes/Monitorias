import { auth } from '../../firebaseConfig';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';

/**
 * @typedef {import('../models/user.model').User} User
 */

export class AuthService {
  
  // Iniciar sesión con email y contraseña
  static async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Firebase Auth maneja la persistencia automáticamente
      // Los datos del usuario se obtienen via onAuthStateChanged en AuthContext
      
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified
        }
      };
    } catch (error) {
      console.error('Error signing in:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  // Registrar nuevo usuario
  static async signUp(email, password, displayName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Actualizar el nombre del usuario
      if (displayName) {
        await updateProfile(user, { displayName });
      }
      
      // Firebase Auth maneja la persistencia automáticamente
      // Los datos del usuario se obtienen via onAuthStateChanged en AuthContext
      
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: displayName,
          emailVerified: user.emailVerified
        }
      };
    } catch (error) {
      console.error('Error signing up:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  // Cerrar sesión
  static async signOut() {
    try {
      await signOut(auth);
      
      // Firebase Auth maneja la limpieza de sesión automáticamente
      // El estado se actualiza via onAuthStateChanged en AuthContext
      
      return { success: true };
    } catch (error) {
      console.error('Error signing out:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  // Obtener usuario actual
  static getCurrentUser() {
    return auth.currentUser;
  }

  // Escuchar cambios de autenticación
  static onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  }

  // Obtener token de autenticación
  static async getAuthToken() {
    const user = auth.currentUser;
    if (user) {
      try {
        const token = await user.getIdToken();
        return token;
      } catch (error) {
        console.error('Error getting auth token:', error);
        return null;
      }
    }
    return null;
  }

  // Verificar si el usuario está autenticado
  static isAuthenticated() {
    return !!auth.currentUser;
  }

  // Mensajes de error en español
  static getErrorMessage(errorCode) {
    const messages = {
      'auth/user-not-found': 'No se encontró ningún usuario con este email',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/email-already-in-use': 'Este email ya está registrado',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
      'auth/invalid-email': 'El email no es válido',
      'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
      'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
      'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
      'auth/invalid-credential': 'Credenciales inválidas',
      'auth/missing-password': 'La contraseña es requerida'
    };
    
    return messages[errorCode] || 'Error de autenticación. Intenta nuevamente.';
  }
} 