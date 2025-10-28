/**
 * DTO para Notification - SIMPLE
 */

export class NotificationDTO {
  constructor(data) {
    this.id = data.id;
    this.userId = data.userId;
    this.type = data.type;
    this.title = data.title;
    this.message = data.message;
    this.isRead = data.isRead || false;
    this.createdAt = data.createdAt;
    this.metadata = data.metadata || {};
  }

  static fromEntity(entity) {
    return new NotificationDTO({
      id: entity.id,
      userId: entity.userId,
      type: entity.type,
      title: entity.title,
      message: entity.message,
      isRead: entity.isRead,
      createdAt: entity.createdAt?.toISOString?.() || entity.createdAt,
      metadata: entity.metadata
    });
  }

  static fromEntities(entities) {
    return entities.map(e => this.fromEntity(e));
  }
}

