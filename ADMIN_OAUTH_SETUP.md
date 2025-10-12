# 🔐 Configuración de OAuth del Administrador

## 🎯 ¿Qué Es Esto?

Esta es la solución perfecta para tu caso:
- **TÚ** (admin) autorizas tu Gmail UNA SOLA VEZ
- **Los estudiantes** suben archivos SIN hacer OAuth
- **Todos los archivos** van a TU Drive (calico-tutorias@gmail.com)
- **Sin ventanas popup** para los estudiantes

## ✅ Ventajas

- ✅ Sin Service Account (que no funciona con Gmail gratuito)
- ✅ Sin OAuth individual de cada estudiante
- ✅ Todos los comprobantes en TU cuenta centralizada
- ✅ Los estudiantes solo ven el formulario de reserva normal
- ✅ Gratis, sin necesidad de Google Workspace

## 📋 Pasos de Configuración (Solo Una Vez)

### Paso 1: Configurar Redirect URI en Google Cloud Console

1. Ve a: https://console.cloud.google.com/apis/credentials
2. Busca tu OAuth Client ID: `395373135024-f61efd2la6l58c3pv3kvegm569bfon0a`
3. Click en editar (ícono de lápiz)
4. En **"Authorized redirect URIs"**, agrega:
   ```
   http://localhost:3000/callback
   ```
5. Click **"SAVE"**
6. Espera 1-2 minutos para que se propague

### Paso 2: Instalar Dependencia (si no está)

```bash
npm install open
```

### Paso 3: Ejecutar Script de Autorización

```bash
node scripts/setup-admin-oauth.js
```

### Paso 4: Autorizar con TU Cuenta

1. El script abrirá tu navegador
2. **IMPORTANTE**: Inicia sesión con **calico-tutorias@gmail.com**
3. Acepta los permisos
4. El script mostrará algo como:

```
📝 Agrega esta línea a tu archivo .env:

GOOGLE_ADMIN_REFRESH_TOKEN=1//0gHdP9pX...muy_largo...
```

### Paso 5: Agregar Token a .env

Abre tu archivo `.env` y agrega la línea que te dio el script:

```env
GOOGLE_ADMIN_REFRESH_TOKEN=1//0gHdP9pX...tu_token_aqui...
```

**⚠️ MUY IMPORTANTE**: Este token es PERMANENTE y da acceso a tu Drive. Nunca lo compartas públicamente ni lo subas a Git.

### Paso 6: Reiniciar Servidor

```bash
# Detén el servidor (Ctrl+C)
npm run dev
```

## ✅ Listo!

Ahora cuando los estudiantes reserven y suban comprobantes:
- NO verán ningún popup de OAuth
- Los archivos se subirán automáticamente a TU Drive
- Todo irá a la carpeta: `1zBBTnoFYhbWdO6ElSKlUOIFhXHsKvDPJ`

## 🧪 Probar que Funciona

### Opción 1: Desde la App

1. Inicia la app: `npm run dev`
2. Ve a http://localhost:3000/home
3. Reserva una tutoría como estudiante
4. Sube un comprobante
5. Verifica en tu Drive (calico-tutorias@gmail.com)

### Opción 2: Script de Prueba

```bash
node scripts/test-google-drive.js
```

Debería ver:
```
✅ Autenticación exitosa
✅ Carpeta encontrada
✅ Archivo de prueba subido exitosamente
```

## 🔄 ¿Qué Pasa Detrás de Escena?

1. **Estudiante** sube archivo desde el navegador
2. **Frontend** envía archivo a `/api/upload-payment-proof`
3. **Backend** usa TU `GOOGLE_ADMIN_REFRESH_TOKEN`
4. **Google** genera un access_token temporal (automático)
5. **Archivo** se sube a TU Drive
6. **Estudiante** ve mensaje de éxito (sin saber que usó tu token)

## 🔒 Seguridad

### ¿Es Seguro?

**SÍ**, porque:
- El refresh_token NUNCA se envía al navegador
- Solo está en el servidor (archivo `.env`)
- Los estudiantes NO pueden ver ni acceder a tu token
- Solo pueden subir archivos, no ver ni eliminar
- Los archivos van a una carpeta específica

### Scopes Autorizados

Tu token solo tiene estos permisos:
- `drive.file` - Crear y gestionar archivos que la app cree
- `drive` - Acceso completo a Drive (necesario para carpetas)
- `userinfo.email` - Ver tu email

### ¿Puedo Revocar el Acceso?

SÍ, en cualquier momento:
1. Ve a: https://myaccount.google.com/permissions
2. Busca "Calico Tutorías"
3. Click "Eliminar acceso"
4. Tendrás que volver a ejecutar el script para obtener nuevo token

## 🐛 Troubleshooting

### Error: "redirect_uri_mismatch"

**Causa**: El redirect URI no está configurado en Google Cloud Console

**Solución**: Asegúrate de agregar exactamente: `http://localhost:3500/callback`

### Error: "GOOGLE_ADMIN_REFRESH_TOKEN no configurado"

**Causa**: No agregaste el token al archivo `.env`

**Solución**: Ejecuta `node scripts/setup-admin-oauth.js` y sigue los pasos

### No recibo refresh_token

**Causa**: Ya autorizaste antes

**Solución**:
1. Ve a: https://myaccount.google.com/permissions
2. Revoca "Calico Tutorías"
3. Ejecuta el script de nuevo

### El script no abre el navegador

**Solución**: Copia la URL que muestra el script y ábrela manualmente en tu navegador

## 📊 Comparación de Soluciones

| Método | Gmail Gratis | Sin OAuth Estudiante | Centralizado | Complejidad |
|--------|--------------|----------------------|--------------|-------------|
| **Service Account** | ❌ No funciona | ✅ | ✅ | Baja |
| **OAuth Individual** | ✅ | ❌ Cada uno | ❌ | Media |
| **OAuth Admin** (Esta) | ✅ | ✅ | ✅ | Baja |

## 🎉 Resultado Final

Después de configurar:

```
┌─────────────────────────────────────────────────────┐
│  ESTUDIANTE                                         │
│  1. Reserva tutoría                                 │
│  2. Sube comprobante                                │
│  3. Click "Confirmar"                               │
│  4. ✅ Listo (sin OAuth)                            │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  SERVIDOR (Automático)                              │
│  1. Recibe archivo                                  │
│  2. Usa tu GOOGLE_ADMIN_REFRESH_TOKEN               │
│  3. Sube a tu Drive                                 │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  TU DRIVE (calico-tutorias@gmail.com)               │
│  📁 Comprobantes de Pago                            │
│     ├─ session_abc_1234_comprobante1.jpg            │
│     ├─ session_def_5678_comprobante2.pdf            │
│     └─ ...                                          │
└─────────────────────────────────────────────────────┘
```

## 🚀 Siguiente Paso

Ejecuta ahora:

```bash
node scripts/setup-admin-oauth.js
```

Y sigue las instrucciones en pantalla.
