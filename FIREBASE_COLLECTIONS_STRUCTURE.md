# Estructura de Colecciones Firebase - Calico

Este documento define la estructura exacta de las colecciones en Firebase Firestore que debe implementarse para que la aplicación funcione correctamente.

## Índice de Colecciones

1. [**user**](#1-colección-user) - Usuarios (estudiantes y tutores)
2. [**course**](#2-colección-course) - Materias/Cursos
3. [**availabilities**](#3-colección-availabilities) - Disponibilidad de tutores
4. [**major**](#4-colección-major) - Carreras universitarias
5. [**tutoring_sessions**](#5-colección-tutoring_sessions) - Sesiones de tutoría agendadas
6. [**slot_bookings**](#6-colección-slot_bookings) - Reservas de slots específicos
7. [**notifications**](#7-colección-notifications) - Notificaciones del sistema
8. [**payments**](#8-colección-payments) - Pagos y transacciones

---

## 1. Colección `user`

**Propósito**: Almacena información de todos los usuarios (estudiantes y tutores)

**ID del Documento**: Email del usuario (ej: `juan.perez@uniandes.edu.co`)

### Estructura del Documento:

```javascript
{
  // Campos obligatorios
  "name": "Juan Carlos Pérez",
  "mail": "juan.perez@uniandes.edu.co",
  "phone_number": "+57 3001234567",
  "major": "reference to /major/ingenieria-sistemas", // Referencia a documento de carrera
  "isTutor": true, // true para tutores, false para estudiantes
  
  // Campos automáticos
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z",
  
  // Campos opcionales para tutores
  "subjects": [
    "Cálculo Diferencial",
    "Álgebra Lineal",
    "Programación"
  ],
  "rating": 4.7, // Calificación promedio
  "totalSessions": 45, // Total de tutorías realizadas
  "profileImage": "https://example.com/profile.jpg",
  "bio": "Estudiante de último semestre con experiencia en tutorías de matemáticas",
  "hourlyRate": 25000, // Tarifa por hora en pesos colombianos
  
  // Campos adicionales para estudiantes
  "semester": 5,
  "enrolledCourses": [
    "MATE1105", 
    "ISIS1204"
  ]
}
```

### Ejemplos de Documentos:

**Tutor:**
```javascript
// Documento ID: maria.rodriguez@uniandes.edu.co
{
  "name": "María Rodríguez",
  "mail": "maria.rodriguez@uniandes.edu.co",
  "phone_number": "+57 3109876543",
  "major": "reference to /major/matematicas",
  "isTutor": true,
  "subjects": ["Cálculo Diferencial", "Cálculo Integral", "Álgebra Lineal"],
  "rating": 4.8,
  "totalSessions": 67,
  "hourlyRate": 30000,
  "bio": "Monitora de matemáticas con 2 años de experiencia",
  "createdAt": "2024-08-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

**Estudiante:**
```javascript
// Documento ID: carlos.mesa@uniandes.edu.co
{
  "name": "Carlos Mesa",
  "mail": "carlos.mesa@uniandes.edu.co",
  "phone_number": "+57 3201234567",
  "major": "reference to /major/ingenieria-civil",
  "isTutor": false,
  "semester": 3,
  "enrolledCourses": ["MATE1105", "FISI1018"],
  "createdAt": "2024-09-01T14:20:00Z",
  "updatedAt": "2025-01-15T14:20:00Z"
}
```

---

## 2. Colección `course`

**Propósito**: Almacena información de todas las materias/cursos disponibles

**ID del Documento**: Código único de la materia (ej: `MATE1105`)

### Estructura del Documento:

```javascript
{
  // Campos obligatorios
  "name": "Cálculo Diferencial",
  
  // Campos opcionales
  "description": "Curso introductorio de cálculo diferencial",
  "faculty": "Ciencias",
  "credits": 3,
  "prerequisites": ["MATE1101"], // Array de códigos de materias
  "semester": "Cualquiera",
  "difficulty": "Intermedio" // Básico, Intermedio, Avanzado
}
```

### Ejemplos de Documentos:

```javascript
// Documento ID: MATE1105
{
  "name": "Cálculo Diferencial",
  "description": "Introducción al cálculo diferencial y sus aplicaciones",
  "faculty": "Ciencias",
  "credits": 3,
  "prerequisites": ["MATE1101"],
  "difficulty": "Intermedio"
}

// Documento ID: ISIS1204
{
  "name": "Programación Orientada a Objetos",
  "description": "Fundamentos de programación orientada a objetos en Java",
  "faculty": "Ingeniería",
  "credits": 3,
  "prerequisites": ["ISIS1203"],
  "difficulty": "Intermedio"
}

// Documento ID: FISI1018
{
  "name": "Física I",
  "description": "Mecánica clásica y fundamentos de física",
  "faculty": "Ciencias",
  "credits": 4,
  "prerequisites": ["MATE1105"],
  "difficulty": "Intermedio"
}
```

---

## 3. Colección `availabilities`

**Propósito**: Almacena los horarios disponibles de los tutores sincronizados desde Google Calendar

**ID del Documento**: ID del evento de Google Calendar (ej: `abc123def456ghi789`)

### Estructura del Documento:

```javascript
{
  // Identificación del tutor
  "tutorId": "maria.rodriguez@uniandes.edu.co",
  "tutorEmail": "maria.rodriguez@uniandes.edu.co",
  
  // Información del horario
  "title": "Disponible para tutorías de Cálculo",
  "description": "Horario disponible para tutorías de cálculo diferencial",
  "startDateTime": "2025-01-20T14:00:00Z", // Timestamp
  "endDateTime": "2025-01-20T16:00:00Z", // Timestamp
  "location": "Biblioteca ML - Sala 101",
  
  // Información de recurrencia
  "recurring": true,
  "recurrenceRule": "RRULE:FREQ=WEEKLY;BYDAY=MO",
  
  // Materia y visualización
  "subject": "Cálculo Diferencial",
  "color": "#FF5722", // Color hexadecimal para mostrar
  
  // Integración con Google Calendar
  "googleEventId": "abc123def456ghi789",
  "htmlLink": "https://calendar.google.com/event?eid=...",
  "status": "confirmed", // confirmed, tentative, cancelled
  
  // Campos de control
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z",
  "syncedAt": "2025-01-15T10:30:00Z",
  
  // Estado de reserva (para futuras implementaciones)
  "isBooked": false,
  "bookedBy": null // Email del estudiante que reservó
}
```

### Ejemplo de Documento:

```javascript
// Documento ID: abc123def456ghi789
{
  "tutorId": "maria.rodriguez@uniandes.edu.co",
  "tutorEmail": "maria.rodriguez@uniandes.edu.co",
  "title": "Disponible para tutorías de Cálculo",
  "description": "Horario para resolver dudas de cálculo diferencial y ejercicios",
  "startDateTime": "2025-01-22T14:00:00.000Z",
  "endDateTime": "2025-01-22T16:00:00.000Z",
  "location": "Biblioteca ML - Sala 101",
  "recurring": true,
  "recurrenceRule": "RRULE:FREQ=WEEKLY;BYDAY=TU",
  "subject": "Cálculo Diferencial",
  "color": "#FF5722",
  "googleEventId": "abc123def456ghi789",
  "htmlLink": "https://calendar.google.com/calendar/event?eid=YWJjMTIz",
  "status": "confirmed",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z",
  "syncedAt": "2025-01-15T10:30:00.000Z",
  "isBooked": false,
  "bookedBy": null
}
```

---

## 4. Colección `major`

**Propósito**: Almacena las carreras universitarias disponibles

**ID del Documento**: Código único de la carrera (ej: `ingenieria-sistemas`)

### Estructura del Documento:

```javascript
{
  "name": "Ingeniería de Sistemas y Computación",
  "faculty": "Ingeniería",
  "description": "Carrera enfocada en el desarrollo de software y sistemas computacionales",
  "duration": 10, // semestres
  "type": "Pregrado" // Pregrado, Maestría, Doctorado
}
```

### Ejemplos de Documentos:

```javascript
// Documento ID: ingenieria-sistemas
{
  "name": "Ingeniería de Sistemas y Computación",
  "faculty": "Ingeniería",
  "description": "Formación integral en desarrollo de software y sistemas",
  "duration": 10,
  "type": "Pregrado"
}

// Documento ID: matematicas
{
  "name": "Matemáticas",
  "faculty": "Ciencias",
  "description": "Formación en matemáticas puras y aplicadas",
  "duration": 8,
  "type": "Pregrado"
}

// Documento ID: ingenieria-civil
{
  "name": "Ingeniería Civil",
  "faculty": "Ingeniería",
  "description": "Formación en construcción y diseño de infraestructura",
  "duration": 10,
  "type": "Pregrado"
}
```

---

## 5. Colección `tutoring_sessions`

**Propósito**: Almacena las sesiones de tutoría agendadas entre estudiantes y tutores

**ID del Documento**: ID único generado automáticamente

### Estructura del Documento:

```javascript
{
  // Participantes
  "tutorEmail": "maria.rodriguez@uniandes.edu.co",
  "studentEmail": "carlos.mesa@uniandes.edu.co",
  "studentName": "Carlos Mesa",
  
  // Información de la sesión
  "subject": "Cálculo Diferencial",
  "scheduledDateTime": "2025-01-22T14:00:00Z",
  "endDateTime": "2025-01-22T15:00:00Z",
  "location": "Biblioteca ML - Sala 101",
  
  // Estado y pagos
  "status": "pending", // pending, scheduled, completed, cancelled, declined, no_show
  "price": 25000,
  "paymentStatus": "pending", // pending, paid, refunded
  
  // Aprobación del tutor
  "tutorApprovalStatus": "pending", // pending, accepted, declined
  "requestedAt": "2025-01-20T10:00:00Z",
  "acceptedAt": "2025-01-20T10:15:00Z", // Solo si fue aceptada
  "declinedAt": "2025-01-20T10:15:00Z", // Solo si fue rechazada
  
  // Integración con slots
  "parentAvailabilityId": "abc123def456ghi789",
  "slotIndex": 2,
  "slotId": "slot_abc123_2",
  "googleEventId": "xyz789abc123def456",
  
  // Notas y calificación
  "notes": "Revisar ejercicios de derivadas",
  "rating": {
    "score": 5,
    "comment": "Excelente explicación",
    "ratedAt": "2025-01-22T15:30:00Z"
  },
  
  // Control
  "createdAt": "2025-01-20T10:00:00Z",
  "updatedAt": "2025-01-22T15:30:00Z"
}
```

---

## 6. Colección `slot_bookings`

**Propósito**: Almacena las reservas específicas de slots de 1 hora para evitar conflictos

**ID del Documento**: ID único generado automáticamente

### Estructura del Documento:

```javascript
{
  // Referencias
  "parentAvailabilityId": "abc123def456ghi789", // ID de la disponibilidad padre
  "slotIndex": 2, // Índice del slot dentro de la disponibilidad
  "slotId": "slot_abc123_2", // ID único del slot
  "sessionId": "session_xyz789", // ID de la sesión asociada
  
  // Participantes
  "tutorEmail": "maria.rodriguez@uniandes.edu.co",
  "studentEmail": "carlos.mesa@uniandes.edu.co",
  
  // Información del slot
  "slotStartTime": "2025-01-22T14:00:00Z",
  "slotEndTime": "2025-01-22T15:00:00Z",
  "subject": "Cálculo Diferencial",
  
  // Control
  "bookedAt": "2025-01-20T10:00:00Z",
  "createdAt": "2025-01-20T10:00:00Z",
  "updatedAt": "2025-01-20T10:00:00Z"
}
```

---

## 7. Colección `notifications`

**Propósito**: Almacena las notificaciones del sistema para usuarios

**ID del Documento**: ID único generado automáticamente

### Estructura del Documento:

```javascript
{
  // Destinatario
  "tutorEmail": "maria.rodriguez@uniandes.edu.co", // Para notificaciones de tutores
  "studentEmail": "carlos.mesa@uniandes.edu.co", // Para notificaciones de estudiantes
  
  // Referencias
  "sessionId": "session_xyz789", // ID de la sesión relacionada
  
  // Contenido
  "type": "pending_session_request", // pending_session_request, session_accepted, session_declined
  "title": "New Session Request",
  "message": "Carlos Mesa has requested a tutoring session for Cálculo Diferencial",
  
  // Información adicional
  "studentName": "Carlos Mesa", // Para notificaciones de tutores
  "tutorEmail": "maria.rodriguez@uniandes.edu.co", // Para notificaciones de estudiantes
  "subject": "Cálculo Diferencial",
  "scheduledDateTime": "2025-01-22T14:00:00Z",
  
  // Estado
  "isRead": false,
  "readAt": "2025-01-20T10:15:00Z", // Solo si fue leída
  
  // Control
  "createdAt": "2025-01-20T10:00:00Z",
  "updatedAt": "2025-01-20T10:00:00Z"
}
```

---

## 8. Colección `payments` (Futuras implementaciones)

**Propósito**: Almacena información de pagos y transacciones

**ID del Documento**: ID único generado automáticamente

### Estructura del Documento:

```javascript
{
  // Referencias
  "sessionId": "session123abc",
  "tutorEmail": "maria.rodriguez@uniandes.edu.co",
  "studentEmail": "carlos.mesa@uniandes.edu.co",
  
  // Información del pago
  "amount": 25000,
  "currency": "COP",
  "method": "card", // card, bank_transfer, cash
  "status": "completed", // pending, completed, failed, refunded
  
  // Integración con pasarela de pagos
  "transactionId": "txn_1234567890",
  "gatewayProvider": "wompi", // wompi, payu, etc.
  
  // Fechas
  "createdAt": "2025-01-22T14:00:00Z",
  "completedAt": "2025-01-22T14:05:00Z"
}
```

---

## 🔧 Configuración de Reglas de Seguridad

Para que las colecciones funcionen correctamente, necesitas configurar las reglas de seguridad en Firebase:

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios pueden leer y escribir su propia información
    match /user/{userId} {
      allow read, write: if request.auth != null && request.auth.token.email == userId;
      allow read: if request.auth != null; // Lectura para buscar tutores
    }
    
    // Materias son de solo lectura para usuarios autenticados
    match /course/{courseId} {
      allow read: if request.auth != null;
      allow write: if false; // Solo administradores pueden modificar
    }
    
    // Carreras son de solo lectura
    match /major/{majorId} {
      allow read: if request.auth != null;
      allow write: if false;
    }
    
    // Disponibilidades
    match /availabilities/{availId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.token.email == resource.data.tutorEmail;
    }
    
    // Sesiones de tutoría
    match /tutoring_sessions/{sessionId} {
      allow read, write: if request.auth != null && 
        (request.auth.token.email == resource.data.tutorEmail || 
         request.auth.token.email == resource.data.studentEmail);
    }
    
    // Pagos - solo lectura para usuarios involucrados
    match /payments/{paymentId} {
      allow read: if request.auth != null && 
        (request.auth.token.email == resource.data.tutorEmail || 
         request.auth.token.email == resource.data.studentEmail);
      allow write: if false; // Los pagos se manejan por la aplicación
    }
  }
}
```

---

## 🚀 Datos de Prueba

Para probar la aplicación, puedes usar estos datos de ejemplo:

### Script para poblar datos iniciales:

```javascript
// Ejecutar en la consola de Firebase o en un script de inicialización

// Carreras
await db.collection('major').doc('ingenieria-sistemas').set({
  name: 'Ingeniería de Sistemas y Computación',
  faculty: 'Ingeniería',
  description: 'Formación en desarrollo de software',
  duration: 10,
  type: 'Pregrado'
});

// Materias
await db.collection('course').doc('MATE1105').set({
  name: 'Cálculo Diferencial',
  description: 'Introducción al cálculo diferencial',
  faculty: 'Ciencias',
  credits: 3,
  prerequisites: ['MATE1101'],
  difficulty: 'Intermedio'
});

await db.collection('course').doc('ISIS1204').set({
  name: 'Programación Orientada a Objetos',
  description: 'POO en Java',
  faculty: 'Ingeniería',
  credits: 3,
  prerequisites: ['ISIS1203'],
  difficulty: 'Intermedio'
});

// Usuario tutor
await db.collection('user').doc('maria.rodriguez@uniandes.edu.co').set({
  name: 'María Rodríguez',
  mail: 'maria.rodriguez@uniandes.edu.co',
  phone_number: '+57 3109876543',
  major: db.doc('major/matematicas'),
  isTutor: true,
  subjects: ['Cálculo Diferencial', 'Álgebra Lineal'],
  rating: 4.8,
  totalSessions: 45,
  hourlyRate: 30000,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Usuario estudiante
await db.collection('user').doc('carlos.mesa@uniandes.edu.co').set({
  name: 'Carlos Mesa',
  mail: 'carlos.mesa@uniandes.edu.co',
  phone_number: '+57 3201234567',
  major: db.doc('major/ingenieria-civil'),
  isTutor: false,
  semester: 3,
  enrolledCourses: ['MATE1105', 'FISI1018'],
  createdAt: new Date(),
  updatedAt: new Date()
});
```

---

## ✅ Verificación de la Estructura

Para verificar que todo funciona correctamente:

1. **Crear los datos de prueba** usando el script anterior
2. **Configurar las reglas de seguridad** en Firebase Console
3. **Probar la aplicación**:
   - Registro de usuarios
   - Login
   - Búsqueda de materias
   - Visualización de tutores
   - Sincronización de disponibilidad con Google Calendar

---

**📝 Nota**: Esta estructura está diseñada para soportar tanto la funcionalidad actual como futuras implementaciones de agendamiento, pagos y calificaciones. 