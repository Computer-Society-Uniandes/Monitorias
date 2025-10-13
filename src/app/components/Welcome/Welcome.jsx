"use client";

import { useI18n } from "../../../lib/i18n";
import { Sparkles, BookOpen, Calendar } from "lucide-react";

const WelcomeBanner = ({ usuario }) => {
  const { t } = useI18n();
  const saludo = usuario ? t('welcome.greetingWithName', { name: usuario }) : t('welcome.greeting');

  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 h-[320px]">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24"></div>
      <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-white/5 rounded-full -translate-x-16 -translate-y-16"></div>
      
      {/* Floating icons */}
      <div className="absolute top-8 right-16 text-white/20">
        <BookOpen className="w-8 h-8 animate-pulse" />
      </div>
      <div className="absolute bottom-8 right-24 text-white/20">
        <Calendar className="w-6 h-6 animate-bounce" />
      </div>
      <div className="absolute top-16 left-16 text-white/20">
        <Sparkles className="w-6 h-6 animate-pulse" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between px-8 md:px-16 text-white py-12 h-full">
        <div className="flex flex-col justify-center w-full md:w-2/3">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
              {t('welcome.badge')}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            {saludo}
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-6 max-w-2xl">
            {t('welcome.subtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2 text-white/80">
              <div className="w-2 h-2 bg-white/60 rounded-full"></div>
              <span className="text-sm">{t('welcome.features.verifiedTutors')}</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <div className="w-2 h-2 bg-white/60 rounded-full"></div>
              <span className="text-sm">{t('welcome.features.flexibleSchedule')}</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <div className="w-2 h-2 bg-white/60 rounded-full"></div>
              <span className="text-sm">{t('welcome.features.personalizedLearning')}</span>
            </div>
          </div>
        </div>
        
        {/* Right side decorative content */}
        <div className="hidden md:flex items-center justify-center w-1/3">
          <div className="relative">
            <div className="w-32 h-32 bg-white/10 rounded-3xl backdrop-blur-sm flex items-center justify-center">
              <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-white/80" />
              </div>
            </div>
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-orange-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBanner;
