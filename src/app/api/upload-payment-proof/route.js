import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { Readable } from 'stream';

// Configurar las credenciales de Google Drive
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive'
];

// ID de la carpeta donde se guardarán los comprobantes de pago
const PAYMENT_PROOFS_FOLDER_ID = process.env.GDRIVE_PAYMENT_FOLDER_ID || '1234567890abcdefghijklmnop';

/**
 * Obtiene el cliente autenticado de Google Drive usando el refresh token del ADMINISTRADOR
 * El administrador autoriza UNA VEZ y ese token se usa para TODOS los estudiantes
 */
async function getGoogleDriveClient() {
  try {
    // Usar el refresh token del administrador (configurado en .env)
    const adminRefreshToken = process.env.GOOGLE_ADMIN_REFRESH_TOKEN;

    if (!adminRefreshToken) {
      throw new Error(
        'GOOGLE_ADMIN_REFRESH_TOKEN no configurado. ' +
        'Ejecuta: node scripts/setup-admin-oauth.js'
      );
    }

    console.log('🔐 Usando OAuth del administrador para subir archivo...');

    // Crear cliente OAuth con las credenciales del administrador
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'http://localhost:3000' // No importa porque no haremos redirect
    );

    // Configurar el refresh token del administrador
    oauth2Client.setCredentials({
      refresh_token: adminRefreshToken
    });

    // El refresh token automáticamente genera un nuevo access token cuando se necesita
    console.log('✅ Cliente OAuth del administrador configurado');

    return google.drive({ version: 'v3', auth: oauth2Client });

  } catch (error) {
    console.error('Error creating Google Drive client:', error);
    throw error;
  }
}

/**
 * POST - Sube un archivo a Google Drive
 */
export async function POST(request) {
  try {
    console.log('📤 Recibiendo solicitud de subida a Google Drive...');

    // Obtener FormData del request
    const formData = await request.formData();
    const file = formData.get('file');
    const sessionId = formData.get('sessionId');
    const fileName = formData.get('fileName');

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId es requerido' },
        { status: 400 }
      );
    }

    console.log('📋 Archivo recibido:', fileName || file.name);
    console.log('📋 Session ID:', sessionId);

    // Convertir el archivo a Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Crear un stream desde el buffer
    const stream = Readable.from(buffer);

    // Obtener cliente de Google Drive
    const drive = await getGoogleDriveClient();

    // Crear nombre único para el archivo
    const timestamp = Date.now();
    const uniqueFileName = `${sessionId}_${timestamp}_${fileName || file.name}`;

    console.log('🚀 Subiendo archivo a Google Drive:', uniqueFileName);

    // Metadatos del archivo
    const fileMetadata = {
      name: uniqueFileName,
      parents: [PAYMENT_PROOFS_FOLDER_ID], // Carpeta destino
      description: `Comprobante de pago para sesión ${sessionId}`,
    };

    // Media del archivo
    const media = {
      mimeType: file.type,
      body: stream,
    };

    // Subir el archivo
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, mimeType, webViewLink, webContentLink, thumbnailLink, size',
    });

    const uploadedFile = response.data;

    console.log('✅ Archivo subido exitosamente:', uploadedFile.id);

    // Hacer el archivo accesible (opcional - depende de tu caso de uso)
    // Esto permite que cualquiera con el link pueda ver el archivo
    try {
      await drive.permissions.create({
        fileId: uploadedFile.id,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
      console.log('✅ Permisos de lectura configurados');
    } catch (permError) {
      console.warn('⚠️ No se pudieron configurar permisos públicos:', permError.message);
    }

    // Retornar información del archivo subido
    return NextResponse.json({
      success: true,
      fileId: uploadedFile.id,
      fileName: uploadedFile.name,
      mimeType: uploadedFile.mimeType,
      webViewLink: uploadedFile.webViewLink,
      webContentLink: uploadedFile.webContentLink,
      thumbnailLink: uploadedFile.thumbnailLink,
      size: uploadedFile.size,
      message: 'Archivo subido exitosamente a Google Drive',
    });

  } catch (error) {
    console.error('❌ Error en POST /api/upload-payment-proof:', error);
    return NextResponse.json(
      {
        error: error.message || 'Error subiendo archivo a Google Drive',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Elimina un archivo de Google Drive
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json(
        { error: 'fileId es requerido' },
        { status: 400 }
      );
    }

    console.log('🗑️ Eliminando archivo de Google Drive:', fileId);

    const drive = await getGoogleDriveClient();

    await drive.files.delete({
      fileId: fileId,
    });

    console.log('✅ Archivo eliminado exitosamente');

    return NextResponse.json({
      success: true,
      message: 'Archivo eliminado exitosamente',
    });

  } catch (error) {
    console.error('❌ Error en DELETE /api/upload-payment-proof:', error);
    return NextResponse.json(
      {
        error: error.message || 'Error eliminando archivo de Google Drive',
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Obtiene información de un archivo
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json(
        { error: 'fileId es requerido' },
        { status: 400 }
      );
    }

    const drive = await getGoogleDriveClient();

    const response = await drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, webViewLink, webContentLink, thumbnailLink, size, createdTime',
    });

    return NextResponse.json({
      success: true,
      file: response.data,
    });

  } catch (error) {
    console.error('❌ Error en GET /api/upload-payment-proof:', error);
    return NextResponse.json(
      {
        error: error.message || 'Error obteniendo información del archivo',
      },
      { status: 500 }
    );
  }
}
