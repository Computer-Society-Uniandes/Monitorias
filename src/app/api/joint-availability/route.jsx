import { NextResponse } from 'next/server';
import { FirebaseAvailabilityService } from '../../services/FirebaseAvailabilityService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebaseServerConfig';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    
    if (!subject) {
      return NextResponse.json(
        { error: 'Subject parameter is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Joint availability API called for subject: ${subject}`);

    // 1) Buscar tutores que enseñan la materia (robusto a nombre/código y colección)
    let tutors = [];
    let tutorEmails = [];

    const pushTutor = (docSnap) => {
      const data = docSnap.data();
      const item = { id: docSnap.id, ...data };
      // Asegurar campo mail/email
      const email = item.email || item.mail || item.id;
      if (!email) return; // sin correo, omitimos
      // Evitar duplicados por email
      if (!tutorEmails.includes(email)) {
        tutors.push({ ...item, email });
        tutorEmails.push(email);
      }
    };

    try {
      // Colección 'user'
      const tutorsQueryUser = query(
        collection(db, 'user'),
        where('isTutor', '==', true),
        where('subjects', 'array-contains', subject)
      );
      const tutorsSnapshotUser = await getDocs(tutorsQueryUser);
      tutorsSnapshotUser.forEach(pushTutor);

      // Colección 'users' (por si acaso)
      const tutorsQueryUsers = query(
        collection(db, 'users'),
        where('isTutor', '==', true),
        where('subjects', 'array-contains', subject)
      );
      const tutorsSnapshotUsers = await getDocs(tutorsQueryUsers);
      tutorsSnapshotUsers.forEach(pushTutor);

      console.log(`👨‍🏫 Found ${tutors.length} tutors across collections`);
    } catch (dbError) {
      console.error('❌ Error querying tutors:', dbError);
      // No abortamos; aún podemos calcular slots por materia global
    }

    // 2) Obtener TODAS las disponibilidades por materia y agrupar por tutorEmail
    let groupedByTutor = new Map();
    try {
      const subjectAvailabilities = await FirebaseAvailabilityService.getAvailabilitiesBySubject(subject, 500);
      const now = new Date();

      subjectAvailabilities.forEach((avail) => {
        const start = avail.startDateTime instanceof Date ? avail.startDateTime : new Date(avail.startDateTime);
        const end = avail.endDateTime instanceof Date ? avail.endDateTime : new Date(avail.endDateTime);
        if (!start || isNaN(start)) return;
        // Incluir si el evento aún no ha terminado
        if (end && end <= now) return;

        const tutorEmail = avail.tutorEmail || avail.tutorId || '';
        if (!tutorEmail) return;

        const slot = {
          id: avail.id,
          title: avail.title || 'Disponible',
          date: start.toISOString().split('T')[0],
          startTime: start.toTimeString().substring(0, 5),
          endTime: end ? end.toTimeString().substring(0, 5) : null,
          start: start.toISOString(),
          end: end ? end.toISOString() : null,
          tutorEmail: tutorEmail,
          subject: avail.subject,
          description: avail.description,
          location: avail.location,
          recurring: avail.recurring || false,
          available: true,
          source: 'firebase'
        };

        if (!groupedByTutor.has(tutorEmail)) {
          groupedByTutor.set(tutorEmail, []);
        }
        groupedByTutor.get(tutorEmail).push(slot);
      });

      console.log(`📚 Grouped subject availabilities by ${groupedByTutor.size} tutors`);
    } catch (error) {
      console.error('❌ Error fetching subject availabilities:', error);
    }

    // 3) Construir respuesta por tutor (incluyendo tutores sin slots)
    const availabilities = [];

    // A) para tutores encontrados por colección
    tutorEmails.forEach((email) => {
      const slots = groupedByTutor.get(email) || [];
      availabilities.push({
        tutorEmail: email,
        slots,
        connected: slots.length > 0, // heurística
        error: null,
        totalSlots: slots.length,
      });
      // quitar del mapa para luego agregar los restantes
      if (groupedByTutor.has(email)) groupedByTutor.delete(email);
    });

    // B) agregar tutores que tengan slots pero no aparecieron en colecciones
    for (const [email, slots] of groupedByTutor.entries()) {
      availabilities.push({
        tutorEmail: email,
        slots,
        connected: true,
        error: null,
        totalSlots: slots.length,
      });
      // Opcional: añadir un tutor "mínimo" para mostrar en la lista
      if (!tutors.find((t) => t.email === email)) {
        tutors.push({ id: email, name: 'Tutor', email: email, rating: 4.5, totalSessions: slots.length });
      }
    }

    // 4) Fallback: si no se encontraron slots por materia, intentar por cada tutor
    let totalSlots = availabilities.reduce((acc, a) => acc + a.slots.length, 0);
  if (totalSlots === 0 && tutorEmails.length > 0) {
      console.log('⚠️ No subject-based slots found. Falling back to per-tutor availability fetch...');
      const perTutorPromises = tutorEmails.map(async (email) => {
        try {
          const list = await FirebaseAvailabilityService.getAvailabilitiesByTutor(email, 200);
          const now = new Date();
          const slots = (list || [])
            .map((avail) => {
              const start = avail.startDateTime instanceof Date ? avail.startDateTime : new Date(avail.startDateTime);
              const end = avail.endDateTime instanceof Date ? avail.endDateTime : new Date(avail.endDateTime);
              if (!start || isNaN(start)) return null;
              // Incluir si el evento aún no ha terminado
              if (end && end <= now) return null;
              return {
                id: avail.id,
                title: avail.title || 'Disponible',
                date: start.toISOString().split('T')[0],
                startTime: start.toTimeString().substring(0, 5),
                endTime: end ? end.toTimeString().substring(0, 5) : null,
                start: start.toISOString(),
                end: end ? end.toISOString() : null,
                tutorEmail: avail.tutorEmail || email,
                subject: avail.subject,
                description: avail.description,
                location: avail.location,
                recurring: avail.recurring || false,
                available: true,
                source: 'firebase',
              };
            })
            .filter(Boolean);

          return { email, slots };
        } catch (e) {
          console.warn(`Fallback per-tutor fetch failed for ${email}:`, e);
          return { email, slots: [] };
        }
      });

      const perTutorResults = await Promise.all(perTutorPromises);
      // Merge into availabilities, preserving existing entries structure
      availabilities.length = 0; // reset
      perTutorResults.forEach(({ email, slots }) => {
        availabilities.push({
          tutorEmail: email,
          slots,
          connected: slots.length > 0,
          error: null,
          totalSlots: slots.length,
        });
      });
      totalSlots = availabilities.reduce((acc, a) => acc + a.slots.length, 0);
    }

    const connectedTutors = availabilities.filter((a) => a.connected).length;
    const tutorsWithSlots = availabilities.filter((a) => a.slots.length > 0).length;

    console.log(`📊 Joint availability summary:`, {
      totalTutors: tutors.length,
      totalSlots,
      connectedTutors,
      tutorsWithSlots,
    });

    return NextResponse.json({
      success: true,
      tutors,
      availabilities,
      stats: {
        totalTutors: tutors.length,
        connectedTutors,
        totalSlots,
        tutorsWithSlots,
        averageSlotsPerTutor: tutors.length > 0 ? Math.round(totalSlots / tutors.length) : 0,
      },
    });

  } catch (error) {
    console.error('❌ Error in joint availability API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: `Error fetching joint availability: ${error.message}`,
        tutors: [],
        availabilities: []
      },
      { status: 500 }
    );
  }
}