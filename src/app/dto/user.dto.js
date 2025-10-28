/**
 * DTO para User - SIMPLE
 */

export class UserDTO {
  constructor(data) {
    this.email = data.email;
    this.name = data.name;
    this.displayName = data.displayName;
    this.phoneNumber = data.phoneNumber;
    this.bio = data.bio;
    this.profileImage = data.profileImage;
    this.major = data.major;
    this.isTutor = data.isTutor;
    this.role = data.role;
    
    // Solo si es tutor
    if (data.isTutor) {
      this.subjects = data.subjects || [];
      this.hourlyRate = data.hourlyRate;
      this.rating = data.rating;
      this.totalSessions = data.totalSessions;
    }
    
    // Favoritos
    this.favoriteCourses = data.favoriteCourses || [];
    this.favoriteTutors = data.favoriteTutors || [];
  }

  static fromEntity(entity) {
    return new UserDTO({
      email: entity.email,
      name: entity.name,
      displayName: entity.displayName,
      phoneNumber: entity.phoneNumber,
      bio: entity.bio,
      profileImage: entity.profileImage,
      major: entity.major,
      isTutor: entity.isTutor,
      role: entity.role,
      subjects: entity.subjects,
      hourlyRate: entity.hourlyRate,
      rating: entity.rating,
      totalSessions: entity.totalSessions,
      favoriteCourses: entity.favoriteCourses,
      favoriteTutors: entity.favoriteTutors
    });
  }
}

/**
 * DTO para actualizar perfil
 */
export class UpdateUserDTO {
  constructor(data) {
    if (data.name !== undefined) this.name = data.name;
    if (data.phoneNumber !== undefined) this.phoneNumber = data.phoneNumber;
    if (data.bio !== undefined) this.bio = data.bio;
    if (data.profileImage !== undefined) this.profileImage = data.profileImage;
    if (data.major !== undefined) this.major = data.major;
    if (data.hourlyRate !== undefined) this.hourlyRate = data.hourlyRate;
  }

  static validate(data) {
    return new UpdateUserDTO(data);
  }
}

