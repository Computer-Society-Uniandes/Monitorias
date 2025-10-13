"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  BookOpen, 
  Calendar, 
  Users, 
  DollarSign, 
  Star, 
  TrendingUp, 
  Clock, 
  Settings,
  ArrowRight,
  Target,
  Award,
  Zap,
  BarChart3,
  PlusCircle
} from "lucide-react";
import WelcomeBanner from "../Welcome/Welcome";
import BoxNewSubject from "../BoxNewSubject/BoxNewSubject";
import GoogleCalendarButton from "../GoogleCalendarButton/GoogleCalendarButton";
import TutoringSummary from "../TutoringSummary/TutoringSummary";
import { getMaterias } from "../../services/HomeService.service";
import { useI18n } from "../../../lib/i18n";
import routes from "../../../routes";

export default function TutorHome({ userName }) {
  const { t } = useI18n();
  const [materias, setMaterias] = useState([]);
  const router = useRouter();

  useEffect(() => {
    getMaterias().then(setMaterias);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <WelcomeBanner usuario={userName} />
      
      <div className="container mx-auto pt-8 px-6 pb-12">
        {/* Performance Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('tutorHome.stats.tutorialsToday')}</p>
                <p className="text-2xl font-bold text-blue-600">3</p>
                <p className="text-xs text-gray-500">{t('tutorHome.stats.scheduled')}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-green-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('tutorHome.stats.students')}</p>
                <p className="text-2xl font-bold text-green-600">12</p>
                <p className="text-xs text-gray-500">{t('tutorHome.stats.thisMonth')}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-yellow-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('tutorHome.stats.income')}</p>
                <p className="text-2xl font-bold text-yellow-600">$450K</p>
                <p className="text-xs text-gray-500">{t('tutorHome.stats.thisMonth')}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('tutorHome.stats.rating')}</p>
                <p className="text-2xl font-bold text-purple-600">4.9</p>
                <p className="text-xs text-gray-500">⭐⭐⭐⭐⭐</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Quick Actions Card */}
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Target className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold">{t('tutorHome.quickActions.title')}</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Link 
                  href={routes.TUTOR_MIS_TUTORIAS}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-4 rounded-xl transition-all duration-300 flex flex-col items-center gap-2 text-center"
                >
                  <BookOpen className="w-6 h-6" />
                  <span className="font-medium text-sm">{t('tutorHome.myTutorings')}</span>
                </Link>
                
                <Link 
                  href={routes.TUTOR_MATERIAS}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-4 rounded-xl transition-all duration-300 flex flex-col items-center gap-2 text-center"
                >
                  <Settings className="w-6 h-6" />
                  <span className="font-medium text-sm">{t('tutorHome.manageSubjects')}</span>
                </Link>
                
                <Link 
                  href={routes.TUTOR_DISPONIBILIDAD}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-4 rounded-xl transition-all duration-300 flex flex-col items-center gap-2 text-center"
                >
                  <Calendar className="w-6 h-6" />
                  <span className="font-medium text-sm">{t('tutorHome.availability')}</span>
                </Link>
                
                <Link 
                  href={routes.TUTOR_PAGOS}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-4 rounded-xl transition-all duration-300 flex flex-col items-center gap-2 text-center"
                >
                  <DollarSign className="w-6 h-6" />
                  <span className="font-medium text-sm">{t('tutorHome.payments')}</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Calendar Integration Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-green-100 rounded-xl">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">{t('tutorHome.calendar.title')}</h2>
            </div>
            
            <p className="text-gray-600 mb-6">
              {t('tutorHome.calendar.description')}
            </p>
            
            <div className="space-y-4">
              <GoogleCalendarButton />
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Zap className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{t('tutorHome.calendar.autoSync')}</h4>
                    <p className="text-sm text-gray-600">{t('tutorHome.calendar.autoSyncDesc')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="mb-8">
          <TutoringSummary 
            userType="tutor"
            title={t('tutorHome.upcomingTutorials')}
            linkText={t('tutorHome.viewAllTutorials')}
            linkHref={routes.TUTOR_MIS_TUTORIAS}
          />
        </div>

        {/* Subjects Management */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-xl">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-800">
                  {t('tutorHome.subjectsTitle')}
                </h2>
                <p className="text-gray-600 mt-1">{t('tutorHome.subjectsDescription')}</p>
              </div>
            </div>
            <Link 
              href={routes.TUTOR_MATERIAS}
              className="inline-flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors duration-300"
            >
              <PlusCircle className="w-5 h-5" />
              {t('tutorHome.addSubject')}
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {materias.slice(0, 6).map(({ codigo, nombre }) => (
              <BoxNewSubject 
                key={codigo} 
                name={nombre} 
                number={Math.floor(Math.random() * 10) + 1}
              />
            ))}
          </div>

          {materias.length > 6 && (
            <div className="text-center mt-6">
              <Link 
                href={routes.TUTOR_MATERIAS}
                className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold transition-colors duration-300"
              >
                {t('tutorHome.viewAll')}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          )}
        </div>

        {/* Performance Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Weekly Performance */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-100 rounded-xl">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">{t('tutorHome.performance.title')}</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl">
                <span className="font-medium text-gray-700">{t('tutorHome.performance.weeklySessions')}</span>
                <span className="text-2xl font-bold text-blue-600">18</span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl">
                <span className="font-medium text-gray-700">{t('tutorHome.performance.weeklyEarnings')}</span>
                <span className="text-2xl font-bold text-green-600">$125K</span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-purple-50 rounded-xl">
                <span className="font-medium text-gray-700">{t('tutorHome.performance.studentRetention')}</span>
                <span className="text-2xl font-bold text-purple-600">85%</span>
              </div>
            </div>
          </div>

          {/* Achievement Badge */}
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl p-8 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">{t('tutorHome.achievement.title')}</h3>
            </div>
            <p className="text-white/90 mb-4">{t('tutorHome.achievement.description')}</p>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              <span className="font-semibold">{t('tutorHome.achievement.progress')}</span>
            </div>
          </div>
        </div>

        {/* New Features Notice */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-3xl p-8 border border-indigo-100">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <Zap className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {t('tutorHome.newFeatures.title')}
              </h3>
              <p className="text-gray-600">
                {t('tutorHome.newFeatures.description')}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-white/60 rounded-xl">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <span className="font-medium text-gray-700">{t('tutorHome.newFeatures.startPanel')}</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white/60 rounded-xl">
              <div className="p-2 bg-green-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-green-600" />
              </div>
              <span className="font-medium text-gray-700">{t('tutorHome.newFeatures.completeManagement')}</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white/60 rounded-xl">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Settings className="w-5 h-5 text-purple-600" />
              </div>
              <span className="font-medium text-gray-700">{t('tutorHome.newFeatures.subjectsAdmin')}</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white/60 rounded-xl">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <span className="font-medium text-gray-700">{t('tutorHome.newFeatures.availabilityManagement')}</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white/60 rounded-xl">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="font-medium text-gray-700">{t('tutorHome.newFeatures.paymentControl')}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 