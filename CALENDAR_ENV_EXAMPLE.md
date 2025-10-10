# Configuración de Variables de Entorno - Calendario Central

## Variables de Entorno Requeridas

Para que la integración con el calendario central de Calico funcione correctamente, necesitas configurar las siguientes variables de entorno:

### `.env.local` (Desarrollo)

```bash
# Service Account de Google Calendar API
# IMPORTANTE: El valor debe ser el JSON completo como string
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"tu-proyecto","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"calico-calendar@tu-proyecto.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/calico-calendar%40tu-proyecto.iam.gserviceaccount.com"}

# ID del calendario central de Calico
CALICO_CALENDAR_ID=calico@tu-dominio.com
```

### `.env.production` (Producción)

Para producción, configura las mismas variables en tu plataforma de hosting:

- **Vercel**: En Project Settings > Environment Variables
- **Netlify**: En Site Settings > Environment Variables  
- **Railway/Heroku**: En configuración de variables de entorno

## 📋 Pasos para Configurar

### 1. **Crear Service Account en Google Cloud**

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto o crea uno nuevo
3. Ve a **IAM & Admin > Service Accounts**
4. Haz clic en **"Create Service Account"**
5. Completa los datos:
   - **Name**: `Calico Calendar Service`
   - **ID**: `calico-calendar`
   - **Description**: `Service Account para gestionar eventos del calendario central de Calico`

### 2. **Habilitar Google Calendar API**

1. Ve a **APIs & Services > Library**
2. Busca "Google Calendar API"
3. Haz clic en **"Enable"**

### 3. **Crear y Descargar Clave**

1. En Service Accounts, haz clic en la cuenta creada
2. Ve a la pestaña **"Keys"**
3. Haz clic en **"Add Key" > "Create New Key"**
4. Selecciona **JSON** y descarga el archivo
5. **⚠️ IMPORTANTE**: Guarda este archivo de forma segura

### 4. **Configurar Calendario Central**

1. Ve a [Google Calendar](https://calendar.google.com/)
2. Crea un nuevo calendario llamado **"Calico - Sesiones de Tutoría"**
3. En configuración del calendario:
   - Ve a **"Share with specific people"**
   - Agrega el email de la Service Account (ej: `calico-calendar@tu-proyecto.iam.gserviceaccount.com`)
   - Dale permisos de **"Make changes to events"**
4. Copia el **Calendar ID** desde la configuración del calendario

### 5. **Configurar Variables de Entorno**

1. Abre el archivo JSON descargado
2. Copia todo el contenido JSON (en una sola línea)
3. Configura `GOOGLE_SERVICE_ACCOUNT_KEY` con ese JSON
4. Configura `CALICO_CALENDAR_ID` con el ID del calendario

## 🔧 Ejemplo de JSON de Service Account

El contenido de `GOOGLE_SERVICE_ACCOUNT_KEY` debe verse así:

```json
{
  "type": "service_account",
  "project_id": "calico-proyecto-123",
  "private_key_id": "abc123def456...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "calico-calendar@calico-proyecto-123.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/calico-calendar%40calico-proyecto-123.iam.gserviceaccount.com"
}
```

## ✅ Verificación

Para verificar que la configuración funciona:

1. Reinicia tu servidor de desarrollo
2. Intenta reservar una tutoría
3. Verifica que:
   - La sesión se crea en Firebase
   - Se crea un evento en el calendario central
   - Llegan invitaciones por email a tutor y estudiante

## 🚨 Seguridad

### **⚠️ NUNCA HAGAS ESTO:**
- ❌ Commitear el JSON de la Service Account al repositorio
- ❌ Exponer las credenciales en el frontend
- ❌ Compartir las credenciales por email o chat

### **✅ BUENAS PRÁCTICAS:**
- ✅ Usar variables de entorno para todas las credenciales
- ✅ Agregar `*.json` al `.gitignore`
- ✅ Usar diferentes Service Accounts para desarrollo y producción
- ✅ Rotar las claves periódicamente

## 🔍 Troubleshooting

### **Error: "GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set"**
- Verifica que la variable esté configurada correctamente
- Asegúrate de reiniciar el servidor después de cambiar variables

### **Error: "Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY"**
- Verifica que el JSON esté bien formateado
- Asegúrate de que no haya caracteres especiales mal escapados

### **Error: "No se tienen permisos para crear eventos"**
- Verifica que el calendario esté compartido con la Service Account
- Confirma que los permisos sean "Make changes to events"

### **Error: "El calendario central no fue encontrado"**
- Verifica que `CALICO_CALENDAR_ID` esté configurado correctamente
- Confirma que el ID del calendario sea correcto

## 📞 Soporte

Si tienes problemas con la configuración:

1. Verifica cada paso de esta guía
2. Revisa los logs del servidor para errores específicos
3. Confirma que las APIs estén habilitadas en Google Cloud
4. Verifica los permisos del calendario

---

**¡Una vez configurado correctamente, todas las sesiones de tutoría se crearán automáticamente en el calendario central de Calico! 🎉**
