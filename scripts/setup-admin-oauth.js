/**
 * Script para configurar OAuth del ADMINISTRADOR (una sola vez)
 * 
 * Este script te ayuda a autorizar tu cuenta de Gmail (calico-tutorias@gmail.com)
 * y obtener el refresh_token que se usará para subir TODOS los comprobantes.
 * 
 * Los estudiantes NO necesitarán hacer OAuth, usarán tu token.
 * 
 * Ejecutar: node scripts/setup-admin-oauth.js
 */

require('dotenv').config({ path: '.env' });
const { google } = require('googleapis');
const http = require('http');
const url = require('url');
const { exec } = require('child_process');

const PORT = 3000;

// Función para abrir el navegador sin dependencia de 'open'
function openBrowser(url) {
  const platform = process.platform;
  let command;
  
  if (platform === 'win32') {
    command = `start "" "${url}"`;
  } else if (platform === 'darwin') {
    command = `open "${url}"`;
  } else {
    command = `xdg-open "${url}"`;
  }
  
  exec(command, (error) => {
    if (error) {
      console.log('⚠️  No se pudo abrir el navegador automáticamente');
      console.log('Por favor, copia y pega la URL manualmente\n');
    }
  });
}

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `http://localhost:${PORT}/callback`
);

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║   CONFIGURACIÓN DE OAUTH DEL ADMINISTRADOR                ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('Este proceso te ayudará a autorizar tu cuenta de Google');
console.log('(calico-tutorias@gmail.com) PARA SIEMPRE.\n');

console.log('Los estudiantes NO necesitarán autorizar nada.\n');

// Verificar variables de entorno
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error('❌ Error: Faltan GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET en .env\n');
  process.exit(1);
}

console.log('✅ Variables de entorno detectadas\n');

// Crear servidor temporal para recibir el callback
const server = http.createServer(async (req, res) => {
  if (req.url.indexOf('/callback') > -1) {
    const qs = new url.URL(req.url, `http://localhost:${PORT}`).searchParams;
    const code = qs.get('code');

    if (!code) {
      res.end('❌ Error: No se recibió código de autorización');
      return;
    }

    console.log('\n✅ Código de autorización recibido');
    console.log('🔄 Intercambiando por tokens permanentes...\n');

    try {
      const { tokens } = await oauth2Client.getToken(code);
      
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Autorización Exitosa</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 3rem;
              border-radius: 1rem;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              text-align: center;
              max-width: 500px;
            }
            h1 { color: #10b981; margin: 0 0 1rem 0; }
            p { color: #6b7280; line-height: 1.6; }
            .success { font-size: 4rem; margin-bottom: 1rem; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success">✅</div>
            <h1>¡Autorización Exitosa!</h1>
            <p>Tu cuenta de Google ha sido autorizada correctamente.</p>
            <p><strong>Puedes cerrar esta ventana</strong> y volver a la terminal.</p>
            <p style="margin-top: 2rem; font-size: 0.9rem; color: #9ca3af;">
              Los estudiantes podrán subir comprobantes sin hacer OAuth.
            </p>
          </div>
        </body>
        </html>
      `);

      console.log('═══════════════════════════════════════════════════════════');
      console.log('✅ ¡AUTORIZACIÓN EXITOSA!');
      console.log('═══════════════════════════════════════════════════════════\n');

      if (tokens.refresh_token) {
        console.log('📝 Agrega esta línea a tu archivo .env:\n');
        console.log('GOOGLE_ADMIN_REFRESH_TOKEN=' + tokens.refresh_token);
        console.log('');
      } else {
        console.log('⚠️  No se recibió refresh_token.');
        console.log('Esto puede pasar si ya autorizaste antes.');
        console.log('\nPara obtener un nuevo refresh_token:');
        console.log('1. Ve a: https://myaccount.google.com/permissions');
        console.log('2. Revoca el acceso a "Calico Tutorías"');
        console.log('3. Ejecuta este script nuevamente\n');
      }

      console.log('Access Token (válido 1 hora):');
      console.log(tokens.access_token);
      console.log('\n');

      console.log('Una vez agregues GOOGLE_ADMIN_REFRESH_TOKEN al .env,');
      console.log('todos los comprobantes se subirán a tu Drive automáticamente.\n');

      setTimeout(() => {
        server.close();
        process.exit(0);
      }, 1000);

    } catch (error) {
      console.error('❌ Error intercambiando código:', error);
      res.end('Error obteniendo tokens: ' + error.message);
      server.close();
      process.exit(1);
    }
  }
});

server.listen(PORT, async () => {
  console.log('🌐 Servidor temporal iniciado en http://localhost:' + PORT);
  console.log('');

  // IMPORTANTE: Configurar redirect URI antes
  console.log('⚠️  ANTES DE CONTINUAR, verifica en Google Cloud Console:');
  console.log('');
  console.log('1. Ve a: https://console.cloud.google.com/apis/credentials');
  console.log('2. Edita tu OAuth Client ID');
  console.log('3. Agrega este URI a "Authorized redirect URIs":');
  console.log(`   http://localhost:${PORT}/callback`);
  console.log('4. Guarda los cambios');
  console.log('');
  console.log('Presiona ENTER cuando hayas configurado el redirect URI...');

  // Esperar a que el usuario presione ENTER
  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/userinfo.email'
    ],
    prompt: 'consent', // Forzar a pedir refresh_token
  });

  console.log('\n🔐 Abriendo navegador para autorización...\n');
  console.log('Si no se abre automáticamente, ve a esta URL:');
  console.log(authUrl);
  console.log('\n');

  openBrowser(authUrl);

  console.log('Esperando autorización...\n');
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Puerto ${PORT} ya está en uso`);
    console.error('Cierra cualquier proceso que esté usando ese puerto e intenta de nuevo\n');
  } else {
    console.error('❌ Error en el servidor:', error);
  }
  process.exit(1);
});
