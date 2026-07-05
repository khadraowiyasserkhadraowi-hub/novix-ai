import React, { useState, useEffect } from 'react';
import { 
  User, Globe, Moon, Sun, Cpu, ShieldAlert, LogOut, Trash2, 
  ChevronRight, Sparkles, Database, Code, HelpCircle, HardDrive, AlertTriangle
} from 'lucide-react';
import { Language, Theme, ChatSession } from '../types';
import { translations } from '../translations';
import { auth } from '../firebase';

interface SettingsTabProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isGuest: boolean;
  sessions: ChatSession[];
  onLogout: () => void;
  onClearAllSessions: () => void;
}

export default function SettingsTab({
  language,
  setLanguage,
  theme,
  setTheme,
  isGuest,
  sessions,
  onLogout,
  onClearAllSessions
}: SettingsTabProps) {
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const t = translations[language];
  const isRtl = language === 'ar';
  
  const currentUser = auth.currentUser;
  const totalMessages = sessions.reduce((acc, curr) => acc + (curr.messages ? curr.messages.length : 0), 0);

  // Clear confirmation auto-reset timer
  useEffect(() => {
    if (isConfirmingClear) {
      const timer = setTimeout(() => {
        setIsConfirmingClear(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isConfirmingClear]);

  const handleClearClick = () => {
    if (isConfirmingClear) {
      onClearAllSessions();
      setIsConfirmingClear(false);
    } else {
      setIsConfirmingClear(true);
    }
  };

  return (
    <div className={`flex-1 flex flex-col justify-between overflow-y-auto px-4 py-5 scrollbar-thin transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#050505]' : 'bg-zinc-50'
    }`} dir={isRtl ? 'rtl' : 'ltr'}>
      
      <div className="space-y-5">
        {/* Title */}
        <div>
          <h1 className={`text-xl font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
            {t.settings}
          </h1>
          <p className={`text-[10px] font-semibold mt-0.5 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
            {language === 'en' ? 'Manage your credentials, layout styles & memory storage' : 'إدارة الحساب والمظهر ومستوى الذاكرة الذكية'}
          </p>
        </div>

        {/* Profile Card Info Box */}
        <div className={`p-4 rounded-2xl border transition-all ${
          theme === 'dark' ? 'bg-[#0A0A0A] border-[#1A1A1A]' : 'bg-white border-zinc-200'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-lg shadow-md shadow-indigo-500/10 shrink-0">
              {isGuest ? 'G' : (currentUser?.email?.[0].toUpperCase() || 'U')}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-xs font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                  {isGuest ? (language === 'en' ? 'Anonymous Guest' : 'مستخدم ضيف') : (currentUser?.email || 'User Account')}
                </span>
                <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${
                  isGuest 
                    ? (theme === 'dark' ? 'bg-amber-500/5 text-amber-500 border border-amber-500/10' : 'bg-amber-50 text-amber-600')
                    : (theme === 'dark' ? 'bg-emerald-500/5 text-emerald-400 border border-emerald-500/10' : 'bg-emerald-50 text-emerald-600')
                }`}>
                  {isGuest ? (language === 'en' ? 'Local' : 'محلي') : (language === 'en' ? 'Cloud synced' : 'مزامنة سحابية')}
                </span>
              </div>
              <p className={`text-[9px] font-mono mt-0.5 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                UUID: {isGuest ? 'guest-offline-mode' : (currentUser?.uid?.slice(0, 16) + '...')}
              </p>
            </div>
          </div>
        </div>

        {/* Settings categories sections */}
        <div className="space-y-4">
          
          {/* Section 1: UI Styles */}
          <div className="space-y-2">
            <h3 className={`text-[10px] font-bold uppercase tracking-wider font-mono px-1 opacity-50`}>
              {language === 'en' ? 'Interface Preferences' : 'تفضيلات الواجهة'}
            </h3>

            <div className={`rounded-2xl border overflow-hidden ${
              theme === 'dark' ? 'bg-[#0A0A0A] border-[#1A1A1A]' : 'bg-white border-zinc-200'
            }`}>
              {/* Language Selector row */}
              <div 
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors border-b ${
                  theme === 'dark' ? 'border-[#151515] hover:bg-[#121212]' : 'border-zinc-100 hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-[#151515] text-indigo-400' : 'bg-zinc-50 text-indigo-600'}`}>
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">{t.language}</span>
                    <span className={`text-[9px] block ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      {language === 'en' ? 'Switch to Arabic language' : 'التحويل للغة الإنجليزية'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-80">
                  <span className="text-[10px] font-black uppercase tracking-wider font-mono">
                    {language === 'en' ? 'Arabic (AR)' : 'English (EN)'}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 transform ${isRtl ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* Theme Selector row */}
              <div 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                  theme === 'dark' ? 'hover:bg-[#121212]' : 'hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-[#151515] text-indigo-400' : 'bg-zinc-50 text-indigo-600'}`}>
                    {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold block">{t.theme}</span>
                    <span className={`text-[9px] block ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      {theme === 'dark' ? 'Currently using Dark colors' : 'Currently using Light colors'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-80">
                  <span className="text-[10px] font-black uppercase tracking-wider font-mono">
                    {theme === 'dark' ? t.dark : t.light}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 transform ${isRtl ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Engine Statistics */}
          <div className="space-y-2">
            <h3 className={`text-[10px] font-bold uppercase tracking-wider font-mono px-1 opacity-50`}>
              {language === 'en' ? 'System Telemetry' : 'إحصائيات النظام'}
            </h3>

            <div className={`p-3.5 rounded-2xl border space-y-3 ${
              theme === 'dark' ? 'bg-[#0A0A0A] border-[#1A1A1A]' : 'bg-white border-zinc-200'
            }`}>
              {/* Stat 1 */}
              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 opacity-50 text-indigo-400" />
                  <span className="opacity-80">{language === 'en' ? 'Intelligence Engine' : 'محرك الذكاء الاصطناعي'}</span>
                </div>
                <span className="font-bold font-mono">Gemini 2.5 Flash</span>
              </div>

              {/* Stat 2 */}
              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 opacity-50 text-pink-400" />
                  <span className="opacity-80">{language === 'en' ? 'Image Renderer' : 'مولد الرسوم البيانية'}</span>
                </div>
                <span className="font-bold font-mono">Imagen 3 Studio</span>
              </div>

              {/* Stat 3 */}
              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 opacity-50 text-indigo-400" />
                  <span className="opacity-80">{language === 'en' ? 'Local Memory Pools' : 'مجموعات الذاكرة المحلية'}</span>
                </div>
                <span className="font-bold font-mono">{sessions.length} {language === 'en' ? 'Sessions' : 'جلسات'}</span>
              </div>

              {/* Stat 4 */}
              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 opacity-50 text-purple-400" />
                  <span className="opacity-80">{language === 'en' ? 'Conversations Size' : 'إجمالي الرسائل المحفوظة'}</span>
                </div>
                <span className="font-bold font-mono">{totalMessages} {language === 'en' ? 'Messages' : 'رسائل'}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Dangerous Zone / Actions */}
          <div className="space-y-2">
            <h3 className={`text-[10px] font-bold uppercase tracking-wider font-mono px-1 opacity-50`}>
              {language === 'en' ? 'System Controls' : 'إجراءات الأمان والذاكرة'}
            </h3>

            <div className={`rounded-2xl border overflow-hidden ${
              theme === 'dark' ? 'bg-[#0A0A0A] border-[#1A1A1A]' : 'bg-white border-zinc-200'
            }`}>
              {/* Clear memory option */}
              <div 
                onClick={handleClearClick}
                className={`p-3.5 flex items-center justify-between cursor-pointer transition-all border-b ${
                  isConfirmingClear
                    ? 'bg-red-500/10 hover:bg-red-500/15'
                    : (theme === 'dark' ? 'border-[#151515] hover:bg-red-950/10' : 'border-zinc-100 hover:bg-red-50')
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg ${isConfirmingClear ? 'bg-red-500 text-white animate-bounce' : 'bg-red-500/10 text-red-400'}`}>
                    {isConfirmingClear ? <AlertTriangle className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-red-400">
                      {isConfirmingClear 
                        ? (language === 'en' ? 'Are you sure? Tap again to purge!' : 'هل أنت متأكد؟ اضغط ثانية للمسح!')
                        : (language === 'en' ? 'Purge Memory Space' : 'مسح الذاكرة بالكامل')}
                    </span>
                    <span className={`text-[9px] block text-zinc-500`}>
                      {isConfirmingClear
                        ? (language === 'en' ? 'All chat histories will be lost forever' : 'سيتم فقدان جميع سجلات المحادثات نهائياً')
                        : (language === 'en' ? 'Delete all sessions irreversibly' : 'حذف جميع الجلسات بشكل نهائي')}
                    </span>
                  </div>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 opacity-40 text-red-400 ${isConfirmingClear ? 'animate-ping' : ''}`} />
              </div>

              {/* Log out option */}
              <div 
                onClick={onLogout}
                className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                  theme === 'dark' ? 'hover:bg-red-950/10' : 'hover:bg-red-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-zinc-500/10 text-zinc-400">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">{t.logout}</span>
                    <span className={`text-[9px] block ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      {language === 'en' ? 'Terminate your active cloud session' : 'إنهاء جلستك السحابية الحالية'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Version Tag footer */}
      <div className="text-center pt-8 opacity-40">
        <p className="text-[9px] font-mono tracking-widest font-bold">
          NOVIX CORE ENGINE V1.2.8
        </p>
        <p className="text-[8px] font-semibold mt-0.5">
          {language === 'en' ? 'Made with dedication for Android & Web clients' : 'صُنع بدقة لمنصات الهاتف والويب'}
        </p>
      </div>
    </div>
  );
}
