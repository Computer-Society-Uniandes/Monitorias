import { API_URL } from '../../../config/api';

export const GoogleDriveService = {
  uploadPaymentProofFile: async (sessionId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionId', sessionId);

      const response = await fetch(`${API_URL}/drive/upload-proof`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading file to Google Drive:', error);
      return { success: false, error: error.message };
    }
  }
};
