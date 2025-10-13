'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Edit3, 
  Star, 
  Calendar, 
  Users, 
  Settings, 
  ArrowRight,
  Plus,
  Trash2
} from 'lucide-react';
import routes from '../../../routes';
import { useAuth } from '../../context/SecureAuthContext';
import { useI18n } from '../../../lib/i18n';
import { UserProfileService } from '../../services/UserProfileService';
import './Profile.css';

const TUTOR_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdxeOSt5jjjSVtXY9amQRiXeufm65-11N4FMvJ96fcxyiN58A/viewform?usp=sharing&ouid=102056237631790140503'; 

// Edit Profile Modal
function EditProfileModal({ open, onClose, userData, onSave, t }) {
  const [formData, setFormData] = useState({
    name: userData?.name || '',
    phone_number: userData?.phone_number || '',
    description: userData?.description || '',
    specialization: userData?.specialization || ''
  });

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        phone_number: userData.phone_number || '',
        description: userData.description || '',
        specialization: userData.specialization || ''
      });
    }
  }, [userData]);

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('profile.editModal.title')}</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('profile.editModal.name')}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('profile.editModal.phone')}
            </label>
            <input
              type="tel"
              value={formData.phone_number}
              onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter your phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('profile.editModal.specialization')}
            </label>
            <input
              type="text"
              value={formData.specialization}
              onChange={(e) => setFormData({...formData, specialization: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="e.g., Math, Physics, Chemistry"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('profile.editModal.description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              placeholder={t('profile.descriptionPlaceholder')}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={handleSave}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 rounded-xl font-semibold transition-colors duration-300"
          >
            {t('profile.editModal.save')}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-6 rounded-xl font-semibold transition-colors duration-300"
          >
            {t('profile.editModal.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

// Tutor Invite Modal
function TutorInviteModal({ open, onClose, t }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">{t('profile.becomeTutorTitle')}</h3>
        <p className="text-gray-600 mb-6">
          {t('profile.becomeTutorText')}
        </p>
        <div className="flex gap-3">
          <a
            href={TUTOR_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 rounded-xl font-semibold text-center transition-colors duration-300"
          >
            {t('profile.goToForm')}
          </a>
          <button 
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-6 rounded-xl font-semibold transition-colors duration-300"
          >
            {t('profile.close')}
          </button>
        </div>
      </div>
    </div>
  );
}

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [tutorSubjects, setTutorSubjects] = useState([]);
  const [activeRole, setActiveRole] = useState('student');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const { user, authLoading, logout } = useAuth();
  const { t } = useI18n();

  // Load profile data
  useEffect(() => {
    if (authLoading) return;

    if (!user || !user.isLoggedIn) {
      if (typeof window !== 'undefined') {
        router.push(routes.LANDING);
      }
      return;
    }

    if (!user.email) return;

    const loadProfileData = async () => {
      try {
        setLoading(true);
        
        // Load user profile data
        const profileResult = await UserProfileService.getUserProfile(user.email);
        if (profileResult.success) {
          setUserData(profileResult.data);
        }

        // Load tutor subjects if user is a tutor
        if (user.isTutor) {
          const subjectsResult = await UserProfileService.getTutorSubjects(user.email);
          if (subjectsResult.success) {
            setTutorSubjects(subjectsResult.data);
          }
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();

    // Set active role
    const saved = typeof window !== 'undefined' ? localStorage.getItem('rol') : null;
    if (user.isTutor && saved === 'tutor') {
      setActiveRole('tutor');
    } else if (saved === 'student') {
      setActiveRole('student');
    } else {
      if (typeof window !== 'undefined') {
        localStorage.setItem('rol', 'student');
      }
      setActiveRole('student');
    }
  }, [authLoading, user, router]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      localStorage.setItem('rol', 'student');
      setActiveRole('student');
      notifyRoleChange('student');
      router.push(routes.LANDING);
    }
  };

  const handleRoleChangeWithRefresh = (newRole) => {
    localStorage.setItem('rol', newRole);
    setActiveRole(newRole);
    notifyRoleChange(newRole);
    
    const homeRoute = newRole === 'tutor' ? routes.TUTOR_INICIO : routes.HOME;
    window.location.href = homeRoute;
  };

  const handleChangeRole = () => {
    if (!user.isTutor) {
      setInviteOpen(true);
      return;
    }
    handleRoleChangeWithRefresh('tutor');
  };

  const handleBackToStudent = () => {
    handleRoleChangeWithRefresh('student');
  };

  const handleSaveProfile = async (formData) => {
    try {
      const result = await UserProfileService.updateUserProfile(user.email, formData);
      if (result.success) {
        setUserData({...userData, ...formData});
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const handleManageAvailability = () => {
    router.push(routes.TUTOR_DISPONIBILIDAD);
  };

  const notifyRoleChange = (next) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('role-change', { detail: next }));
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('profile.loadingProfile')}</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">

          {/* Profile Card */}
          <div className="profile-card bg-white rounded-3xl shadow-xl p-8 mb-8">
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
              <div className="profile-avatar relative">
                <img
                  src='https://avatar.iran.liara.run/public/40'
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-orange-100"
                />
                <div className="absolute -bottom-2 -right-2 p-2 bg-orange-500 rounded-full">
                  <Edit3 className="w-4 h-4 text-white" />
                </div>
              </div>
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 mb-1">
                  {userData?.name || t('profile.notDefined')}
                </h2>
                <p className="text-orange-600 font-medium mb-2">
                  {userData?.specialization || t('profile.notDefined')}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>📧 {user?.email}</span>
                  <span>📱 {userData?.phone_number || t('profile.notDefined')}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setEditModalOpen(true)}
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors duration-300"
                >
                  <Edit3 className="w-5 h-5" />
                  {t('profile.editProfile')}
                </button>
                
                {user.isTutor && activeRole === 'student' && (
                  <button
                    onClick={handleChangeRole}
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors duration-300"
                  >
                    <Settings className="w-5 h-5" />
                    {t('profile.changeToTutorMode')}
                  </button>
                )}
                
                {activeRole === 'tutor' && (
                  <button
                    onClick={handleBackToStudent}
                    className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors duration-300"
                  >
                    {t('profile.changeToStudentMode')}
                  </button>
                )}
              </div>
            </div>

            {/* Rating Section (for tutors) */}
            {user.isTutor && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="rating-card bg-gray-50 rounded-2xl p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Star className="w-6 h-6 text-orange-500" />
                    <span className="text-3xl font-bold text-gray-800">4.9</span>
                  </div>
                  <p className="text-gray-600 font-medium">{t('profile.rating')}</p>
                </div>
                
                <div className="rating-card bg-gray-50 rounded-2xl p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Calendar className="w-6 h-6 text-orange-500" />
                    <span className="text-3xl font-bold text-gray-800">24</span>
                  </div>
                  <p className="text-gray-600 font-medium">{t('profile.sessionsCompleted')}</p>
                </div>
                
                <div className="rating-card bg-gray-50 rounded-2xl p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Users className="w-6 h-6 text-orange-500" />
                    <span className="text-3xl font-bold text-gray-800">12</span>
                  </div>
                  <p className="text-gray-600 font-medium">{t('profile.studentsHelped')}</p>
                </div>
              </div>
            )}

            {/* About Section */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">{t('profile.about')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {userData?.description || t('profile.descriptionPlaceholder')}
              </p>
            </div>

            {/* Subjects Section (for tutors) */}
            {user.isTutor && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">{t('profile.subjects')}</h3>
                  <button className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium">
                    <Plus className="w-4 h-4" />
                    {t('profile.addSubject')}
                  </button>
                </div>
                
                {tutorSubjects.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {tutorSubjects.map((subject, index) => (
                      <div key={index} className="subject-tag bg-orange-100 text-orange-800 px-4 py-2 rounded-xl flex items-center gap-2">
                        <span className="font-medium">{subject.name || subject.subject}</span>
                        <button className="text-orange-600 hover:text-orange-800">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>{t('profile.noSubjects')}</p>
                  </div>
                )}
              </div>
            )}

            {/* Availability Management (for tutors) */}
            {user.isTutor && (
              <div className="availability-card bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{t('profile.availability.title')}</h3>
                    <p className="text-gray-600">{t('profile.availability.description')}</p>
                  </div>
                  <button
                    onClick={handleManageAvailability}
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors duration-300"
                  >
                    <Calendar className="w-5 h-5" />
                    {t('profile.availability.goToAvailability')}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-xl font-semibold transition-colors duration-300"
              >
                {t('profile.logout')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditProfileModal 
        open={editModalOpen} 
        onClose={() => setEditModalOpen(false)} 
        userData={userData}
        onSave={handleSaveProfile}
        t={t}
      />
      <TutorInviteModal 
        open={inviteOpen} 
        onClose={() => setInviteOpen(false)} 
        t={t} 
      />
    </div>
  );
};

export default Profile;
