# ✅ Solución Final: OAuth del Administrador

## 🎯 ¿Cómo Funciona?

**TÚ autorizas UNA VEZ**, los estudiantes suben sin OAuth, todo va a TU Drive.

## 🚀 Configuración Rápida (5 minutos)

### 1. Configurar Redirect URI

Ve a: https://console.cloud.google.com/apis/credentials

Edita tu OAuth Client y agrega:
```
http://localhost:3500/callback
```

### 2. Ejecutar Script

```bash
npm run setup-admin-oauth
```

### 3. Autorizar con calico-tutorias@gmail.com

- Se abrirá tu navegador
- Inicia sesión con tu Gmail
- Acepta permisos
- Copia el `GOOGLE_ADMIN_REFRESH_TOKEN` que te da

### 4. Agregar al .env

```env
GOOGLE_ADMIN_REFRESH_TOKEN=1//0gHdP9...tu_token...
```

### 5. Reiniciar servidor

```bash
npm run dev
```

## ✅ ¡Listo!

Ahora los estudiantes pueden subir comprobantes sin hacer OAuth.
Todo va directamente a tu Drive.

---

**Ver guía completa**: `ADMIN_OAUTH_SETUP.md`
