# Calico - Frontend

Aplicación web desarrollada con Next.js y React para la plataforma de tutorías Calico. Permite a estudiantes buscar tutores, agendar sesiones y gestionar sus tutorías.

## 🚀 ¿Qué hace este proyecto?

Este frontend proporciona una interfaz completa para:

- **Búsqueda de Tutores**: Buscar tutores por nombre o materia
- **Gestión de Disponibilidad**: Ver y reservar slots de disponibilidad de tutores
- **Sesiones de Tutoría**: Agendar, ver y gestionar sesiones de tutoría
- **Pagos**: Procesar pagos mediante integración con Wompi
- **Perfiles**: Gestionar perfiles de estudiantes y tutores
- **Notificaciones**: Sistema de notificaciones en tiempo real
- **Calendario**: Visualización de disponibilidad en calendario

## 🛠️ Tecnologías

- **Next.js 15** - Framework React con SSR
- **React 19** - Biblioteca UI
- **Tailwind CSS** - Estilos
- **Firebase Auth** - Autenticación
- **Axios** - Cliente HTTP
- **React Calendar** - Componente de calendario
- **Lucide React** - Iconos

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales
```

## ⚙️ Configuración

Crea un archivo `.env.local` con las siguientes variables:

```env
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:3002/api

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=tu-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=tu-app-id

# Wompi (opcional)
NEXT_PUBLIC_WOMPI_PUBLIC_KEY=tu-wompi-public-key
```

## 🏃 Comandos Útiles

```bash
# Desarrollo
npm run dev              # Inicia servidor de desarrollo (puerto 3000)

# Producción
npm run build            # Compila para producción
npm start                # Inicia servidor de producción

# Testing
npm test                 # Ejecuta tests
npm run test:watch       # Tests en modo watch

# Linting
npm run lint             # Ejecuta ESLint
```

## 🏗️ Estructura del Proyecto

```
src/
├── app/
│   ├── components/       # Componentes reutilizables
│   │   ├── CourseCard/  # Tarjetas de materias
│   │   ├── TutorCard/   # Tarjetas de tutores
│   │   └── ...
│   ├── services/        # Servicios API
│   │   ├── core/        # Servicios principales
│   │   └── utils/       # Utilidades
│   ├── hooks/           # Custom hooks
│   ├── context/         # Context providers
│   └── home/            # Páginas principales
├── components/           # Componentes UI (shadcn)
└── lib/                 # Utilidades y configuraciones
```

## 🎨 Componentes Principales

- **CourseCard** - Tarjetas de materias/cursos
- **TutorCard** - Tarjetas de tutores
- **AvailabilityCalendar** - Calendario de disponibilidad
- **SessionConfirmationModal** - Modal de confirmación de sesión
- **NotificationDropdown** - Dropdown de notificaciones

## 🔑 Funcionalidades Clave

### Búsqueda y Reserva
- Búsqueda de tutores por nombre o materia
- Visualización de disponibilidad en calendario
- Reserva de slots con confirmación de pago

### Gestión de Sesiones
- Ver sesiones agendadas
- Confirmar/cancelar sesiones
- Historial de tutorías

### Pagos
- Integración con Wompi
- Procesamiento seguro de pagos
- Confirmación de transacciones

## 📋 Historias de Usuario Implementadas

### Historia 1: Reserva de Tutoría
**Componentes:**
- `CourseCard` - Selección de materia
- `AvailabilityCalendar` - Visualización de disponibilidad
- `SessionConfirmationModal` - Confirmación de reserva

**Flujo:** Estudiante selecciona materia → Ve tutores disponibles → Selecciona slot → Confirma reserva → Recibe enlace de Google Meet.

### Historia 2: Pago Seguro de la Tutoría
**Componentes:**
- `SessionConfirmationModal` - Integración con Wompi Widget
- `PaymentService` - Gestión de pagos

**Flujo:** Al confirmar reserva, se abre el widget de Wompi → Estudiante ingresa datos de pago → Pago procesado → Sesión confirmada automáticamente.

### Historia 3: Visualización de Ganancias del Tutor
**Componentes:**
- Dashboard del tutor (`/tutor/inicio`)
- Componentes de estadísticas y pagos

**Flujo:** Tutor accede a su dashboard → Ve resumen de ganancias → Filtra por fecha/estudiante → Consulta detalles de cada pago.

### Historia 4: Calificación y Feedback de la Tutoría
**Componentes:**
- `ReviewModal` - Modal de calificación
- Sistema de estrellas (1-5) y comentarios

**Flujo:** Después de la sesión, estudiante puede calificar → Selecciona estrellas → Escribe comentario → Reseña guardada y visible.

### Historia 5: Inicio de Sesión Seguro
**Componentes:**
- Páginas de Login/Registro
- `SecureAuthContext` - Context de autenticación
- Guards de protección de rutas

**Flujo:** Usuario ingresa credenciales → Firebase Auth valida → Token almacenado → Acceso a rutas protegidas.

### Historia 6: Gestión del Perfil del Tutor
**Componentes:**
- Página de perfil (`/perfil`)
- `UnifiedAvailability` - Gestión de disponibilidad
- Formularios de edición de perfil

**Flujo:** Tutor accede a su perfil → Edita biografía y materias → Gestiona horarios → Sincroniza con Google Calendar.

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests en modo watch
npm run test:watch

# Tests en CI
npm run test:ci
```

## 📱 Responsive Design

La aplicación está completamente optimizada para:
- 📱 Móviles
- 📱 Tablets
- 💻 Desktop

## 🎯 Rutas Principales

- `/` - Página de inicio
- `/home/buscar-tutores` - Búsqueda de tutores
- `/tutor/inicio` - Dashboard de tutor
- `/estudiante/inicio` - Dashboard de estudiante
- `/perfil` - Perfil de usuario

## 📝 Notas Importantes

- El servidor de desarrollo corre en el puerto **3000**
- Requiere que el backend esté corriendo en el puerto 3002
- Las variables de entorno deben tener el prefijo `NEXT_PUBLIC_` para ser accesibles en el cliente
- Firebase Auth debe estar configurado correctamente

## 🔗 Enlaces Útiles

- [Documentación Next.js](https://nextjs.org/docs)
- [Documentación React](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Firebase Auth](https://firebase.google.com/docs/auth)
