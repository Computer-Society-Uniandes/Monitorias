/**
 * PaymentController - SIMPLE
 * Maneja requests de pagos
 */

import { NextResponse } from 'next/server';
import { PaymentDTO } from '../dto/payment.dto';
import { PaymentService } from '../services/core/PaymentService';

export class PaymentController {
  /**
   * GET /api/payments/student/[email]
   * Obtener pagos del estudiante
   */
  static async getStudentPayments(studentEmail, request) {
    try {
      if (!studentEmail) throw new Error('studentEmail requerido');

      const { searchParams } = new URL(request.url);
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      const payments = await PaymentService.getStudentPayments(
        studentEmail,
        startDate ? new Date(startDate) : null,
        endDate ? new Date(endDate) : null
      );

      return NextResponse.json({
        success: true,
        payments: PaymentDTO.fromEntities(payments),
        totalCount: payments.length
      });

    } catch (error) {
      console.error('[PaymentController] Error:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }
  }

  /**
   * GET /api/payments/tutor/[email]
   * Obtener pagos del tutor
   */
  static async getTutorPayments(tutorEmail, request) {
    try {
      if (!tutorEmail) throw new Error('tutorEmail requerido');

      const { searchParams } = new URL(request.url);
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      const payments = await PaymentService.getTutorPayments(
        tutorEmail,
        startDate ? new Date(startDate) : null,
        endDate ? new Date(endDate) : null
      );

      return NextResponse.json({
        success: true,
        payments: PaymentDTO.fromEntities(payments),
        totalCount: payments.length
      });

    } catch (error) {
      console.error('[PaymentController] Error:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }
  }

  /**
   * POST /api/payments/upload-proof
   * Subir comprobante de pago
   */
  static async uploadPaymentProof(request) {
    try {
      const formData = await request.formData();
      const file = formData.get('file');
      const sessionId = formData.get('sessionId');
      const studentEmail = formData.get('studentEmail');

      if (!file || !sessionId || !studentEmail) {
        throw new Error('file, sessionId y studentEmail son requeridos');
      }

      const result = await PaymentService.uploadPaymentProof(
        file,
        sessionId,
        studentEmail
      );

      return NextResponse.json({
        success: true,
        url: result.url,
        message: 'Comprobante subido exitosamente'
      }, { status: 201 });

    } catch (error) {
      console.error('[PaymentController] Error:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 400 });
    }
  }
}

