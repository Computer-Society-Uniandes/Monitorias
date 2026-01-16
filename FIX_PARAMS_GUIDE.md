# 🔧 Guía para Arreglar Next.js 15 Params Issue

## ❌ Problema

Next.js 15 requiere que los `params` sean "awaited" antes de acceder a sus propiedades.

## ✅ Solución

### Patrón a Buscar y Reemplazar

**BUSCAR:**
```javascript
export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
```

**REEMPLAZAR CON:**
```javascript
export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
```

---

## 📝 Lista de Archivos a Arreglar

### ✅ Ya Arreglados
- [x] `src/app/api/tutoring-sessions/student/[studentId]/route.js`
- [x] `src/app/api/users/[id]/route.js`

### ❌ Pendientes de Arreglar

#### Courses
- [ ] `src/app/api/courses/[id]/route.js`
  - GET (línea ~14)
  - PUT (línea ~49)
  - DELETE (línea ~85)

#### Majors
- [ ] `src/app/api/majors/[id]/route.js`
  - GET (línea ~14)
  - PUT (línea ~49)
  - DELETE (línea ~85)

#### Tutoring Sessions - Main
- [ ] `src/app/api/tutoring-sessions/[id]/route.js`
  - GET (línea ~13)
  - PUT (línea ~37)

#### Tutoring Sessions - Actions
- [ ] `src/app/api/tutoring-sessions/[id]/accept/route.js`
  - POST (línea ~13)

- [ ] `src/app/api/tutoring-sessions/[id]/cancel/route.js`
  - POST (línea ~13)

- [ ] `src/app/api/tutoring-sessions/[id]/complete/route.js`
  - POST (línea ~13)

- [ ] `src/app/api/tutoring-sessions/[id]/decline/route.js`
  - POST (línea ~13)

- [ ] `src/app/api/tutoring-sessions/[id]/reject/route.js`
  - POST (línea ~13)

- [ ] `src/app/api/tutoring-sessions/[id]/reviews/route.js`
  - GET (línea ~13)
  - POST (línea ~35)

#### Tutoring Sessions - Student
- [ ] `src/app/api/tutoring-sessions/student/[studentId]/courses/route.js`
  - GET (línea ~12)

- [ ] `src/app/api/tutoring-sessions/student/[studentId]/history/route.js`
  - GET (línea ~13)

- [ ] `src/app/api/tutoring-sessions/student/[studentId]/stats/route.js`
  - GET (línea ~12)

#### Tutoring Sessions - Tutor
- [ ] `src/app/api/tutoring-sessions/tutor/[tutorId]/route.js`
  - GET (línea ~13)

- [ ] `src/app/api/tutoring-sessions/tutor/[tutorId]/pending/route.js`
  - GET (línea ~13)

- [ ] `src/app/api/tutoring-sessions/tutor/[tutorId]/stats/route.js`
  - GET (línea ~12)

#### Calico Calendar
- [ ] `src/app/api/calico-calendar/tutoring-session/[eventId]/route.js`
  - GET (línea ~18)
  - PUT (línea ~53)
  - DELETE (línea ~102)

- [ ] `src/app/api/calico-calendar/tutoring-session/[eventId]/cancel/route.js`
  - POST (línea ~17)

---

## 🔍 Variaciones del Patrón

### Para diferentes nombres de parámetros:

#### `[id]`
```javascript
// Antes
const { id } = params;

// Después
const resolvedParams = await params;
const { id } = resolvedParams;
```

#### `[studentId]`
```javascript
// Antes
const { studentId } = params;

// Después
const resolvedParams = await params;
const { studentId } = resolvedParams;
```

#### `[tutorId]`
```javascript
// Antes
const { tutorId } = params;

// Después
const resolvedParams = await params;
const { tutorId } = resolvedParams;
```

#### `[eventId]`
```javascript
// Antes
const { eventId } = params;

// Después
const resolvedParams = await params;
const { eventId } = resolvedParams;
```

---

## ⚡ Comando de Búsqueda Rápida

Para encontrar todos los archivos que necesitan ser arreglados:

```bash
# En la raíz del proyecto
grep -r "const { .* } = params;" src/app/api --include="*.js"
```

---

## 🧪 Verificación

Después de arreglar cada archivo, verifica:

1. ✅ No hay errores de sintaxis
2. ✅ El servidor Next.js no muestra warnings
3. ✅ El endpoint responde correctamente
4. ✅ No hay errores en la consola del navegador

---

## 📋 Checklist de Progreso

**Total:** 19 archivos  
**Completados:** 2/19 (10.5%)  
**Pendientes:** 17/19 (89.5%)

### Por Categoría:
- Courses: 0/1
- Majors: 0/1
- Tutoring Sessions: 1/13
- Calico Calendar: 0/2
- Users: 1/1 ✅

---

## 💡 Tips

1. **Hazlo en lotes** - Arregla por categoría (ej: todos los de courses primero)
2. **Verifica después de cada cambio** - Asegúrate que el servidor sigue corriendo
3. **Usa Find & Replace** - La mayoría de editores permiten reemplazo en múltiples archivos
4. **Commit frecuentemente** - Haz commit después de arreglar cada categoría

---

## 🚨 Errores Comunes a Evitar

❌ **NO hagas esto:**
```javascript
const { id } = await params;  // Sintaxis inválida
```

✅ **HAZ esto:**
```javascript
const resolvedParams = await params;
const { id } = resolvedParams;
```

---

**Última Actualización:** 16 de enero de 2026

