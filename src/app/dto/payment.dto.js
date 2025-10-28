/**
 * DTO para Payment - SIMPLE
 */

export class PaymentDTO {
  constructor(data) {
    this.id = data.id;
    this.studentEmail = data.studentEmail;
    this.tutorEmail = data.tutorEmail;
    this.sessionId = data.sessionId;
    this.amount = data.amount;
    this.status = data.status;
    this.paymentMethod = data.paymentMethod;
    this.proofUrl = data.proofUrl;
    this.createdAt = data.createdAt;
    this.paidAt = data.paidAt;
  }

  static fromEntity(entity) {
    return new PaymentDTO({
      id: entity.id,
      studentEmail: entity.studentEmail,
      tutorEmail: entity.tutorEmail,
      sessionId: entity.sessionId,
      amount: entity.amount,
      status: entity.status,
      paymentMethod: entity.paymentMethod,
      proofUrl: entity.proofUrl,
      createdAt: entity.createdAt?.toISOString?.() || entity.createdAt,
      paidAt: entity.paidAt?.toISOString?.() || entity.paidAt
    });
  }

  static fromEntities(entities) {
    return entities.map(e => this.fromEntity(e));
  }
}

