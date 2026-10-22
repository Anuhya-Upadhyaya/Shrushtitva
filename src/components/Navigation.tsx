import React, { useState } from 'react';
import { UserProfile } from '../types/plant';
import { SUPPORTED_LANGUAGES, SupportedLanguage, translations } from '../services/translations';
import { Sprout, Globe, User, LogOut, Plus, ShieldCheck, Bell } from 'lucide-react';

interface NavigationProps {
  currentView: 'garden' | 'health' | 'calendar' | 'assistant' | 'weather';
  onSelectView: (view: 'garden' | 'health' | 'calendar' | 'assistant' | 'weather') => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onOpenAddPlant: () => void;
  onLogout: () => void;
  currentLanguage: SupportedLanguage;
  onChangeLanguage: (lang: SupportedLanguage) => void;
  alertCount?: number;
  onToggleNotificationCenter?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onSelectView,
  user,
  onOpenAuth,
  onOpenAddPlant,
  onLogout,
  currentLanguage,
  onChangeLanguage,
  alertCount = 0,
  onToggleNotificationCenter,
}) => {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const t = translations[currentLanguage] || translations.en;

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F5]/95 backdrop-blur-md border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <button
            onClick={() => onSelectView('garden')}
            className="flex items-center gap-2.5 text-left cursor-pointer group shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-[#3B182E] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Sprout className="w-5 h-5 text-[#F7D6C8]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#1F1924] whitespace-nowrap">
              Shrushtitva
            </span>
          </button>

          {/* Zone 2: 4–5 clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-neutral-600">
            <button
              onClick={() => onSelectView('garden')}
              className={`transition-colors whitespace-nowrap py-1 border-b-2 ${
                currentView === 'garden'
                  ? 'border-[#3B182E] text-[#3B182E] font-semibold'
                  : 'border-transparent hover:text-neutral-900'
              }`}
            >
              {t.navGarden}
            </button>
            <button
              onClick={() => onSelectView('health')}
              className={`transition-colors whitespace-nowrap py-1 border-b-2 ${
                currentView === 'health'
                  ? 'border-[#3B182E] text-[#3B182E] font-semibold'
                  : 'border-transparent hover:text-neutral-900'
              }`}
            >
              {t.navHealth}
            </button>
            <button
              onClick={() => onSelectView('calendar')}
              className={`transition-colors whitespace-nowrap py-1 border-b-2 ${
                currentView === 'calendar'
                  ? 'border-[#3B182E] text-[#3B182E] font-semibold'
                  : 'border-transparent hover:text-neutral-900'
              }`}
            >
              {t.navCalendar}
            </button>
            <button
              onClick={() => onSelectView('assistant')}
              className={`transition-colors whitespace-nowrap py-1 border-b-2 ${
                currentView === 'assistant'
                  ? 'border-[#3B182E] text-[#3B182E] font-semibold'
                  : 'border-transparent hover:text-neutral-900'
              }`}
            >
              {t.navAssistant}
            </button>
            <button
              onClick={() => onSelectView('weather')}
              className={`transition-colors whitespace-nowrap py-1 border-b-2 ${
                currentView === 'weather'
                  ? 'border-[#3B182E] text-[#3B182E] font-semibold'
                  : 'border-transparent hover:text-neutral-900'
              }`}
            >
              {t.navWeather}
            </button>
          </nav>

          {/* Zone 3: 1 primary action / controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Plant Care Schedule Notification Bell */}
            <button
              onClick={onToggleNotificationCenter}
              className="relative p-2 rounded-xl bg-white border border-neutral-200 hover:border-neutral-300 text-neutral-700 hover:text-neutral-900 transition-colors cursor-pointer"
              title="Daily watering and feeding alerts"
            >
              <Bell className="w-4 h-4 text-[#3B182E]" />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {alertCount}
                </span>
              )}
            </button>

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setLangMenuOpen(!langMenuOpen);
                  setProfileMenuOpen(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors cursor-pointer"
                title="Select language"
              >
                <Globe className="w-3.5 h-3.5 text-neutral-500" />
                <span className="uppercase">{currentLanguage}</span>
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-neutral-150 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        onChangeLanguage(lang.code);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-neutral-50 transition-colors ${
                        currentLanguage === lang.code ? 'font-semibold text-[#3B182E] bg-neutral-50' : 'text-neutral-700'
                      }`}
                    >
                      <span>{lang.nativeName}</span>
                      <span className="text-[11px] text-neutral-400 uppercase">{lang.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Add Plant Primary Button */}
            <button
              onClick={onOpenAddPlant}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#3B182E] hover:bg-[#2B1020] rounded-lg transition-colors shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.addPlant}</span>
            </button>

            {/* Account / User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => {
                    setProfileMenuOpen(!profileMenuOpen);
                    setLangMenuOpen(false);
                  }}
                  className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-[#3B182E]/20 transition-all cursor-pointer"
                  title={user.name}
                >
                  <img
                    src={user.avatarUrl || '/src/assets/images/gardener_avatar_user_1792637749931.jpg'}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border border-neutral-200"
                    referrerPolicy="no-referrer"
                  />
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-neutral-150 py-2 z-50 text-xs">
                    <div className="px-3.5 py-2 border-b border-neutral-100">
                      <p className="font-semibold text-neutral-900 truncate">{user.name}</p>
                      <p className="text-neutral-500 truncate text-[11px]">{user.email}</p>
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded w-fit">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Private Garden Sync</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onLogout();
                        setProfileMenuOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t.signOut}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#3B182E] bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>{t.signIn}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-neutral-200 bg-white px-2 py-2 text-xs font-medium text-neutral-600">
        <button
          onClick={() => onSelectView('garden')}
          className={`py-1 px-2 rounded-md ${currentView === 'garden' ? 'text-[#3B182E] font-semibold bg-[#FAF7F5]' : ''}`}
        >
          {t.navGarden}
        </button>
        <button
          onClick={() => onSelectView('health')}
          className={`py-1 px-2 rounded-md ${currentView === 'health' ? 'text-[#3B182E] font-semibold bg-[#FAF7F5]' : ''}`}
        >
          {t.navHealth}
        </button>
        <button
          onClick={() => onSelectView('calendar')}
          className={`py-1 px-2 rounded-md ${currentView === 'calendar' ? 'text-[#3B182E] font-semibold bg-[#FAF7F5]' : ''}`}
        >
          {t.navCalendar}
        </button>
        <button
          onClick={() => onSelectView('assistant')}
          className={`py-1 px-2 rounded-md ${currentView === 'assistant' ? 'text-[#3B182E] font-semibold bg-[#FAF7F5]' : ''}`}
        >
          {t.navAssistant}
        </button>
        <button
          onClick={() => onSelectView('weather')}
          className={`py-1 px-2 rounded-md ${currentView === 'weather' ? 'text-[#3B182E] font-semibold bg-[#FAF7F5]' : ''}`}
        >
          {t.navWeather}
        </button>
      </div>
    </header>
  );
};
