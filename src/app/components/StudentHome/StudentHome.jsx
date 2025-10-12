"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import WelcomeBanner from "../Welcome/Welcome";
import BoxSubject from "../BoxSubject/BoxSubject";
import TutoringSummary from "../TutoringSummary/TutoringSummary";
import { getMaterias } from "../../services/HomeService.service";
import { useI18n } from "../../../lib/i18n";
import routes from "../../../routes";

export default function StudentHome({ userName }) {
  const { t } = useI18n();
  const [materias, setMaterias] = useState([]);

  useEffect(() => {
    getMaterias().then(setMaterias);
  }, []);

  return (
    <main className="min-h-screen">
      <WelcomeBanner usuario={userName} />
      
      <div className="container mx-auto pt-4 px-6">
        {/* Sección de tutorías programadas */}
        <TutoringSummary 
          userType="student"
          title={t('studentHome.scheduledSessions')}
          linkText={t('studentHome.viewHistory')}
          linkHref={routes.SEARCH_TUTORS}
        />

        {/* Banner de explorar nuevas tutorías */}
        <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                {t('studentHome.needHelpTitle')}
              </h2>
              <p className="text-gray-600 mb-4">
                {t('studentHome.needHelpText')}
              </p>
            </div>
            
                         <div className="flex flex-col md:flex-row gap-3">
               <Link 
                 href={routes.SEARCH_TUTORS}
                 className="bg-[#FF7A7A] hover:bg-[#FF6B6B] text-white px-6 py-2 rounded-lg font-medium transition-colors text-center"
               >
                 {t('studentHome.searchTutors')}
               </Link>
               <Link 
                 href={routes.EXPLORE}
                 className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors text-center"
               >
                 {t('studentHome.exploreSubjects')}
               </Link>
             </div>
          </div>
        </div>

        {/* Materias del semestre */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-4xl font-bold mb-2 text-[#FF7A7A] pb-4">
            {t('studentHome.yourSubjects')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
            {materias.map(({ codigo, nombre }) => (
              <BoxSubject key={codigo} codigo={codigo} nombre={nombre} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
} 