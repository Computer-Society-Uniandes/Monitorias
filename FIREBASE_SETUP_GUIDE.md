# 🔥 Guía de Configuración Firebase - Calico

Esta guía te ayudará a configurar Firebase correctamente para que la aplicación Calico funcione perfectamente.

## 📋 Checklist de Configuración

- [ ] **Paso 1**: Configurar Authentication
- [ ] **Paso 2**: Configurar Firestore Database
- [ ] **Paso 3**: Configurar reglas de seguridad
- [ ] **Paso 4**: Poblar datos iniciales
- [ ] **Paso 5**: Probar la aplicación

---

## 🔐 Paso 1: Configurar Authentication

### 1.1 Habilitar Authentication en Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto `calico-5980a`
3. Ve a **Authentication** > **Sign-in method**
4. Habilita los siguientes métodos:

   **Email/Password:**
   - Habilitar ✅
   - Permitir usuarios crear cuentas ✅

   **Google (Opcional pero recomendado):**
   - Habilitar ✅
   - Configurar con tu email de soporte

### 1.2 Configurar dominios autorizados

En **Authentication** > **Settings** > **Authorized domains**, agrega:
- `localhost` (para desarrollo)
- Tu dominio de producción cuando lo tengas

---

## 🗄️ Paso 2: Configurar Firestore Database

### 2.1 Crear la base de datos

1. Ve a **Firestore Database**
2. Haz clic en **Create database**
3. Selecciona **Start in test mode** (cambiaremos las reglas después)
4. Elige la región: **us-central1** (o la más cercana a Colombia)

### 2.2 Estructura de colecciones

Tu base de datos debe tener estas colecciones:

```
📁 calico-5980a (project)
├── 📁 user/                    # Usuarios (estudiantes y tutores)
├── 📁 course/                  # Materias/cursos
├── 📁 major/                   # Carreras universitarias
├── 📁 availabilities/          # Disponibilidad de tutores
├── 📁 tutoring_sessions/       # Sesiones agendadas (futuro)
└── 📁 payments/               # Pagos (futuro)
```

---

## 🛡️ Paso 3: Configurar Reglas de Seguridad

### 3.1 Aplicar reglas de Firestore

1. Ve a **Firestore Database** > **Rules**
2. Copia y pega el contenido del archivo `firestore.rules`
3. Haz clic en **Publish**

### 3.2 Configurar reglas de Authentication (opcional)

Si quieres restringir el registro solo a emails @uniandes.edu.co:

1. Ve a **Authentication** > **Templates**
2. Selecciona **Email verification**
3. Personaliza el template según tus necesidades

---

## 📊 Paso 4: Poblar Datos Iniciales

### 4.1 Opción A: Usar el script automatizado (Recomendado)

```bash
# En la raíz del proyecto
node scripts/firebase-init-data.js
```

### 4.2 Opción B: Usar Firebase Console (Manual)

Si prefieres hacerlo manualmente, sigue las estructuras documentadas en `FIREBASE_COLLECTIONS_STRUCTURE.md`

### 4.3 Datos que se crearán

El script creará:
- **4 carreras** (Ingeniería de Sistemas, Matemáticas, Ingeniería Civil, Física)
- **10 materias** (Cálculo, Programación, Física, etc.)
- **5 tutores** con diferentes especializaciones
- **3 estudiantes** de prueba
- **5 disponibilidades** de ejemplo

---

## 🧪 Paso 5: Probar la Aplicación

### 5.1 Verificar conexión

1. Inicia la aplicación: `npm run dev`
2. Ve a la página de registro
3. Intenta registrar un usuario con email @uniandes.edu.co
4. Verifica que aparezca en **Authentication** > **Users**

### 5.2 Probar funcionalidades

**Como Estudiante:**
1. Regístrate con un email @uniandes.edu.co
2. Ve a **"Buscar Tutores"**
3. Busca una materia (ej: "Cálculo")
4. Verifica que aparezcan tutores disponibles

**Como Tutor:**
1. Cambia `isTutor: true` en Firestore para un usuario existente
2. Ve a la sección de tutores
3. Verifica que funcionen las opciones de disponibilidad

### 5.3 Verificar datos en Firestore

En Firebase Console > Firestore, deberías ver:
- Documentos en la colección `user`
- Documentos en la colección `course`
- Documentos en la colección `availabilities`

---

## 🔧 Configuraciones Adicionales

### API Keys de Google Calendar (Opcional)

Para sincronización con Google Calendar:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Habilita **Google Calendar API**
3. Crea credenciales OAuth 2.0
4. Agrega las credenciales a tu aplicación

### Variables de Entorno

Crea un archivo `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=calico-5980a.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=calico-5980a
# ... otras variables
```

---

## 🚨 Resolución de Problemas

### Error: "Permission denied"

**Problema**: Las reglas de Firestore están bloqueando el acceso

**Solución**:
1. Verifica que las reglas estén aplicadas correctamente
2. Para testing temporal, usa estas reglas permisivas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // ⚠️ SOLO PARA TESTING
    }
  }
}
```

**⚠️ Importante**: Cambia de vuelta a las reglas seguras antes de producción.

### Error: "Collection doesn't exist"

**Problema**: Las colecciones no han sido creadas

**Solución**:
1. Ejecuta el script de inicialización: `node scripts/firebase-init-data.js`
2. O crea manualmente al menos un documento en cada colección

### Error: "Authentication required"

**Problema**: El usuario no está autenticado

**Solución**:
1. Verifica que Authentication esté habilitado
2. Asegúrate de que el usuario esté logueado
3. Verifica que el token de autenticación sea válido

### Error: "Function doesn't exist"

**Problema**: Faltan métodos en los servicios de Firebase

**Solución**:
1. Verifica que todos los archivos estén importados correctamente
2. Revisa que los métodos existan en `FirebaseAvailabilityService`

---

## ✅ Verificación Final

Después de completar todos los pasos, verifica:

- [ ] Usuarios pueden registrarse con @uniandes.edu.co
- [ ] Usuarios pueden iniciar sesión
- [ ] Se pueden ver las materias en "Buscar Tutores"
- [ ] Se pueden ver tutores al seleccionar una materia
- [ ] Se muestra la disponibilidad de los tutores
- [ ] No hay errores en la consola del navegador
- [ ] Los datos aparecen correctamente en Firebase Console

---

## 📞 Soporte

Si encuentras problemas:

1. **Revisa la consola del navegador** para errores específicos
2. **Verifica Firebase Console** para ver si los datos están llegando
3. **Comprueba las reglas de Firestore** si hay errores de permisos
4. **Revisa la configuración de Authentication** si hay problemas de login

---

## 🎉 ¡Listo!

Una vez completados todos los pasos, tu aplicación Calico debería funcionar perfectamente con Firebase. La estructura está preparada tanto para la funcionalidad actual como para futuras implementaciones de agendamiento y pagos. 