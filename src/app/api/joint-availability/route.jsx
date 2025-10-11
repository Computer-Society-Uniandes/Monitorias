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

    // 1. Obtener todos los tutores que enseñan la materia
    let tutors = [];
    let tutorEmails = [];
    
    try {
      const tutorsQuery = query(
        collection(db, 'user'),
        where('isTutor', '==', true),
        where('subjects', 'array-contains', subject)
      );
      
      const tutorsSnapshot = await getDocs(tutorsQuery);
      
      tutorsSnapshot.forEach((doc) => {
        const tutorData = { id: doc.id, ...doc.data() };
        tutors.push(tutorData);
        tutorEmails.push(tutorData.mail);
      });

      console.log(`👨‍🏫 Found ${tutors.length} tutors: ${tutorEmails.join(', ')}`);
    } catch (dbError) {
      console.error('❌ Error querying tutors:', dbError);
      return NextResponse.json(
        { 
          success: false,
          error: `Error accessing database: ${dbError.message}`,
          tutors: [],
          availabilities: []
        },
        { status: 500 }
      );
    }

    if (tutors.length === 0) {
      return NextResponse.json({
        success: true,
        tutors: [],
        availabilities: [],
        stats: {
          totalTutors: 0,
          connectedTutors: 0,
          totalSlots: 0,
          tutorsWithSlots: 0,
          averageSlotsPerTutor: 0
        }
      });
    }

    // 2. Obtener disponibilidad usando el servicio existente
    const availabilityPromises = tutorEmails.map(async (email) => {
      try {
        console.log(`📅 Fetching availability for ${email}`);
        const availabilities = await FirebaseAvailabilityService.getAvailabilitiesByTutor(email, 100);
        
        // Convertir formato a lo que espera el frontend
        const slots = availabilities.map(avail => ({
          id: avail.id,
          title: avail.title || 'Disponible',
          date: avail.startDateTime ? avail.startDateTime.toISOString().split('T')[0] : null,
          startTime: avail.startDateTime ? avail.startDateTime.toTimeString().substring(0, 5) : null,
          endTime: avail.endDateTime ? avail.endDateTime.toTimeString().substring(0, 5) : null,
          start: avail.startDateTime ? avail.startDateTime.toISOString() : null,
          end: avail.endDateTime ? avail.endDateTime.toISOString() : null,
          tutorEmail: avail.tutorEmail,
          subject: avail.subject,
          description: avail.description,
          location: avail.location,
          recurring: avail.recurring || false,
          available: true,
          source: 'firebase'
        })).filter(slot => {
          // Solo slots futuros
          if (!slot.start) return false;
          const slotDate = new Date(slot.start);
          return slotDate > new Date();
        });
        
        console.log(`📅 Found ${slots.length} future slots for ${email}`);
        
        return {
          tutorEmail: email,
          slots: slots,
          connected: true,
          error: null,
          totalSlots: slots.length
        };
      } catch (error) {
        console.error(`❌ Error fetching availability for ${email}:`, error);
        return {
          tutorEmail: email,
          slots: [],
          connected: false,
          error: error.message,
          totalSlots: 0
        };
      }
    });

    const availabilities = await Promise.all(availabilityPromises);
    
    // 3. Calcular estadísticas
    const totalSlots = availabilities.reduce((acc, a) => acc + a.slots.length, 0);
    const connectedTutors = availabilities.filter(a => a.connected).length;
    const tutorsWithSlots = availabilities.filter(a => a.slots.length > 0).length;

    console.log(`📊 Joint availability summary:`, {
      totalTutors: tutors.length,
      totalSlots,
      connectedTutors,
      tutorsWithSlots
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
        averageSlotsPerTutor: tutors.length > 0 ? Math.round(totalSlots / tutors.length) : 0
      }
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