/**
 * NotificationController - SIMPLE
 * Maneja requests de notificaciones
 */

import { NextResponse } from 'next/server';
import { NotificationDTO } from '../dto/notification.dto';
import { NotificationService } from '../services/core/NotificationService';

export class NotificationController {
  /**
   * GET /api/notifications/[userId]
   * Obtener notificaciones del usuario
   */
  static async getUserNotifications(userId, request) {
    try {
      if (!userId) throw new Error('userId requerido');

      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit')) || 50;
      const onlyUnread = searchParams.get('onlyUnread') === 'true';

      let notifications;
      
      if (onlyUnread) {
        notifications = await NotificationService.getUnreadNotifications(userId, limit);
      } else {
        notifications = await NotificationService.getUserNotifications(userId, limit);
      }

      return NextResponse.json({
        success: true,
        notifications: NotificationDTO.fromEntities(notifications),
        totalCount: notifications.length
      });

    } catch (error) {
      console.error('[NotificationController] Error:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }
  }

  /**
   * PATCH /api/notifications/[notificationId]/read
   * Marcar notificación como leída
   */
  static async markAsRead(notificationId) {
    try {
      if (!notificationId) throw new Error('notificationId requerido');

      await NotificationService.markAsRead(notificationId);

      return NextResponse.json({
        success: true,
        message: 'Notificación marcada como leída'
      });

    } catch (error) {
      console.error('[NotificationController] Error:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 400 });
    }
  }

  /**
   * PATCH /api/notifications/[userId]/read-all
   * Marcar todas las notificaciones como leídas
   */
  static async markAllAsRead(userId) {
    try {
      if (!userId) throw new Error('userId requerido');

      await NotificationService.markAllAsRead(userId);

      return NextResponse.json({
        success: true,
        message: 'Todas las notificaciones marcadas como leídas'
      });

    } catch (error) {
      console.error('[NotificationController] Error:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 400 });
    }
  }

  /**
   * POST /api/notifications
   * Crear nueva notificación (uso interno)
   */
  static async createNotification(request) {
    try {
      const body = await request.json();
      const { userId, type, title, message, metadata } = body;

      if (!userId || !type || !title || !message) {
        throw new Error('userId, type, title y message son requeridos');
      }

      await NotificationService.createNotification(
        userId,
        type,
        title,
        message,
        metadata
      );

      return NextResponse.json({
        success: true,
        message: 'Notificación creada'
      }, { status: 201 });

    } catch (error) {
      console.error('[NotificationController] Error:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 400 });
    }
  }
}

