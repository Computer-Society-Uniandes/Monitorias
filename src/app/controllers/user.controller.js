/**
 * UserController - SIMPLE
 * Maneja requests de usuarios y perfiles
 */

import { NextResponse } from 'next/server';
import { UserDTO, UpdateUserDTO } from '../dto/user.dto';
import { UserProfileService } from '../services/core/UserProfileService';

export class UserController {
  /**
   * GET /api/user/[email]
   * Obtener perfil de usuario
   */
  static async getProfile(email) {
    try {
      if (!email) throw new Error('Email requerido');

      const user = await UserProfileService.getUserProfile(email);
      
      if (!user) {
        return NextResponse.json({
          success: false,
          error: 'Usuario no encontrado'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        user: UserDTO.fromEntity(user)
      });

    } catch (error) {
      console.error('[UserController] Error:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }
  }

  /**
   * PATCH /api/user/[email]
   * Actualizar perfil de usuario
   */
  static async updateProfile(email, request) {
    try {
      if (!email) throw new Error('Email requerido');

      const body = await request.json();
      const dto = UpdateUserDTO.validate(body);

      await UserProfileService.updateUserProfile(email, dto);

      return NextResponse.json({
        success: true,
        message: 'Perfil actualizado'
      });

    } catch (error) {
      console.error('[UserController] Error:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 400 });
    }
  }

  /**
   * GET /api/user/tutor/[email]/subjects
   * Obtener materias del tutor
   */
  static async getTutorSubjects(email) {
    try {
      if (!email) throw new Error('Email requerido');

      const subjects = await UserProfileService.getTutorSubjects(email);

      return NextResponse.json({
        success: true,
        subjects
      });

    } catch (error) {
      console.error('[UserController] Error:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }
  }

  /**
   * PUT /api/user/tutor/[email]/subjects
   * Actualizar materias del tutor
   */
  static async updateTutorSubjects(email, request) {
    try {
      if (!email) throw new Error('Email requerido');

      const { subjects } = await request.json();
      
      if (!Array.isArray(subjects)) {
        throw new Error('subjects debe ser un array');
      }

      await UserProfileService.updateTutorSubjects(email, subjects);

      return NextResponse.json({
        success: true,
        message: 'Materias actualizadas'
      });

    } catch (error) {
      console.error('[UserController] Error:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 400 });
    }
  }
}

