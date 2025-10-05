// Servicio de Favoritos (agnóstico al front)
// Si mañana cambias Firebase por otro backend, solo reemplazas
// las funciones dentro de "backend" sin tocar el resto del proyecto.

import { db } from "../../firebaseConfig";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

export class FavoritesService {
  /**
   * Obtiene los cursos y tutores favoritos del usuario.
   * @param {string} userEmail
   * @returns {Promise<{ courses: Array, tutors: Array }>}
   */
  static async getFavorites(userEmail) {
    if (!userEmail) return { courses: [], tutors: [] };

    const userRef = doc(db, "user", userEmail);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return { courses: [], tutors: [] };

    const data = userSnap.data();
    const courseIds = Array.isArray(data.favoritesCourses) ? data.favoritesCourses : [];
    const tutorIds  = Array.isArray(data.favoritesTutors)  ? data.favoritesTutors  : [];

    // Cargar cursos por ID
    const courses = await Promise.all(
      courseIds.map(async (cid) => {
        const cSnap = await getDoc(doc(db, "course", cid));
        if (!cSnap.exists()) return null;
        const c = cSnap.data();

        const majorName = await FavoritesService.#resolveMajorName(c.major);
        return {
          id: cSnap.id,
          name: c.name ?? "",
          base_price: c.base_price ?? 0,
          majorName,
        };
      })
    );

    // Cargar tutores por ID (emails en tu modelo)
    const tutors = await Promise.all(
      tutorIds.map(async (tid) => {
        const tSnap = await getDoc(doc(db, "user", tid));
        if (!tSnap.exists()) return null;
        const t = tSnap.data();

        const majorName = await FavoritesService.#resolveMajorName(t.major);
        return {
          id: tSnap.id,
          name: t.name ?? "",
          mail: t.mail ?? tSnap.id,
          phone_number: t.phone_number ?? "",
          majorName,
          isTutor: !!t.isTutor,
        };
      })
    );

    return {
      courses: courses.filter(Boolean),
      tutors: tutors.filter(Boolean),
    };
  }

  /**
   * Alterna favorito de curso para el usuario.
   * @param {string} userEmail
   * @param {string} courseId
   * @param {boolean} active  true si actualmente está en favoritos (lo quitará)
   */
  static async toggleCourseFavorite(userEmail, courseId, active) {
    if (!userEmail || !courseId) return;
    const userRef = doc(db, "user", userEmail);
    await updateDoc(userRef, {
      favoritesCourses: active ? arrayRemove(courseId) : arrayUnion(courseId),
    });
  }

  /**
   * Alterna favorito de tutor para el usuario.
   * @param {string} userEmail
   * @param {string} tutorId
   * @param {boolean} active  true si actualmente está en favoritos (lo quitará)
   */
  static async toggleTutorFavorite(userEmail, tutorId, active) {
    if (!userEmail || !tutorId) return;
    const userRef = doc(db, "user", userEmail);
    await updateDoc(userRef, {
      favoritesTutors: active ? arrayRemove(tutorId) : arrayUnion(tutorId),
    });
  }

  // ---------- Helpers privados ----------

  // Resuelve el nombre de la carrera cuando viene como DocumentReference.
  static async #resolveMajorName(majorRefOrPath) {
    try {
      if (!majorRefOrPath) return "";
      // Tu modelo actual guarda un DocumentReference: úsalo directo.
      const snap = await getDoc(majorRefOrPath);
      if (snap?.exists()) return snap.data().name ?? "";
      // (Opcional) si en algún momento te llegan strings tipo "/major/ISIS", aquí puedes parsearlos.
      return "";
    } catch {
      return "";
    }
  }
}
