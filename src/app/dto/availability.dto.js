/**
 * DTO único para Availability - SIMPLE Y DIRECTO
 * Contiene solo lo necesario para request y response
 */

/**
 * Formato de disponibilidad para respuestas
 * Usado en: /api/availability
 */
export class AvailabilityDTO {
  constructor(data) {
    this.id = data.id;
    this.googleEventId = data.googleEventId;
    this.tutorEmail = data.tutorEmail;
    this.title = data.title;
    this.description = data.description;
    this.startDateTime = data.startDateTime;
    this.endDateTime = data.endDateTime;
    this.location = data.location;
    this.subject = data.subject;
    this.color = data.color;
    this.recurring = data.recurring;
    
    // Campos extras para UI
    this.day = data.day;
    this.startTime = data.startTime;
    this.endTime = data.endTime;
    this.date = data.date;
  }

  /**
   * Convierte entity de Firebase a DTO para el frontend
   */
  static fromEntity(entity) {
    const start = entity.startDateTime instanceof Date ? entity.startDateTime : new Date(entity.startDateTime);
    const end = entity.endDateTime instanceof Date ? entity.endDateTime : new Date(entity.endDateTime);
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    return new AvailabilityDTO({
      id: entity.id,
      googleEventId: entity.googleEventId,
      tutorEmail: entity.tutorEmail,
      title: entity.title,
      description: entity.description,
      startDateTime: start.toISOString(),
      endDateTime: end.toISOString(),
      location: entity.location,
      subject: entity.subject,
      color: entity.color,
      recurring: entity.recurring,
      day: days[start.getDay()],
      startTime: start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      endTime: end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      date: start.toISOString().split('T')[0]
    });
  }

  static fromEntities(entities) {
    return entities.map(e => this.fromEntity(e));
  }
}

