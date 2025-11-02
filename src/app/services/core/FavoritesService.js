// Servicio de Favoritos (Firebase)
import { db } from "../../../firebaseConfig";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

/**
 * @typedef {import('../models/user.model').User} User
 * @typedef {import('../models/course.model').Course} Course
 */

export class FavoritesService {
  static async getFavorites(userEmail) {
    if (!userEmail) return { courses: [], tutors: [] };

    const userRef = doc(db, "user", userEmail);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return { courses: [], tutors: [] };

    const data = userSnap.data();
    const courseIds = Array.isArray(data.favoriteCourses) ? data.favoriteCourses : [];
    const tutorIds  = Array.isArray(data.favoriteTutors)  ? data.favoriteTutors  : [];

    const courses = await Promise.all(
      courseIds.map(async (cid) => {
        const cSnap = await getDoc(doc(db, "course", cid));
        if (!cSnap.exists()) return null;
        const c = cSnap.data();
        const majorName = await FavoritesService.#resolveMajorName(c.major);
        return { id: cSnap.id, name: c.name ?? "", base_price: c.base_price ?? 0, majorName };
      })
    );

    const tutors = await Promise.all(
      tutorIds.map(async (tid) => {
        const tSnap = await getDoc(doc(db, "user", tid));
        if (!tSnap.exists()) return null;
        const t = tSnap.data();
        const majorName = await FavoritesService.#resolveMajorName(t.major);

        return {
          id: tSnap.id,
          name: t.name ?? "",
          isTutor: !!t.isTutor,
          // nuevos atributos (si no existen, caen en valores safe)
          rating: typeof t.rating === "number" ? t.rating : null,
          hourlyRate: typeof t.hourlyRate === "number" ? t.hourlyRate : null,
          bio: t.bio ?? "",
          subjects: Array.isArray(t.subjects) ? t.subjects : [],
          profileImage: t.profileImage ?? null,
          // confidenciales: NO se exponen en UI, pero los dejamos por si los necesitas luego
          email: t.email ?? "",
          phone_number: t.phone_number ?? "",
          majorName,
        };
      })
    );

    return { courses: courses.filter(Boolean), tutors: tutors.filter(Boolean) };
  }

  static async toggleCourseFavorite(userEmail, courseId, active) {
    if (!userEmail || !courseId) return;
    await updateDoc(doc(db, "user", userEmail), {
      favoriteCourses: active ? arrayRemove(courseId) : arrayUnion(courseId),
    });
  }

  static async toggleTutorFavorite(userEmail, tutorId, active) {
    if (!userEmail || !tutorId) return;
    await updateDoc(doc(db, "user", userEmail), {
      favoriteTutors: active ? arrayRemove(tutorId) : arrayUnion(tutorId),
    });
  }

  // Backwards-compatible aliases: some callers use the older names
  static async toggleFavoriteCourse(userEmail, courseId, active) {
    return FavoritesService.toggleCourseFavorite(userEmail, courseId, active);
  }

  static async toggleFavoriteTutor(userEmail, tutorId, active) {
    return FavoritesService.toggleTutorFavorite(userEmail, tutorId, active);
  }

  static async #resolveMajorName(majorRefOrString) {
    try {
      if (!majorRefOrString) return "";
      // Cuando viene como string: "ingenieria-industrial"
      if (typeof majorRefOrString === "string") {
        return majorRefOrString.replace(/[-_/]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
      }
      // Cuando viene como DocumentReference
      const snap = await getDoc(majorRefOrString);
      return snap?.exists() ? (snap.data().name ?? "") : "";
    } catch {
      return "";
    }
  }
}

export default FavoritesService;
