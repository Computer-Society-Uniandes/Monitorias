import { db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import pino from 'pino';

const logger = pino({ name: 'FavoritesService' });

export class FavoritesService {

    /**
     * Agrega un tutor a los favoritos del usuario
     * @param {string} userEmail - Email del usuario
     * @param {string} tutorEmail - Email del tutor a agregar
     * @returns {Promise<{success: boolean, message?: string, error?: string}>}
     */
    static async addFavoriteTutor(userEmail, tutorEmail) {
        try {
            logger.info({ userEmail, tutorEmail }, 'Agregando tutor a favoritos');

            const userRef = doc(db, 'user', userEmail);
            await updateDoc(userRef, {
                favoriteTutors: arrayUnion(tutorEmail)
            });

            logger.info({ userEmail, tutorEmail }, 'Tutor agregado a favoritos exitosamente');
            return { success: true, message: 'Tutor agregado a favoritos' };
        } catch (error) {
            logger.error({ error, userEmail, tutorEmail }, 'Error agregando tutor a favoritos');
            return { success: false, error: `Error agregando tutor a favoritos: ${error.message}` };
        }
    }

    /**
     * Remueve un tutor de los favoritos del usuario
     * @param {string} userEmail - Email del usuario
     * @param {string} tutorEmail - Email del tutor a remover
     * @returns {Promise<{success: boolean, message?: string, error?: string}>}
     */
    static async removeFavoriteTutor(userEmail, tutorEmail) {
        try {
            logger.info({ userEmail, tutorEmail }, 'Removiendo tutor de favoritos');

            const userRef = doc(db, 'user', userEmail);
            await updateDoc(userRef, {
                favoriteTutors: arrayRemove(tutorEmail)
            });

            logger.info({ userEmail, tutorEmail }, 'Tutor removido de favoritos exitosamente');
            return { success: true, message: 'Tutor removido de favoritos' };
        } catch (error) {
            logger.error({ error, userEmail, tutorEmail }, 'Error removiendo tutor de favoritos');
            return { success: false, error: `Error removiendo tutor de favoritos: ${error.message}` };
        }
    }

    /**
     * Agrega una materia a los favoritos del usuario
     * @param {string} userEmail - Email del usuario
     * @param {string} courseCode - Código de la materia a agregar
     * @returns {Promise<{success: boolean, message?: string, error?: string}>}
     */
    static async addFavoriteCourse(userEmail, courseCode) {
        try {
            logger.info({ userEmail, courseCode }, 'Agregando materia a favoritos');

            const userRef = doc(db, 'user', userEmail);
            await updateDoc(userRef, {
                favoriteCourses: arrayUnion(courseCode)
            });

            logger.info({ userEmail, courseCode }, 'Materia agregada a favoritos exitosamente');
            return { success: true, message: 'Materia agregada a favoritos' };
        } catch (error) {
            logger.error({ error, userEmail, courseCode }, 'Error agregando materia a favoritos');
            return { success: false, error: `Error agregando materia a favoritos: ${error.message}` };
        }
    }

    /**
     * Remueve una materia de los favoritos del usuario
     * @param {string} userEmail - Email del usuario
     * @param {string} courseCode - Código de la materia a remover
     * @returns {Promise<{success: boolean, message?: string, error?: string}>}
     */
    static async removeFavoriteCourse(userEmail, courseCode) {
        try {
            logger.info({ userEmail, courseCode }, 'Removiendo materia de favoritos');

            const userRef = doc(db, 'user', userEmail);
            await updateDoc(userRef, {
                favoriteCourses: arrayRemove(courseCode)
            });

            logger.info({ userEmail, courseCode }, 'Materia removida de favoritos exitosamente');
            return { success: true, message: 'Materia removida de favoritos' };
        } catch (error) {
            logger.error({ error, userEmail, courseCode }, 'Error removiendo materia de favoritos');
            return { success: false, error: `Error removiendo materia de favoritos: ${error.message}` };
        }
    }

    /**
     * Obtiene todos los favoritos de un usuario (tutores y materias)
     * @param {string} userEmail - Email del usuario
     * @returns {Promise<{success: boolean, data?: {tutors: string[], courses: string[]}, error?: string}>}
     */
    static async getFavorites(userEmail) {
        try {
            logger.info({ userEmail }, 'Obteniendo favoritos del usuario');

            const userRef = doc(db, 'user', userEmail);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                logger.warn({ userEmail }, 'Usuario no encontrado');
                return { success: false, error: 'Usuario no encontrado' };
            }

            const userData = userDoc.data();
            const favorites = {
                tutors: userData.favoriteTutors || [],
                courses: userData.favoriteCourses || []
            };

            logger.info({ userEmail, favorites }, 'Favoritos obtenidos exitosamente');
            return { success: true, data: favorites };
        } catch (error) {
            logger.error({ error, userEmail }, 'Error obteniendo favoritos');
            return { success: false, error: `Error obteniendo favoritos: ${error.message}` };
        }
    }

    /**
     * Verifica si un tutor está en favoritos
     * @param {string} userEmail - Email del usuario
     * @param {string} tutorEmail - Email del tutor
     * @returns {Promise<boolean>}
     */
    static async isFavoriteTutor(userEmail, tutorEmail) {
        try {
            const result = await this.getFavorites(userEmail);
            if (result.success && result.data) {
                return result.data.tutors.includes(tutorEmail);
            }
            return false;
        } catch (error) {
            logger.error({ error, userEmail, tutorEmail }, 'Error verificando tutor favorito');
            return false;
        }
    }

    /**
     * Verifica si una materia está en favoritos
     * @param {string} userEmail - Email del usuario
     * @param {string} courseCode - Código de la materia
     * @returns {Promise<boolean>}
     */
    static async isFavoriteCourse(userEmail, courseCode) {
        try {
            const result = await this.getFavorites(userEmail);
            if (result.success && result.data) {
                return result.data.courses.includes(courseCode);
            }
            return false;
        } catch (error) {
            logger.error({ error, userEmail, courseCode }, 'Error verificando materia favorita');
            return false;
        }
    }

    /**
     * Toggle favorito de tutor (agregar si no existe, remover si existe)
     * @param {string} userEmail - Email del usuario
     * @param {string} tutorEmail - Email del tutor
     * @returns {Promise<{success: boolean, isFavorite: boolean, message?: string, error?: string}>}
     */
    static async toggleFavoriteTutor(userEmail, tutorEmail) {
        try {
            const isFavorite = await this.isFavoriteTutor(userEmail, tutorEmail);

            if (isFavorite) {
                const result = await this.removeFavoriteTutor(userEmail, tutorEmail);
                return { ...result, isFavorite: false };
            } else {
                const result = await this.addFavoriteTutor(userEmail, tutorEmail);
                return { ...result, isFavorite: true };
            }
        } catch (error) {
            logger.error({ error, userEmail, tutorEmail }, 'Error toggle tutor favorito');
            return { success: false, isFavorite: false, error: `Error: ${error.message}` };
        }
    }

    /**
     * Toggle favorito de materia (agregar si no existe, remover si existe)
     * @param {string} userEmail - Email del usuario
     * @param {string} courseCode - Código de la materia
     * @returns {Promise<{success: boolean, isFavorite: boolean, message?: string, error?: string}>}
     */
    static async toggleFavoriteCourse(userEmail, courseCode) {
        try {
            const isFavorite = await this.isFavoriteCourse(userEmail, courseCode);

            if (isFavorite) {
                const result = await this.removeFavoriteCourse(userEmail, courseCode);
                return { ...result, isFavorite: false };
            } else {
                const result = await this.addFavoriteCourse(userEmail, courseCode);
                return { ...result, isFavorite: true };
            }
        } catch (error) {
            logger.error({ error, userEmail, courseCode }, 'Error toggle materia favorita');
            return { success: false, isFavorite: false, error: `Error: ${error.message}` };
        }
    }
}
