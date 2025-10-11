import { db, auth } from '../../firebaseServerConfig';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

export class FirebaseAvailabilityService {
  static COLLECTION_NAME = 'availabilities';

  // Crear o actualizar una disponibilidad en Firestore
  static async saveAvailability(googleEventId, availabilityData) {
    try {
      // Verificar autenticación si está disponible
      if (auth.currentUser) {
        console.log('Saving with authenticated user:', auth.currentUser.email);
      } else {
        console.log('Saving without authentication (using permissive rules)');
      }

      const docRef = doc(db, this.COLLECTION_NAME, googleEventId);
      
      // Preparar datos para Firestore
      const firestoreData = {
        ...availabilityData,
        googleEventId,
        updatedAt: serverTimestamp(),
        syncedAt: serverTimestamp()
      };

      // Si es un nuevo documento, agregar createdAt
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        firestoreData.createdAt = serverTimestamp();
      }

      await setDoc(docRef, firestoreData, { merge: true });
      
      console.log('Availability saved to Firebase:', googleEventId);
      return { success: true, id: googleEventId };
    } catch (error) {
      console.error('Error saving availability to Firebase:', error);
      
      // Dar información más específica sobre el error
      if (error.code === 'permission-denied') {
        throw new Error(`Error de permisos de Firebase. Verifica las reglas de seguridad en la consola de Firebase. Detalles: ${error.message}`);
      }
      
      throw new Error(`Error guardando disponibilidad: ${error.message}`);
    }
  }

  // Obtener una disponibilidad específica por Google Event ID
  static async getAvailabilityById(googleEventId) {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, googleEventId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          // Convertir timestamps a objetos Date
          createdAt: docSnap.data().createdAt?.toDate(),
          updatedAt: docSnap.data().updatedAt?.toDate(),
          syncedAt: docSnap.data().syncedAt?.toDate(),
          startDateTime: docSnap.data().startDateTime?.toDate(),
          endDateTime: docSnap.data().endDateTime?.toDate(),
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting availability from Firebase:', error);
      throw new Error(`Error obteniendo disponibilidad: ${error.message}`);
    }
  }

  // Obtener todas las disponibilidades de un tutor
  static async getAvailabilitiesByTutor(tutorId, limitCount = 50) {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('tutorId', '==', tutorId),
        orderBy('startDateTime', 'asc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const availabilities = [];

      querySnapshot.forEach((doc) => {
        availabilities.push({
          id: doc.id,
          ...doc.data(),
          // Convertir timestamps a objetos Date
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          syncedAt: doc.data().syncedAt?.toDate(),
          startDateTime: doc.data().startDateTime?.toDate(),
          endDateTime: doc.data().endDateTime?.toDate(),
        });
      });

      return availabilities;
    } catch (error) {
      console.error('Error getting availabilities by tutor:', error);
      throw new Error(`Error obteniendo disponibilidades del tutor: ${error.message}`);
    }
  }

  // Obtener disponibilidades por materia
  static async getAvailabilitiesBySubject(subject, limitCount = 50) {
    try {
      console.log(`🔍 Buscando disponibilidades para materia: ${subject}`);
      
      const availabilities = [];
      const processedIds = new Set(); // Para evitar duplicados

      // Buscar por el campo subject (compatibilidad con datos existentes)
      try {
        const subjectQuery = query(
          collection(db, this.COLLECTION_NAME),
          where('subject', '==', subject),
          orderBy('startDateTime', 'asc'),
          limit(limitCount)
        );

        const subjectSnapshot = await getDocs(subjectQuery);
        subjectSnapshot.forEach((doc) => {
          if (!processedIds.has(doc.id)) {
            processedIds.add(doc.id);
            availabilities.push({
              id: doc.id,
              ...doc.data(),
              // Convertir timestamps a objetos Date
              createdAt: doc.data().createdAt?.toDate(),
              updatedAt: doc.data().updatedAt?.toDate(),
              syncedAt: doc.data().syncedAt?.toDate(),
              startDateTime: doc.data().startDateTime?.toDate(),
              endDateTime: doc.data().endDateTime?.toDate(),
            });
          }
        });
      } catch (subjectError) {
        console.warn('Error con consulta por subject, intentando sin orderBy...');
        
        // Fallback sin orderBy
        try {
          const simpleSubjectQuery = query(
            collection(db, this.COLLECTION_NAME),
            where('subject', '==', subject),
            limit(limitCount)
          );

          const subjectSnapshot = await getDocs(simpleSubjectQuery);
          subjectSnapshot.forEach((doc) => {
            if (!processedIds.has(doc.id)) {
              processedIds.add(doc.id);
              availabilities.push({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate(),
                syncedAt: doc.data().syncedAt?.toDate(),
                startDateTime: doc.data().startDateTime?.toDate(),
                endDateTime: doc.data().endDateTime?.toDate(),
              });
            }
          });
        } catch (fallbackError) {
          console.warn('Error en fallback de subject:', fallbackError);
        }
      }

      // Buscar por el campo subjects (nuevo campo con array de materias)
      try {
        const subjectsQuery = query(
          collection(db, this.COLLECTION_NAME),
          where('subjects', 'array-contains', subject),
          orderBy('startDateTime', 'asc'),
          limit(limitCount)
        );

        const subjectsSnapshot = await getDocs(subjectsQuery);
        subjectsSnapshot.forEach((doc) => {
          if (!processedIds.has(doc.id)) {
            processedIds.add(doc.id);
            availabilities.push({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate(),
              updatedAt: doc.data().updatedAt?.toDate(),
              syncedAt: doc.data().syncedAt?.toDate(),
              startDateTime: doc.data().startDateTime?.toDate(),
              endDateTime: doc.data().endDateTime?.toDate(),
            });
          }
        });
      } catch (subjectsError) {
        console.warn('Error con consulta por subjects, intentando sin orderBy...');
        
        // Fallback sin orderBy
        try {
          const simpleSubjectsQuery = query(
            collection(db, this.COLLECTION_NAME),
            where('subjects', 'array-contains', subject),
            limit(limitCount)
          );

          const subjectsSnapshot = await getDocs(simpleSubjectsQuery);
          subjectsSnapshot.forEach((doc) => {
            if (!processedIds.has(doc.id)) {
              processedIds.add(doc.id);
              availabilities.push({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate(),
                syncedAt: doc.data().syncedAt?.toDate(),
                startDateTime: doc.data().startDateTime?.toDate(),
                endDateTime: doc.data().endDateTime?.toDate(),
              });
            }
          });
        } catch (fallbackError) {
          console.warn('Error en fallback de subjects:', fallbackError);
        }
      }

      // Ordenar por fecha de inicio
      availabilities.sort((a, b) => {
        const dateA = new Date(a.startDateTime);
        const dateB = new Date(b.startDateTime);
        return dateA - dateB;
      });

      console.log(`✅ Encontradas ${availabilities.length} disponibilidades para ${subject}`);
      return availabilities;
    } catch (error) {
      console.error('Error getting availabilities by subject:', error);
      throw new Error(`Error obteniendo disponibilidades por materia: ${error.message}`);
    }
  }

  // Obtener disponibilidades en un rango de fechas
  static async getAvailabilitiesInDateRange(startDate, endDate, limitCount = 100) {
    try {
      const startTimestamp = Timestamp.fromDate(startDate);
      const endTimestamp = Timestamp.fromDate(endDate);

      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('startDateTime', '>=', startTimestamp),
        where('startDateTime', '<=', endTimestamp),
        orderBy('startDateTime', 'asc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const availabilities = [];

      querySnapshot.forEach((doc) => {
        availabilities.push({
          id: doc.id,
          ...doc.data(),
          // Convertir timestamps a objetos Date
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          syncedAt: doc.data().syncedAt?.toDate(),
          startDateTime: doc.data().startDateTime?.toDate(),
          endDateTime: doc.data().endDateTime?.toDate(),
        });
      });

      return availabilities;
    } catch (error) {
      console.error('Error getting availabilities in date range:', error);
      throw new Error(`Error obteniendo disponibilidades por rango de fechas: ${error.message}`);
    }
  }

  // Eliminar una disponibilidad de Firestore
  static async deleteAvailability(googleEventId) {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, googleEventId);
      await deleteDoc(docRef);
      
      console.log('Availability deleted from Firebase:', googleEventId);
      return { success: true, id: googleEventId };
    } catch (error) {
      console.error('Error deleting availability from Firebase:', error);
      throw new Error(`Error eliminando disponibilidad: ${error.message}`);
    }
  }

  // Verificar si una disponibilidad existe en Firebase
  static async availabilityExists(googleEventId) {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, googleEventId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      console.error('Error checking availability existence:', error);
      return false;
    }
  }

  // Convertir evento de Google Calendar a formato Firebase
  static googleEventToFirebaseFormat(googleEvent, tutorId, tutorEmail, calendarInfo = null) {
    try {
      // Extraer materia del título
      
      // Convertir fechas
      const startDateTime = new Date(googleEvent.start.dateTime || googleEvent.start.date);
      const endDateTime = new Date(googleEvent.end.dateTime || googleEvent.end.date);

      return {
        tutorId,
        tutorEmail,
        title: googleEvent.summary || 'Disponibilidad',
        description: googleEvent.description || '',
        startDateTime: Timestamp.fromDate(startDateTime),
        endDateTime: Timestamp.fromDate(endDateTime),
        location: googleEvent.location || 'No especificado',
        recurring: !!(googleEvent.recurrence && googleEvent.recurrence.length > 0),
        recurrenceRule: googleEvent.recurrence ? googleEvent.recurrence.join(';') : '',
        color: this.getRandomColor(),
        googleEventId: googleEvent.id,
        htmlLink: googleEvent.htmlLink || '',
        status: googleEvent.status || 'confirmed',
        // Información del calendario específico
        sourceCalendarId: calendarInfo?.id || 'unknown',
        sourceCalendarName: calendarInfo?.summary || 'Calendario Disponibilidad',
        fromAvailabilityCalendar: true // Marcador para identificar que viene del calendario específico
      };
    } catch (error) {
      console.error('Error converting Google event to Firebase format:', error);
      throw new Error(`Error convirtiendo evento: ${error.message}`);
    }
  }


  // Obtener color aleatorio para los eventos
  static getRandomColor() {
    const colors = [
      '#4CAF50', // Verde
      '#2196F3', // Azul
      '#FF9800', // Naranja
      '#9C27B0', // Púrpura
      '#F44336', // Rojo
      '#795548', // Marrón
      '#3F51B5', // Índigo
      '#607D8B', // Azul gris
      '#FFC107', // Ámbar
      '#009688', // Verde azulado
      '#E91E63', // Rosa
      '#673AB7', // Púrpura profundo
      '#FF5722', // Naranja profundo
      '#8BC34A', // Verde claro
      '#00BCD4', // Cian
      '#CDDC39', // Lima
      '#FF9E80', // Naranja claro
      '#A1C4FD', // Azul claro
      '#C2E9FB', // Azul muy claro
      '#FFB74D'  // Naranja medio
    ];
    
    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
  }

  // Sincronizar múltiples eventos de Google Calendar con Firebase
  static async syncGoogleEventsToFirebase(googleEvents, tutorId, tutorEmail, calendarInfo = null) {
    try {
      const results = {
        created: 0,
        updated: 0,
        errors: []
      };

      for (const googleEvent of googleEvents) {
        try {
          const firebaseData = this.googleEventToFirebaseFormat(googleEvent, tutorId, tutorEmail, calendarInfo);
          const exists = await this.availabilityExists(googleEvent.id);
          
          await this.saveAvailability(googleEvent.id, firebaseData);
          
          if (exists) {
            results.updated++;
          } else {
            results.created++;
          }
        } catch (error) {
          results.errors.push({
            eventId: googleEvent.id,
            error: error.message
          });
        }
      }

      console.log('Sync results:', results);
      return results;
    } catch (error) {
      console.error('Error syncing Google events to Firebase:', error);
      throw new Error(`Error sincronizando eventos: ${error.message}`);
    }
  }
} 