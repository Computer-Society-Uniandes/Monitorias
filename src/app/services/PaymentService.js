"use client";

import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import app from '../../firebaseConfig';

export class PaymentService {
  // Sube un archivo a Firebase Storage en la carpeta payment_proofs/{sessionId}/
  static async uploadPaymentProofFile(sessionId, file) {
    try {
      if (!app) throw new Error('Firebase app no inicializado');
      if (!sessionId) throw new Error('sessionId es requerido');
      if (!file) throw new Error('file es requerido');

      const storage = getStorage(app);
      const storageRef = ref(storage, `payment_proofs/${sessionId}/${Date.now()}_${file.name}`);

      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);

      return { success: true, url, path: snapshot.ref.fullPath, fileName: file.name };
    } catch (error) {
      console.error('Error subiendo comprobante:', error);
      return { success: false, error: error.message };
    }
  }
}
