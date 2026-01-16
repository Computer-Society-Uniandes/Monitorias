# Firestore Setup Guide

Esta guía explica cómo configurar Firestore para el proyecto Monitorias.

## 📋 Colecciones Requeridas

El proyecto requiere las siguientes colecciones en Firestore:

### 1. `course` (Cursos)
Almacena información de los cursos disponibles.

**Estructura de documento:**
```json
{
  "name": "Cálculo I",
  "code": "MAT101",
  "credits": 3,
  "faculty": "Ingeniería",
  "prerequisites": ["MAT001"],
  "createdAt": "2026-01-16T10:00:00Z",
  "updatedAt": "2026-01-16T10:00:00Z"
}
```

### 2. `major` (Carreras)
Almacena información de las carreras.

**Estructura de documento:**
```json
{
  "name": "Ingeniería de Sistemas",
  "code": "IS",
  "faculty": "Ingeniería",
  "createdAt": "2026-01-16T10:00:00Z",
  "updatedAt": "2026-01-16T10:00:00Z"
}
```

### 3. `tutoringSessions` (Sesiones de Tutoría)
Almacena todas las sesiones de tutoría.

**Estructura de documento:**
```json
{
  "tutorId": "tutor123",
  "tutorEmail": "tutor@example.com",
  "tutorName": "María González",
  "studentId": "student456",
  "studentEmail": "student@example.com",
  "studentName": "Juan Pérez",
  "course": "Cálculo I",
  "scheduledStart": "2026-01-20T14:00:00Z",
  "scheduledEnd": "2026-01-20T15:00:00Z",
  "status": "pending",
  "tutorApprovalStatus": "pending",
  "notes": "Ayuda con derivadas",
  "eventId": "gcal_event_id",
  "createdAt": "2026-01-16T10:00:00Z",
  "updatedAt": "2026-01-16T10:00:00Z"
}
```

### 4. `availability` (Disponibilidad de Tutores)
Almacena los bloques de disponibilidad de los tutores.

**Estructura de documento:**
```json
{
  "tutorId": "tutor123",
  "tutorEmail": "tutor@example.com",
  "eventId": "gcal_event_id",
  "calendarId": "primary",
  "course": "Cálculo I",
  "start": "2026-01-20T14:00:00Z",
  "end": "2026-01-20T16:00:00Z",
  "title": "Disponibilidad Cálculo",
  "createdAt": "2026-01-16T10:00:00Z",
  "updatedAt": "2026-01-16T10:00:00Z"
}
```

### 5. `users` (Usuarios)
Almacena información de usuarios (tutores y estudiantes).

**Estructura de documento:**
```json
{
  "email": "user@example.com",
  "name": "Usuario Ejemplo",
  "role": "tutor",
  "courses": ["Cálculo I", "Álgebra"],
  "calendarConnected": true,
  "calendarId": "primary",
  "createdAt": "2026-01-16T10:00:00Z",
  "updatedAt": "2026-01-16T10:00:00Z"
}
```

---

## 🔑 Índices Compuestos Requeridos

Para que las consultas funcionen correctamente, necesitas crear los siguientes **índices compuestos** en Firestore:

### Índices para `tutoringSessions`

1. **studentId + scheduledStart**
   - Collection: `tutoringSessions`
   - Fields:
     - `studentId` (Ascending)
     - `scheduledStart` (Descending)
   - Query scope: Collection

2. **tutorId + scheduledStart**
   - Collection: `tutoringSessions`
   - Fields:
     - `tutorId` (Ascending)
     - `scheduledStart` (Descending)
   - Query scope: Collection

3. **tutorId + tutorApprovalStatus + scheduledStart**
   - Collection: `tutoringSessions`
   - Fields:
     - `tutorId` (Ascending)
     - `tutorApprovalStatus` (Ascending)
     - `scheduledStart` (Descending)
   - Query scope: Collection

---

## 🚀 Pasos para Configurar Firestore

### Paso 1: Ir a Firebase Console
1. Ve a https://console.firebase.google.com
2. Selecciona tu proyecto
3. En el menú lateral, haz clic en **Firestore Database**

### Paso 2: Crear las Colecciones
Las colecciones se crean automáticamente cuando agregas el primer documento. Puedes:

**Opción A: Crear manualmente** (recomendado para datos de ejemplo)
1. En Firestore, haz clic en "Start collection"
2. Ingresa el nombre de la colección (ej: `course`)
3. Agrega un documento con los campos mencionados arriba

**Opción B: Usar la API** (se crean automáticamente al insertar datos)
- Las colecciones se crearán automáticamente cuando uses los endpoints POST
- Ejemplo: `POST /api/courses` creará la colección `course`

### Paso 3: Crear los Índices Compuestos

#### Método 1: Desde Firebase Console
1. En Firebase Console, ve a **Firestore Database** → **Indexes**
2. Haz clic en **Create Index**
3. Selecciona la colección: `tutoringSessions`
4. Agrega los campos según se indica arriba
5. Selecciona el orden (Ascending/Descending)
6. Haz clic en **Create**

#### Método 2: Desde el error en la consola
Cuando Firestore detecta que falta un índice, generalmente proporciona un enlace directo en el error. Ejemplo:
```
The query requires an index. You can create it here: https://console.firebase.google.com/...
```
Simplemente haz clic en ese enlace y Firebase creará el índice automáticamente.

### Paso 4: Configurar Reglas de Seguridad

Actualiza las reglas de Firestore para permitir lectura/escritura (para desarrollo):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // DESARROLLO - Permitir todo (NO USAR EN PRODUCCIÓN)
    match /{document=**} {
      allow read, write: if true;
    }
    
    // PRODUCCIÓN - Reglas más restrictivas
    // match /course/{courseId} {
    //   allow read: if true;
    //   allow write: if request.auth != null;
    // }
    // match /tutoringSessions/{sessionId} {
    //   allow read: if request.auth != null;
    //   allow write: if request.auth != null;
    // }
    // ... más reglas específicas
  }
}
```

**⚠️ IMPORTANTE:** Las reglas de arriba son para DESARROLLO. En producción debes implementar reglas de seguridad apropiadas.

---

## 🧪 Datos de Ejemplo

### Crear un curso de ejemplo
```bash
POST /api/courses
Content-Type: application/json

{
  "name": "Cálculo I",
  "code": "MAT101",
  "credits": 3,
  "faculty": "Ingeniería",
  "prerequisites": []
}
```

### Crear una carrera de ejemplo
```bash
POST /api/majors
Content-Type: application/json

{
  "name": "Ingeniería de Sistemas",
  "code": "IS",
  "faculty": "Ingeniería"
}
```

### Verificar que funciona
```bash
GET /api/courses
GET /api/majors
```

---

## 🔍 Verificar la Configuración

### 1. Verificar Firebase Admin
```bash
GET /api/firebase/diagnostics
```

Deberías ver:
```json
{
  "success": true,
  "initializationStatus": "Successfully initialized",
  "firebaseConfig": {
    "hasProjectId": true,
    "hasClientEmail": true,
    "hasPrivateKey": true
  }
}
```

### 2. Verificar Colecciones
En Firebase Console → Firestore Database, deberías ver tus colecciones listadas.

### 3. Verificar Índices
En Firebase Console → Firestore Database → Indexes, deberías ver los índices en estado "Enabled".

---

## ❌ Solución de Problemas Comunes

### Error: "5 NOT_FOUND"
**Causa:** La colección no existe o los índices no están creados.

**Solución:**
1. Verifica que las colecciones existan en Firebase Console
2. Crea al menos un documento en cada colección
3. Crea los índices compuestos necesarios

### Error: "PERMISSION_DENIED"
**Causa:** Las reglas de Firestore no permiten la operación.

**Solución:**
1. Ve a Firebase Console → Firestore → Rules
2. Actualiza las reglas para permitir lectura/escritura (ver arriba)
3. Publica las nuevas reglas

### Error: "Firebase Admin not initialized"
**Causa:** Las credenciales de Firebase Admin no están configuradas.

**Solución:**
1. Verifica que tu archivo `.env.local` tenga las variables:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   - O `GOOGLE_SERVICE_ACCOUNT_KEY` (JSON completo)
2. Reinicia el servidor de desarrollo

### Colecciones vacías devuelven error
**Solución:** Ya implementada. El código ahora devuelve arrays vacíos en lugar de errores cuando las colecciones están vacías.

---

## 📚 Recursos Adicionales

- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firestore Indexes](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

---

**Última actualización:** 16 de enero de 2026

