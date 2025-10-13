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
import { TutoringSessionService } from "../../services/TutoringSessionService";
import { useAuth } from "../../context/SecureAuthContext";
import { useI18n } from "../../../lib/i18n";
import routes from "../../../routes";

export default function TutorHome({ userName }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [materias, setMaterias] = useState([]);
  const [weeklyPerformance, setWeeklyPerformance] = useState({
    weeklySessions: 0,
    weeklyEarnings: 0,
    studentRetention: 0
  });
  const [tutorStats, setTutorStats] = useState({
    total: 0,
    completed: 0,
    scheduled: 0,
    totalEarnings: 0,
    averageRating: 0
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load subjects
        const subjectsData = await getMaterias();
        setMaterias(subjectsData);
        
        // Load weekly performance data and general stats if user is logged in
        if (user?.email) {
          const [performanceData, statsData] = await Promise.all([
            TutoringSessionService.getTutorWeeklyPerformance(user.email),
            TutoringSessionService.getTutorSessionStats(user.email)
          ]);
          setWeeklyPerformance(performanceData);
          setTutorStats(statsData);
        }
      } catch (error) {
        console.error('Error loading tutor home data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.email]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <WelcomeBanner usuario={userName} />
      
      <div className="container mx-auto pt-8 px-6 pb-12">
        {/* Performance Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-orange-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('tutorHome.stats.sessions')}</p>
                {loading ? (
                  <div className="w-12 h-8 bg-gray-200 rounded animate-pulse mb-1"></div>
                ) : (
                  <p className="text-2xl font-bold text-orange-600">{tutorStats.scheduled}</p>
                )}
                <p className="text-xs text-gray-500">{t('tutorHome.stats.scheduled')}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-orange-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('tutorHome.stats.sessions')}</p>
                {loading ? (
                  <div className="w-12 h-8 bg-gray-200 rounded animate-pulse mb-1"></div>
                ) : (
                  <p className="text-2xl font-bold text-orange-600">{tutorStats.completed}</p>
                )}
                <p className="text-xs text-gray-500">Completadas</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-yellow-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('tutorHome.stats.earnings')}</p>
                {loading ? (
                  <div className="w-16 h-8 bg-gray-200 rounded animate-pulse mb-1"></div>
                ) : (
                  <p className="text-2xl font-bold text-orange-600">
                    ${tutorStats.totalEarnings.toLocaleString('es-CO')}
                  </p>
                )}
                <p className="text-xs text-gray-500">Total</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-orange-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('tutorHome.stats.rating')}</p>
                {loading ? (
                  <div className="w-12 h-8 bg-gray-200 rounded animate-pulse mb-1"></div>
                ) : (
                  <p className="text-2xl font-bold text-orange-600">
                    {tutorStats.averageRating > 0 ? tutorStats.averageRating.toFixed(1) : 'N/A'}
                  </p>
                )}
                <p className="text-xs text-gray-500">Promedio</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <Star className="w-6 h-6 text-orange-600" />
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

        {/* Main Dashboard Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        </div>

        {/* Subjects Management */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-xl">
                <BookOpen className="w-6 h-6 text-orange-600" />
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
            
            {loading ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                  <span className="font-medium text-gray-700">{t('tutorHome.performance.weeklySessions')}</span>
                  <div className="w-12 h-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                  <span className="font-medium text-gray-700">{t('tutorHome.performance.weeklyEarnings')}</span>
                  <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                  <span className="font-medium text-gray-700">{t('tutorHome.performance.studentRetention')}</span>
                  <div className="w-12 h-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl">
                  <span className="font-medium text-gray-700">{t('tutorHome.performance.weeklySessions')}</span>
                  <span className="text-2xl font-bold text-blue-600">{weeklyPerformance.weeklySessions}</span>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl">
                  <span className="font-medium text-gray-700">{t('tutorHome.performance.weeklyEarnings')}</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${weeklyPerformance.weeklyEarnings.toLocaleString('es-CO')}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-purple-50 rounded-xl">
                  <span className="font-medium text-gray-700">{t('tutorHome.performance.studentRetention')}</span>
                  <span className="text-2xl font-bold text-purple-600">{weeklyPerformance.studentRetention}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Achievement Badge */}
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl p-8 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">{t('tutorHome.achievement.title')}</h3>
            </div>
            {loading ? (
              <div className="space-y-2">
                <div className="w-full h-4 bg-white/20 rounded animate-pulse"></div>
                <div className="w-3/4 h-4 bg-white/20 rounded animate-pulse"></div>
                <div className="w-1/2 h-4 bg-white/20 rounded animate-pulse mt-4"></div>
              </div>
            ) : (
              <>
                <p className="text-white/90 mb-4">
                  {tutorStats.completed > 0 
                    ? `Has completado ${tutorStats.completed} sesiones y mantienes una calificación de ${tutorStats.averageRating > 0 ? tutorStats.averageRating.toFixed(1) : 'N/A'} estrellas.`
                    : 'Comienza a dar tutorías para ver tus logros aquí.'
                  }
                </p>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-semibold">
                    {tutorStats.completed > 0 ? `${tutorStats.completed} sesiones completadas` : '¡Comienza tu primera sesión!'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 