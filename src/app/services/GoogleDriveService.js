"use client";

/**
 * Google Drive Service con OAuth
 * Maneja la subida de archivos a Google Drive usando OAuth del usuario
 * Alternativa a Firebase Storage para el plan gratuito
 */
export class GoogleDriveService {
  // ID de la carpeta en Google Drive donde se guardarán los comprobantes
  static PAYMENT_PROOFS_FOLDER_ID = process.env.NEXT_PUBLIC_GDRIVE_PAYMENT_FOLDER_ID || 'root';

  /**
   * Verifica si el usuario tiene Google Drive conectado
   * @returns {Promise<{connected: boolean, email: string}>}
   */
  static async checkConnection() {
    try {
      const response = await fetch('/api/gdrive-oauth/status');
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error checking Drive connection:', error);
      return { connected: false };
    }
  }

  /**
   * Inicia el flujo de OAuth para conectar Google Drive
   * @returns {string} URL de autorización
   */
  static async initiateOAuth() {
    try {
      const response = await fetch('/api/gdrive-oauth/authorize');
      const result = await response.json();
      
      if (result.authUrl) {
        // Abrir en nueva ventana
        window.open(result.authUrl, 'google-auth', 'width=600,height=700');
        return result.authUrl;
      }
      
      throw new Error('No se pudo obtener URL de autorización');
    } catch (error) {
      console.error('Error initiating OAuth:', error);
      throw error;
    }
  }

  /**
   * Sube un comprobante de pago a Google Drive (cuenta del administrador)
   * El servidor usa el GOOGLE_ADMIN_REFRESH_TOKEN del .env
   * Los estudiantes NO necesitan hacer OAuth
   * 
   * @param {string} sessionId - ID de la sesión de tutoría
   * @param {File} file - Archivo a subir (imagen o PDF)
   * @returns {Promise<{success: boolean, url: string, fileId: string, fileName: string}>}
   */
  static async uploadPaymentProofFile(sessionId, file) {
    try {
      if (!sessionId) throw new Error('sessionId es requerido');
      if (!file) throw new Error('file es requerido');

      console.log('📤 Subiendo comprobante a Google Drive (cuenta administrador)...');
      console.log('📋 Session ID:', sessionId);
      console.log('📄 File:', file.name, file.type, file.size);

      // Crear FormData con el archivo y metadatos
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionId', sessionId);
      formData.append('fileName', file.name);
      formData.append('mimeType', file.type);

      // Llamar a la API route que usa el OAuth del administrador
      const response = await fetch('/api/upload-payment-proof', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Comprobante subido exitosamente a la cuenta del administrador');

      return {
        success: true,
        url: result.webViewLink || result.webContentLink,
        fileId: result.fileId,
        fileName: file.name,
        thumbnailLink: result.thumbnailLink
      };

    } catch (error) {
      console.error('❌ Error subiendo comprobante:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtiene la URL de visualización de un archivo en Google Drive
   * @param {string} fileId - ID del archivo en Google Drive
   * @returns {string} URL para ver el archivo
   */
  static getFileViewUrl(fileId) {
    return `https://drive.google.com/file/d/${fileId}/view`;
  }

  /**
   * Obtiene la URL de descarga directa de un archivo
   * @param {string} fileId - ID del archivo en Google Drive
   * @returns {string} URL para descargar el archivo
   */
  static getFileDownloadUrl(fileId) {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  /**
   * Obtiene la URL del thumbnail de un archivo
   * @param {string} fileId - ID del archivo en Google Drive
   * @returns {string} URL del thumbnail
   */
  static getFileThumbnailUrl(fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
  }

  /**
   * Elimina un archivo de Google Drive
   * @param {string} fileId - ID del archivo a eliminar
   * @returns {Promise<{success: boolean}>}
   */
  static async deleteFile(fileId) {
    try {
      const response = await fetch(`/api/upload-payment-proof?fileId=${fileId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error eliminando archivo');
      }

      console.log('✅ Archivo eliminado de Google Drive:', fileId);
      return { success: true };

    } catch (error) {
      console.error('❌ Error eliminando archivo:', error);
      return { success: false, error: error.message };
    }
  }
}
