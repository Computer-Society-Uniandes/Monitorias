import { NextResponse } from 'next/server';
import { FirebaseAvailabilityService } from '../../../services/FirebaseAvailabilityService';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({
        error: 'eventId parameter is required'
      }, { status: 400 });
    }

    // Verificar si el evento existe en Firebase
    const exists = await FirebaseAvailabilityService.availabilityExists(eventId);

    return NextResponse.json({
      exists,
      eventId
    });

  } catch (error) {
    console.error('Error checking event existence:', error);
    return NextResponse.json({
      error: error.message || 'Error checking event existence',
      exists: false
    }, { status: 500 });
  }
} 