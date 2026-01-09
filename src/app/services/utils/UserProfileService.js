import { API_URL } from '../../../config/api';

export const UserProfileService = {
  getUserProfile: async (identifier) => {
    try {
      // Determinar si es email o ID
      const isEmail = identifier.includes('@');
      let url = `${API_URL}/user/${identifier}`;
      
      if (isEmail) {
        // Endpoint actualizado según instrucciones del backend: GET /api/user/by-email/:email
        url = `${API_URL}/user/by-email/${identifier}`;
      }

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
        // credentials: 'include', // Removed to avoid CORS issues with some backends
      });

      if (!response.ok) {
        // Si falla el endpoint nuevo, intentar el anterior para email
        if (isEmail) {
             console.warn('Failed with /by-email/, trying /email/');
             const fallbackResponse = await fetch(`${API_URL}/user/email/${identifier}`);
             if (fallbackResponse.ok) {
                 const data = await fallbackResponse.json();
                 return { success: true, data };
             }
        }

        const errorData = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: errorData.message || errorData.error || 'User not found' 
        };
      }
      const data = await response.json();
      // Backend returns { success: true, user: {...} } or just the user object
      return { 
        success: data.success !== false, 
        data: data.user || data 
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return { success: false, error: error.message };
    }
  },

  updateUserProfile: async (uid, profileData) => {
    try {
      // Endpoint actualizado: PUT /api/user/:uid
      // Nota: El frontend debe pasar el UID, no el email, para actualizar
      const response = await fetch(`${API_URL}/user/${uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  createUser: async (userData) => {
    try {
        // Endpoint actualizado: POST /api/user
        const response = await fetch(`${API_URL}/user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        if (!response.ok) {
            throw new Error('Failed to create user');
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
  },

  getTutorCourses: async (id) => {
    try {
      // Intentar obtener el tutor por email para sacar sus materias
      const response = await fetch(`${API_URL}/courses?email=${encodeURIComponent(id)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tutor courses');
      }
      const data = await response.json();
      return { success: true, data: data.courses || data.materias || [] };
    } catch (error) {
      console.error('Error getting tutor courses:', error);
      return { success: false, error: error.message };
    }
  }
};
