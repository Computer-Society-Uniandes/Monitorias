/**
 * Script de prueba para verificar la configuración de Google Drive API
 * Ejecutar: node scripts/test-google-drive.js
 */

// Cargar variables de entorno desde .env.local o .env
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const { google } = require('googleapis');

async function testGoogleDriveConfiguration() {
  console.log('🧪 Verificando configuración de Google Drive API...\n');

  // 1. Verificar variables de entorno
  console.log('📋 Paso 1: Verificando variables de entorno...');
  
  // Soportar dos formatos: JSON completo o variables separadas
  let serviceAccountEmail, privateKey;
  
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    console.log('  ℹ️  Detectado formato JSON completo (GOOGLE_SERVICE_ACCOUNT_KEY)');
    try {
      const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      serviceAccountEmail = serviceAccount.client_email;
      privateKey = serviceAccount.private_key;
      console.log('  ✅ JSON parseado exitosamente');
    } catch (error) {
      console.log('  ❌ Error parseando GOOGLE_SERVICE_ACCOUNT_KEY:', error.message);
      process.exit(1);
    }
  } else {
    console.log('  ℹ️  Usando formato de variables separadas');
    serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    privateKey = process.env.GOOGLE_PRIVATE_KEY;
  }
  
  const requiredEnvVars = {
    'GOOGLE_SERVICE_ACCOUNT_EMAIL': serviceAccountEmail,
    'GOOGLE_PRIVATE_KEY': privateKey ? '✓ Presente' : '✗ Faltante',
    'GDRIVE_PAYMENT_FOLDER_ID': process.env.GDRIVE_PAYMENT_FOLDER_ID,
  };

  let hasAllVars = true;
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    const status = value ? '✅' : '❌';
    const displayValue = key === 'GOOGLE_PRIVATE_KEY' ? value : (value || 'NO CONFIGURADA');
    console.log(`  ${status} ${key}: ${displayValue}`);
    if (!value) hasAllVars = false;
  }

  if (!hasAllVars) {
    console.log('\n❌ Faltan variables de entorno. Revisa tu archivo .env o .env.local');
    console.log('📖 Lee GOOGLE_DRIVE_SETUP.md para instrucciones completas\n');
    process.exit(1);
  }

  console.log('\n✅ Todas las variables de entorno están configuradas\n');

  // 2. Intentar autenticar con Google Drive
  console.log('🔐 Paso 2: Autenticando con Google Drive...');
  
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: serviceAccountEmail,
        private_key: privateKey.replace(/\\n/g, '\n'),
      },
      scopes: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive'
      ],
    });

    const drive = google.drive({ version: 'v3', auth });
    console.log('✅ Autenticación exitosa\n');

    // 3. Verificar acceso a la carpeta
    console.log('📁 Paso 3: Verificando acceso a la carpeta...');
    
    const folderId = process.env.GDRIVE_PAYMENT_FOLDER_ID;
    
    try {
      const folderResponse = await drive.files.get({
        fileId: folderId,
        fields: 'id, name, mimeType, owners, permissions',
      });

      console.log('✅ Carpeta encontrada:');
      console.log(`  📂 Nombre: ${folderResponse.data.name}`);
      console.log(`  🆔 ID: ${folderResponse.data.id}`);
      console.log(`  👤 Propietario: ${folderResponse.data.owners?.[0]?.emailAddress || 'N/A'}`);
      console.log('');

      // Verificar permisos
      const permissions = await drive.permissions.list({
        fileId: folderId,
        fields: 'permissions(id, emailAddress, role, type)',
      });

      console.log('👥 Permisos de la carpeta:');
      const serviceAccountHasAccess = permissions.data.permissions.some(
        p => p.emailAddress === serviceAccountEmail
      );

      permissions.data.permissions.forEach(permission => {
        const isServiceAccount = permission.emailAddress === serviceAccountEmail;
        const marker = isServiceAccount ? '✅' : '  ';
        console.log(`  ${marker} ${permission.emailAddress || permission.type} (${permission.role})`);
      });

      if (!serviceAccountHasAccess) {
        console.log('\n⚠️  WARNING: La service account no tiene permisos explícitos en la carpeta');
        console.log('   Asegúrate de haber compartido la carpeta con:');
        console.log(`   ${serviceAccountEmail}\n`);
      } else {
        console.log('\n✅ La service account tiene acceso a la carpeta\n');
      }

      // 4. Hacer una prueba de escritura
      console.log('📝 Paso 4: Probando subida de archivo de prueba...');
      
      const testFileMetadata = {
        name: `test_${Date.now()}.txt`,
        parents: [folderId],
        description: 'Archivo de prueba - puedes eliminarlo',
      };

      const testMedia = {
        mimeType: 'text/plain',
        body: 'Este es un archivo de prueba generado por test-google-drive.js\nPuedes eliminarlo.',
      };

      const uploadResponse = await drive.files.create({
        requestBody: testFileMetadata,
        media: testMedia,
        fields: 'id, name, webViewLink',
      });

      console.log('✅ Archivo de prueba subido exitosamente:');
      console.log(`  📄 Nombre: ${uploadResponse.data.name}`);
      console.log(`  🆔 ID: ${uploadResponse.data.id}`);
      console.log(`  🔗 Link: ${uploadResponse.data.webViewLink}`);
      console.log('');

      // Opcional: Eliminar el archivo de prueba
      console.log('🗑️  Eliminando archivo de prueba...');
      await drive.files.delete({
        fileId: uploadResponse.data.id,
      });
      console.log('✅ Archivo de prueba eliminado\n');

    } catch (folderError) {
      console.log('❌ Error accediendo a la carpeta:');
      console.log(`   ${folderError.message}\n`);
      
      if (folderError.code === 404) {
        console.log('💡 Posibles causas:');
        console.log('   - El ID de la carpeta es incorrecto');
        console.log('   - La carpeta fue eliminada');
        console.log('   - La carpeta no está compartida con la service account\n');
      } else if (folderError.code === 403) {
        console.log('💡 Posibles causas:');
        console.log('   - La carpeta no está compartida con la service account');
        console.log('   - Los permisos de la service account son insuficientes\n');
        console.log('Asegúrate de compartir la carpeta con:');
        console.log(`   ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}\n`);
      }
      
      process.exit(1);
    }

  } catch (authError) {
    console.log('❌ Error en la autenticación:');
    console.log(`   ${authError.message}\n`);
    
    console.log('💡 Posibles causas:');
    console.log('   - El GOOGLE_PRIVATE_KEY está mal formateado');
    console.log('   - El GOOGLE_SERVICE_ACCOUNT_EMAIL es incorrecto');
    console.log('   - Las credenciales de la service account fueron revocadas\n');
    
    process.exit(1);
  }

  // 5. Resultado final
  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ ¡CONFIGURACIÓN EXITOSA!');
  console.log('═══════════════════════════════════════════════════════');
  console.log('Tu aplicación está lista para subir archivos a Google Drive');
  console.log('Puedes empezar a usar la funcionalidad de comprobantes de pago\n');
}

// Ejecutar la prueba
testGoogleDriveConfiguration().catch(error => {
  console.error('\n❌ Error inesperado:', error);
  process.exit(1);
});
