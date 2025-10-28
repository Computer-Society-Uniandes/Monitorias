/**
 * DTO único para Tutoring Session - SIMPLE Y DIRECTO
 */

/**
 * Para crear una sesión nueva
 */
export class CreateSessionDTO {
  constructor(data) {
    this.tutorEmail = data.tutorEmail;
    this.studentEmail = data.studentEmail;
    this.studentName = data.studentName;
    this.subject = data.subject;
    this.scheduledDateTime = data.scheduledDateTime;
    this.endDateTime = data.endDateTime;
    this.location = data.location || 'Por definir';
    this.price = data.price || 50000;
    this.notes = data.notes || '';
    this.slotId = data.slotId;
    this.slotIndex = data.slotIndex;
    this.parentAvailabilityId = data.parentAvailabilityId;
  }

  /**
   * Validación básica
   */
  static validate(data) {
    if (!data.tutorEmail) throw new Error('tutorEmail es requerido');
    if (!data.studentEmail) throw new Error('studentEmail es requerido');
    if (!data.subject) throw new Error('subject es requerido');
    if (!data.scheduledDateTime) throw new Error('scheduledDateTime es requerido');
    if (!data.endDateTime) throw new Error('endDateTime es requerido');
    
    return new CreateSessionDTO(data);
  }
}

/**
 * Para respuestas de sesiones
 */
export class SessionDTO {
  constructor(data) {
    this.id = data.id;
    this.tutorEmail = data.tutorEmail;
    this.studentEmail = data.studentEmail;
    this.studentName = data.studentName;
    this.subject = data.subject;
    this.scheduledDateTime = data.scheduledDateTime;
    this.endDateTime = data.endDateTime;
    this.location = data.location;
    this.price = data.price;
    this.status = data.status;
    this.paymentStatus = data.paymentStatus;
    this.notes = data.notes;
    this.meetLink = data.meetLink;
    this.createdAt = data.createdAt;
  }

  static fromEntity(entity) {
    return new SessionDTO({
      id: entity.id,
      tutorEmail: entity.tutorEmail,
      studentEmail: entity.studentEmail,
      studentName: entity.studentName,
      subject: entity.subject,
      scheduledDateTime: entity.scheduledDateTime?.toISOString?.() || entity.scheduledDateTime,
      endDateTime: entity.endDateTime?.toISOString?.() || entity.endDateTime,
      location: entity.location,
      price: entity.price,
      status: entity.status,
      paymentStatus: entity.paymentStatus,
      notes: entity.notes,
      meetLink: entity.meetLink,
      createdAt: entity.createdAt?.toISOString?.() || entity.createdAt
    });
  }

  static fromEntities(entities) {
    return entities.map(e => this.fromEntity(e));
  }
}

