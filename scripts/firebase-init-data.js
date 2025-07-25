// Script para inicializar Firebase con datos de prueba
// Ejecutar este script una vez para poblar la base de datos

const admin = require('firebase-admin');

// Configuración de Firebase usando las credenciales directas
const serviceAccount = {
  "type": "service_account",
  "project_id": "calico-5980a",
  "private_key_id": "tu_private_key_id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nTU_PRIVATE_KEY_AQUI\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@calico-5980a.iam.gserviceaccount.com",
  "client_id": "tu_client_id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40calico-5980a.iam.gserviceaccount.com"
};

// ⚠️ ALTERNATIVA MÁS SIMPLE: usar reglas permisivas temporalmente
// Si no tienes las credenciales admin, usa el SDK cliente normal:

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, Timestamp } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDb2GN2-LekkIvCWHxosb4hAndg96JPSOo",
  authDomain: "calico-5980a.firebaseapp.com",
  projectId: "calico-5980a",
  storageBucket: "calico-5980a.firebasestorage.app",
  messagingSenderId: "1056254794426",
  appId: "1:1056254794426:web:c5180b737a674fd6188083",
  measurementId: "G-RT5XVGCN92"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function initializeFirebaseData() {
  console.log('🚀 Iniciando población de datos en Firebase...');

  try {
    // 1. Crear carreras (major)
    console.log('📚 Creando carreras...');
    
    await setDoc(doc(db, 'major', 'ingenieria-sistemas'), {
      name: 'Ingeniería de Sistemas y Computación',
      faculty: 'Ingeniería',
      description: 'Formación integral en desarrollo de software y sistemas computacionales',
      duration: 10,
      type: 'Pregrado'
    });

    await setDoc(doc(db, 'major', 'matematicas'), {
      name: 'Matemáticas',
      faculty: 'Ciencias',
      description: 'Formación en matemáticas puras y aplicadas',
      duration: 8,
      type: 'Pregrado'
    });

    await setDoc(doc(db, 'major', 'ingenieria-civil'), {
      name: 'Ingeniería Civil',
      faculty: 'Ingeniería',
      description: 'Formación en construcción y diseño de infraestructura',
      duration: 10,
      type: 'Pregrado'
    });

    await setDoc(doc(db, 'major', 'fisica'), {
      name: 'Física',
      faculty: 'Ciencias',
      description: 'Formación en física teórica y experimental',
      duration: 8,
      type: 'Pregrado'
    });

    await setDoc(doc(db, 'major', 'ingenieria-industrial'), {
      name: 'Ingeniería Industrial',
      faculty: 'Ingeniería',
      description: 'Optimización de procesos y sistemas industriales',
      duration: 10,
      type: 'Pregrado'
    });

    await setDoc(doc(db, 'major', 'quimica'), {
      name: 'Química',
      faculty: 'Ciencias',
      description: 'Formación en química pura y aplicada',
      duration: 8,
      type: 'Pregrado'
    });

    // 2. Crear materias (course)
    console.log('📖 Creando materias...');
    
    await setDoc(doc(db, 'course', 'MATE1105'), {
      name: 'Cálculo Diferencial',
      description: 'Introducción al cálculo diferencial y sus aplicaciones en ingeniería y ciencias',
      faculty: 'Ciencias',
      credits: 3,
      prerequisites: ['MATE1101'],
      difficulty: 'Intermedio'
    });

    await setDoc(doc(db, 'course', 'MATE1106'), {
      name: 'Cálculo Integral',
      description: 'Métodos de integración y aplicaciones del cálculo integral',
      faculty: 'Ciencias',
      credits: 3,
      prerequisites: ['MATE1105'],
      difficulty: 'Intermedio'
    });

    await setDoc(doc(db, 'course', 'MATE1107'), {
      name: 'Álgebra Lineal',
      description: 'Espacios vectoriales, matrices y transformaciones lineales',
      faculty: 'Ciencias',
      credits: 3,
      prerequisites: ['MATE1105'],
      difficulty: 'Intermedio'
    });

    await setDoc(doc(db, 'course', 'ISIS1204'), {
      name: 'Programación Orientada a Objetos',
      description: 'Fundamentos de programación orientada a objetos usando Java',
      faculty: 'Ingeniería',
      credits: 3,
      prerequisites: ['ISIS1203'],
      difficulty: 'Intermedio'
    });

    await setDoc(doc(db, 'course', 'ISIS1203'), {
      name: 'Programación',
      description: 'Fundamentos de programación y algoritmos',
      faculty: 'Ingeniería',
      credits: 3,
      prerequisites: [],
      difficulty: 'Básico'
    });

    await setDoc(doc(db, 'course', 'FISI1018'), {
      name: 'Física I',
      description: 'Mecánica clásica y fundamentos de física',
      faculty: 'Ciencias',
      credits: 4,
      prerequisites: ['MATE1105'],
      difficulty: 'Intermedio'
    });

    await setDoc(doc(db, 'course', 'FISI1019'), {
      name: 'Física II',
      description: 'Electromagnetismo y ondas',
      faculty: 'Ciencias',
      credits: 4,
      prerequisites: ['FISI1018', 'MATE1106'],
      difficulty: 'Avanzado'
    });

    await setDoc(doc(db, 'course', 'QUIM1103'), {
      name: 'Química General',
      description: 'Fundamentos de química general e inorgánica',
      faculty: 'Ciencias',
      credits: 3,
      prerequisites: [],
      difficulty: 'Básico'
    });

    await setDoc(doc(db, 'course', 'ECON1000'), {
      name: 'Principios de Economía',
      description: 'Fundamentos de microeconomía y macroeconomía',
      faculty: 'Administración',
      credits: 3,
      prerequisites: [],
      difficulty: 'Básico'
    });

    await setDoc(doc(db, 'course', 'LENG1501'), {
      name: 'Inglés I',
      description: 'Nivel básico de inglés como lengua extranjera',
      faculty: 'Humanidades',
      credits: 2,
      prerequisites: [],
      difficulty: 'Básico'
    });

    await setDoc(doc(db, 'course', 'MATE1108'), {
      name: 'Cálculo Vectorial',
      description: 'Cálculo en varias variables y análisis vectorial',
      faculty: 'Ciencias',
      credits: 3,
      prerequisites: ['MATE1106'],
      difficulty: 'Avanzado'
    });

    await setDoc(doc(db, 'course', 'QUIM1104'), {
      name: 'Química Orgánica',
      description: 'Fundamentos de química orgánica y reacciones',
      faculty: 'Ciencias',
      credits: 4,
      prerequisites: ['QUIM1103'],
      difficulty: 'Intermedio'
    });

    await setDoc(doc(db, 'course', 'ESTI1001'), {
      name: 'Estadística',
      description: 'Fundamentos de estadística descriptiva e inferencial',
      faculty: 'Ciencias',
      credits: 3,
      prerequisites: ['MATE1105'],
      difficulty: 'Intermedio'
    });

    await setDoc(doc(db, 'course', 'LENG1502'), {
      name: 'Inglés II',
      description: 'Nivel intermedio de inglés como lengua extranjera',
      faculty: 'Humanidades',
      credits: 2,
      prerequisites: ['LENG1501'],
      difficulty: 'Intermedio'
    });

    // 3. Crear usuarios tutores
    console.log('👨‍🏫 Creando tutores...');
    
    await setDoc(doc(db, 'user', 'maria.rodriguez@uniandes.edu.co'), {
      name: 'María Rodríguez',
      mail: 'maria.rodriguez@uniandes.edu.co',
      phone_number: '+57 3109876543',
      major: 'matematicas', // Referencia al ID del documento en la colección major
      isTutor: true,
      subjects: ['Cálculo Diferencial', 'Cálculo Integral', 'Álgebra Lineal'],
      rating: 4.8,
      totalSessions: 67,
      hourlyRate: 30000,
      bio: 'Monitora de matemáticas con 2 años de experiencia. Especializada en cálculo y álgebra lineal.',
      profileImage: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    await setDoc(doc(db, 'user', 'juan.camilo@uniandes.edu.co'), {
      name: 'Juan Camilo García',
      mail: 'juan.camilo@uniandes.edu.co',
      phone_number: '+57 3201234567',
      major: 'ingenieria-sistemas',
      isTutor: true,
      subjects: ['Programación', 'Programación Orientada a Objetos'],
      rating: 4.6,
      totalSessions: 43,
      hourlyRate: 25000,
      bio: 'Estudiante de último semestre de sistemas con experiencia en Java y Python.',
      profileImage: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    await setDoc(doc(db, 'user', 'ana.martinez@uniandes.edu.co'), {
      name: 'Ana Martínez',
      mail: 'ana.martinez@uniandes.edu.co',
      phone_number: '+57 3156789012',
      major: 'fisica',
      isTutor: true,
      subjects: ['Física I', 'Física II', 'Cálculo Diferencial'],
      rating: 4.9,
      totalSessions: 89,
      hourlyRate: 35000,
      bio: 'Egresada de física con maestría. Experta en mecánica y electromagnetismo.',
      profileImage: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    await setDoc(doc(db, 'user', 'pedro.silva@uniandes.edu.co'), {
      name: 'Pedro Silva',
      mail: 'pedro.silva@uniandes.edu.co',
      phone_number: '+57 3187654321',
      major: 'ingenieria-civil',
      isTutor: true,
      subjects: ['Cálculo Diferencial', 'Física I', 'Química General'],
      rating: 4.5,
      totalSessions: 25,
      hourlyRate: 22000,
      bio: 'Estudiante de ingeniería civil con buen manejo de matemáticas y ciencias básicas.',
      profileImage: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    await setDoc(doc(db, 'user', 'lucia.fernandez@uniandes.edu.co'), {
      name: 'Lucía Fernández',
      mail: 'lucia.fernandez@uniandes.edu.co',
      phone_number: '+57 3141592653',
      major: 'matematicas',
      isTutor: true,
      subjects: ['Álgebra Lineal', 'Cálculo Integral', 'Programación'],
      rating: 4.7,
      totalSessions: 52,
      hourlyRate: 28000,
      bio: 'Estudiante de matemáticas aplicadas con experiencia en programación científica.',
      profileImage: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    // Agregar más tutores
    await setDoc(doc(db, 'user', 'carlos.herrera@uniandes.edu.co'), {
      name: 'Carlos Herrera',
      mail: 'carlos.herrera@uniandes.edu.co',
      phone_number: '+57 3178901234',
      major: 'quimica',
      isTutor: true,
      subjects: ['Química General', 'Química Orgánica'],
      rating: 4.4,
      totalSessions: 18,
      hourlyRate: 26000,
      bio: 'Estudiante de química con experiencia en laboratorio.',
      profileImage: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    await setDoc(doc(db, 'user', 'valentina.torres@uniandes.edu.co'), {
      name: 'Valentina Torres',
      mail: 'valentina.torres@uniandes.edu.co',
      phone_number: '+57 3145678901',
      major: 'ingenieria-industrial',
      isTutor: true,
      subjects: ['Principios de Economía', 'Estadística'],
      rating: 4.6,
      totalSessions: 31,
      hourlyRate: 27000,
      bio: 'Estudiante de ingeniería industrial especializada en economía y estadística.',
      profileImage: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    // 4. Crear usuarios estudiantes
    console.log('👨‍🎓 Creando estudiantes...');
    
    await setDoc(doc(db, 'user', 'carlos.mesa@uniandes.edu.co'), {
      name: 'Carlos Mesa',
      mail: 'carlos.mesa@uniandes.edu.co',
      phone_number: '+57 3201234567',
      major: 'ingenieria-civil',
      isTutor: false,
      semester: 3,
      enrolledCourses: ['MATE1105', 'FISI1018', 'QUIM1103'],
      profileImage: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    await setDoc(doc(db, 'user', 'sofia.lopez@uniandes.edu.co'), {
      name: 'Sofía López',
      mail: 'sofia.lopez@uniandes.edu.co',
      phone_number: '+57 3167890123',
      major: 'ingenieria-sistemas',
      isTutor: false,
      semester: 2,
      enrolledCourses: ['ISIS1203', 'MATE1105', 'LENG1501'],
      profileImage: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    await setDoc(doc(db, 'user', 'diego.ramirez@uniandes.edu.co'), {
      name: 'Diego Ramírez',
      mail: 'diego.ramirez@uniandes.edu.co',
      phone_number: '+57 3198765432',
      major: 'fisica',
      isTutor: false,
      semester: 4,
      enrolledCourses: ['FISI1018', 'MATE1106', 'MATE1107'],
      profileImage: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    // Agregar más estudiantes
    await setDoc(doc(db, 'user', 'natalia.garcia@uniandes.edu.co'), {
      name: 'Natalia García',
      mail: 'natalia.garcia@uniandes.edu.co',
      phone_number: '+57 3156789012',
      major: 'quimica',
      isTutor: false,
      semester: 5,
      enrolledCourses: ['QUIM1103', 'MATE1106', 'FISI1018'],
      profileImage: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    await setDoc(doc(db, 'user', 'andres.moreno@uniandes.edu.co'), {
      name: 'Andrés Moreno',
      mail: 'andres.moreno@uniandes.edu.co',
      phone_number: '+57 3134567890',
      major: 'ingenieria-industrial',
      isTutor: false,
      semester: 6,
      enrolledCourses: ['ECON1000', 'MATE1107', 'ISIS1203'],
      profileImage: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    // 5. Crear algunas disponibilidades de ejemplo
    console.log('⏰ Creando disponibilidades de ejemplo...');
    
    // Disponibilidad de María (Cálculo)
    await setDoc(doc(db, 'availabilities', 'avail_maria_calc_1'), {
      tutorId: 'maria.rodriguez@uniandes.edu.co',
      tutorEmail: 'maria.rodriguez@uniandes.edu.co',
      title: 'Disponible para tutorías de Cálculo',
      description: 'Horario para resolver dudas de cálculo diferencial y ejercicios',
      startDateTime: Timestamp.fromDate(new Date('2025-01-22T14:00:00.000Z')),
      endDateTime: Timestamp.fromDate(new Date('2025-01-22T16:00:00.000Z')),
      location: 'Biblioteca ML - Sala 101',
      recurring: true,
      recurrenceRule: 'RRULE:FREQ=WEEKLY;BYDAY=TU',
      subject: 'Cálculo Diferencial',
      color: '#FF5722',
      googleEventId: 'avail_maria_calc_1',
      htmlLink: 'https://calendar.google.com/calendar/event',
      status: 'confirmed',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      syncedAt: Timestamp.now(),
      isBooked: false,
      bookedBy: null
    });

    // Disponibilidad de Juan Camilo (Programación)
    await setDoc(doc(db, 'availabilities', 'avail_juan_prog_1'), {
      tutorId: 'juan.camilo@uniandes.edu.co',
      tutorEmail: 'juan.camilo@uniandes.edu.co',
      title: 'Disponible para tutorías de Programación',
      description: 'Ayuda con Java, POO y algoritmos',
      startDateTime: Timestamp.fromDate(new Date('2025-01-23T10:00:00.000Z')),
      endDateTime: Timestamp.fromDate(new Date('2025-01-23T12:00:00.000Z')),
      location: 'Lab de Sistemas - Edificio ML',
      recurring: true,
      recurrenceRule: 'RRULE:FREQ=WEEKLY;BYDAY=WE',
      subject: 'Programación Orientada a Objetos',
      color: '#2196F3',
      googleEventId: 'avail_juan_prog_1',
      htmlLink: 'https://calendar.google.com/calendar/event',
      status: 'confirmed',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      syncedAt: Timestamp.now(),
      isBooked: false,
      bookedBy: null
    });

    // Disponibilidad de Ana (Física)
    await setDoc(doc(db, 'availabilities', 'avail_ana_fisica_1'), {
      tutorId: 'ana.martinez@uniandes.edu.co',
      tutorEmail: 'ana.martinez@uniandes.edu.co',
      title: 'Disponible para tutorías de Física',
      description: 'Mecánica, cinemática y dinámica',
      startDateTime: Timestamp.fromDate(new Date('2025-01-24T15:30:00.000Z')),
      endDateTime: Timestamp.fromDate(new Date('2025-01-24T17:30:00.000Z')),
      location: 'Virtual - Google Meet',
      recurring: true,
      recurrenceRule: 'RRULE:FREQ=WEEKLY;BYDAY=TH',
      subject: 'Física I',
      color: '#4CAF50',
      googleEventId: 'avail_ana_fisica_1',
      htmlLink: 'https://calendar.google.com/calendar/event',
      status: 'confirmed',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      syncedAt: Timestamp.now(),
      isBooked: false,
      bookedBy: null
    });

    // Más disponibilidades de María (Álgebra)
    await setDoc(doc(db, 'availabilities', 'avail_maria_algebra_1'), {
      tutorId: 'maria.rodriguez@uniandes.edu.co',
      tutorEmail: 'maria.rodriguez@uniandes.edu.co',
      title: 'Disponible para tutorías de Álgebra Lineal',
      description: 'Matrices, vectores y sistemas de ecuaciones',
      startDateTime: Timestamp.fromDate(new Date('2025-01-25T09:00:00.000Z')),
      endDateTime: Timestamp.fromDate(new Date('2025-01-25T11:00:00.000Z')),
      location: 'Biblioteca ML - Sala 205',
      recurring: true,
      recurrenceRule: 'RRULE:FREQ=WEEKLY;BYDAY=FR',
      subject: 'Álgebra Lineal',
      color: '#9C27B0',
      googleEventId: 'avail_maria_algebra_1',
      htmlLink: 'https://calendar.google.com/calendar/event',
      status: 'confirmed',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      syncedAt: Timestamp.now(),
      isBooked: false,
      bookedBy: null
    });

    // Disponibilidad de Pedro (Química)
    await setDoc(doc(db, 'availabilities', 'avail_pedro_quim_1'), {
      tutorId: 'pedro.silva@uniandes.edu.co',
      tutorEmail: 'pedro.silva@uniandes.edu.co',
      title: 'Disponible para tutorías de Química',
      description: 'Química general, estequiometría y reacciones',
      startDateTime: Timestamp.fromDate(new Date('2025-01-21T16:00:00.000Z')),
      endDateTime: Timestamp.fromDate(new Date('2025-01-21T18:00:00.000Z')),
      location: 'Lab de Química - Edificio C',
      recurring: true,
      recurrenceRule: 'RRULE:FREQ=WEEKLY;BYDAY=MO',
      subject: 'Química General',
      color: '#FF9800',
      googleEventId: 'avail_pedro_quim_1',
      htmlLink: 'https://calendar.google.com/calendar/event',
      status: 'confirmed',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      syncedAt: Timestamp.now(),
      isBooked: false,
      bookedBy: null
    });

    // Más disponibilidades de diferentes tutores
    await setDoc(doc(db, 'availabilities', 'avail_carlos_quim_1'), {
      tutorId: 'carlos.herrera@uniandes.edu.co',
      tutorEmail: 'carlos.herrera@uniandes.edu.co',
      title: 'Disponible para tutorías de Química Orgánica',
      description: 'Reacciones orgánicas y mecanismos',
      startDateTime: Timestamp.fromDate(new Date('2025-01-23T08:00:00.000Z')),
      endDateTime: Timestamp.fromDate(new Date('2025-01-23T10:00:00.000Z')),
      location: 'Lab de Química Orgánica',
      recurring: true,
      recurrenceRule: 'RRULE:FREQ=WEEKLY;BYDAY=WE',
      subject: 'Química Orgánica',
      color: '#8BC34A',
      googleEventId: 'avail_carlos_quim_1',
      htmlLink: 'https://calendar.google.com/calendar/event',
      status: 'confirmed',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      syncedAt: Timestamp.now(),
      isBooked: false,
      bookedBy: null
    });

    await setDoc(doc(db, 'availabilities', 'avail_valentina_econ_1'), {
      tutorId: 'valentina.torres@uniandes.edu.co',
      tutorEmail: 'valentina.torres@uniandes.edu.co',
      title: 'Disponible para tutorías de Economía',
      description: 'Microeconomía y macroeconomía',
      startDateTime: Timestamp.fromDate(new Date('2025-01-24T13:00:00.000Z')),
      endDateTime: Timestamp.fromDate(new Date('2025-01-24T15:00:00.000Z')),
      location: 'Virtual - Zoom',
      recurring: true,
      recurrenceRule: 'RRULE:FREQ=WEEKLY;BYDAY=TH',
      subject: 'Principios de Economía',
      color: '#E91E63',
      googleEventId: 'avail_valentina_econ_1',
      htmlLink: 'https://calendar.google.com/calendar/event',
      status: 'confirmed',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      syncedAt: Timestamp.now(),
      isBooked: false,
      bookedBy: null
    });

    await setDoc(doc(db, 'availabilities', 'avail_juan_prog_2'), {
      tutorId: 'juan.camilo@uniandes.edu.co',
      tutorEmail: 'juan.camilo@uniandes.edu.co',
      title: 'Disponible para tutorías de Programación Básica',
      description: 'Fundamentos de programación en Python',
      startDateTime: Timestamp.fromDate(new Date('2025-01-25T16:00:00.000Z')),
      endDateTime: Timestamp.fromDate(new Date('2025-01-25T18:00:00.000Z')),
      location: 'Lab de Sistemas - Edificio ML',
      recurring: true,
      recurrenceRule: 'RRULE:FREQ=WEEKLY;BYDAY=FR',
      subject: 'Programación',
      color: '#3F51B5',
      googleEventId: 'avail_juan_prog_2',
      htmlLink: 'https://calendar.google.com/calendar/event',
      status: 'confirmed',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      syncedAt: Timestamp.now(),
      isBooked: false,
      bookedBy: null
    });

    await setDoc(doc(db, 'availabilities', 'avail_lucia_stats_1'), {
      tutorId: 'lucia.fernandez@uniandes.edu.co',
      tutorEmail: 'lucia.fernandez@uniandes.edu.co',
      title: 'Disponible para tutorías de Estadística',
      description: 'Estadística descriptiva e inferencial',
      startDateTime: Timestamp.fromDate(new Date('2025-01-26T10:00:00.000Z')),
      endDateTime: Timestamp.fromDate(new Date('2025-01-26T12:00:00.000Z')),
      location: 'Biblioteca ML - Sala 301',
      recurring: true,
      recurrenceRule: 'RRULE:FREQ=WEEKLY;BYDAY=SA',
      subject: 'Estadística',
      color: '#795548',
      googleEventId: 'avail_lucia_stats_1',
      htmlLink: 'https://calendar.google.com/calendar/event',
      status: 'confirmed',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      syncedAt: Timestamp.now(),
      isBooked: false,
      bookedBy: null
    });

    // 6. Crear sesiones de tutoría de ejemplo (para futuras implementaciones)
    console.log('📅 Creando sesiones de tutoría de ejemplo...');
    
    await setDoc(doc(db, 'tutoring_sessions', 'session_001'), {
      tutorEmail: 'maria.rodriguez@uniandes.edu.co',
      studentEmail: 'carlos.mesa@uniandes.edu.co',
      subject: 'Cálculo Diferencial',
      scheduledDateTime: Timestamp.fromDate(new Date('2025-01-30T14:00:00.000Z')),
      endDateTime: Timestamp.fromDate(new Date('2025-01-30T15:00:00.000Z')),
      location: 'Biblioteca ML - Sala 101',
      status: 'scheduled',
      price: 30000,
      paymentStatus: 'pending',
      googleEventId: 'session_google_001',
      availabilityId: 'avail_maria_calc_1',
      notes: 'Revisar ejercicios de derivadas y límites',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    await setDoc(doc(db, 'tutoring_sessions', 'session_002'), {
      tutorEmail: 'juan.camilo@uniandes.edu.co',
      studentEmail: 'sofia.lopez@uniandes.edu.co',
      subject: 'Programación',
      scheduledDateTime: Timestamp.fromDate(new Date('2025-01-28T10:00:00.000Z')),
      endDateTime: Timestamp.fromDate(new Date('2025-01-28T11:30:00.000Z')),
      location: 'Lab de Sistemas - Edificio ML',
      status: 'completed',
      price: 25000,
      paymentStatus: 'paid',
      googleEventId: 'session_google_002',
      availabilityId: 'avail_juan_prog_1',
      notes: 'Introducción a Java y POO',
      rating: {
        score: 5,
        comment: 'Excelente explicación de conceptos básicos',
        ratedAt: Timestamp.fromDate(new Date('2025-01-28T12:00:00.000Z'))
      },
      createdAt: Timestamp.fromDate(new Date('2025-01-25T09:00:00.000Z')),
      updatedAt: Timestamp.fromDate(new Date('2025-01-28T12:00:00.000Z'))
    });

    // 7. Crear pagos de ejemplo (para futuras implementaciones)
    console.log('💳 Creando pagos de ejemplo...');
    
    await setDoc(doc(db, 'payments', 'payment_001'), {
      sessionId: 'session_002',
      tutorEmail: 'juan.camilo@uniandes.edu.co',
      studentEmail: 'sofia.lopez@uniandes.edu.co',
      amount: 25000,
      currency: 'COP',
      method: 'card',
      status: 'completed',
      transactionId: 'txn_wompi_123456',
      gatewayProvider: 'wompi',
      createdAt: Timestamp.fromDate(new Date('2025-01-25T09:15:00.000Z')),
      completedAt: Timestamp.fromDate(new Date('2025-01-25T09:16:00.000Z'))
    });

    await setDoc(doc(db, 'payments', 'payment_002'), {
      sessionId: 'session_001',
      tutorEmail: 'maria.rodriguez@uniandes.edu.co',
      studentEmail: 'carlos.mesa@uniandes.edu.co',
      amount: 30000,
      currency: 'COP',
      method: 'bank_transfer',
      status: 'pending',
      transactionId: null,
      gatewayProvider: 'payu',
      createdAt: Timestamp.now(),
      completedAt: null
    });

    console.log('✅ Datos inicializados correctamente en Firebase!');
    console.log('📊 Resumen de datos creados:');
    console.log('   - 6 carreras (major)');
    console.log('   - 15 materias (course)');
    console.log('   - 7 tutores (user con isTutor: true)');
    console.log('   - 5 estudiantes (user con isTutor: false)');
    console.log('   - 10 disponibilidades (availabilities)');
    console.log('   - 2 sesiones de tutoría (tutoring_sessions)');
    console.log('   - 2 pagos (payments)');
    console.log('');
    console.log('🎉 ¡Ya puedes probar la aplicación!');
    console.log('');
    console.log('🔧 Siguiente paso: Configura las reglas de seguridad en Firebase Console');
    console.log('📖 Revisa FIREBASE_SETUP_GUIDE.md para más detalles');

  } catch (error) {
    console.error('❌ Error inicializando datos:', error);
  }
}

// Ejecutar el script
initializeFirebaseData().then(() => {
  console.log('Script completado exitosamente');
  process.exit(0);
}).catch(error => {
  console.error('Error ejecutando script:', error);
  process.exit(1);
}); 