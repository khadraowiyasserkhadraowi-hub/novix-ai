import React from 'react';
import { 
  Plus, MessageSquare, Trash2, LogOut, 
  Settings, Globe, Moon, Sun, X, UserCheck, ShieldAlert 
} from 'lucide-react';
import { translations } from '../translations';
import { Language, Theme, ChatSession } from '../types';
import { auth } from '../firebase';
import { motion } from 'motion/react';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  theme: Theme;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
  isGuest: boolean;
}

export default function HistorySidebar({
  isOpen,
  onClose,
  language,
  theme,
  setLanguage,
  setTheme,
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  isGuest
}: HistorySidebarProps) {
  const t = translations[language];
  const isRtl = language === 'ar';

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (err) {
      console.error("Error signing out: ", err);
    }
  };

  if (!isOpen) return null;

  // Slide-in animations depending on RTL
  const slideVariants = {
    hidden: { x: isRtl ? '100%' : '-100%' },
    visible: { x: 0 },
    exit: { x: isRtl ? '100%' : '-100%' }
  };

  const userEmail = auth.currentUser?.email || (isGuest ? (language === 'en' ? 'Guest Mode' : 'وضع الضيف') : 'Anonymous User');

  return (
    <div className="absolute inset-0 z-50 flex overflow-hidden">
      {/* Backdrop Backdrop Overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
      />

      {/* Drawer Body */}
      <motion.div 
        variants={slideVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className={`absolute top-0 bottom-0 w-4/5 max-w-[290px] h-full flex flex-col justify-between z-50 border-r border-l shadow-2xl transition-all duration-300 ${
          isRtl ? 'right-0 border-l border-r-0' : 'left-0 border-r border-l-0'
        } ${
          theme === 'dark' 
            ? 'bg-[#0A0A0A] border-[#1A1A1A] text-[#E0E0E0]' 
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Header section */}
        <div className={`p-4 border-b flex items-center justify-between ${
          theme === 'dark' ? 'border-[#1A1A1A]' : 'border-zinc-200/80'
        }`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">
              N
            </div>
            <span className="font-bold tracking-tight text-md">
              {t.appName} {t.chatHistory}
            </span>
          </div>
          <button 
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-all ${
              theme === 'dark' ? 'hover:bg-[#1C1C1C]' : 'hover:bg-zinc-100'
            }`}
          >
            <X className="w-4 h-4 opacity-70" />
          </button>
        </div>

        {/* Action Button: New Chat */}
        <div className="p-3">
          <button 
            onClick={() => {
              onCreateSession();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/10 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{t.newChat}</span>
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1.5 scrollbar-thin">
          {sessions.length === 0 ? (
            <div className="text-center py-8 opacity-50 text-xs">
              {t.noHistory}
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              return (
                <div 
                  key={session.id}
                  className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-semibold transition-all ${
                    isActive 
                      ? (theme === 'dark' ? 'bg-[#121212] text-white border border-[#222222]' : 'bg-zinc-100 text-zinc-900 border border-zinc-200')
                      : (theme === 'dark' ? 'hover:bg-[#121212]/40 text-[#A0A0A0] hover:text-[#E0E0E0]' : 'hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900')
                  }`}
                  onClick={() => {
                    onSelectSession(session.id);
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden w-[82%]">
                    <MessageSquare className={`w-4 h-4 shrink-0 opacity-70 ${isActive ? 'text-indigo-500' : ''}`} />
                    <span className="truncate whitespace-nowrap text-[11px] tracking-tight">{session.title}</span>
                  </div>
                  
                  {/* Delete button (shows on hover/always on mobile/active) */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className={`p-1 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-red-500/10 text-zinc-400 hover:text-red-500 transition-all cursor-pointer ${
                      isActive ? 'opacity-70' : ''
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Alert for Guest Mode info */}
        {isGuest && (
          <div className="px-4 py-2 mx-3 my-2 rounded-lg bg-amber-500/5 border border-amber-500/10 text-amber-500 flex items-start gap-1.5 text-[9px] leading-tight font-semibold">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>{t.guestAlert}</span>
          </div>
        )}

        {/* User Account / Controls panel at footer */}
        <div className={`p-4 border-t space-y-3.5 ${
          theme === 'dark' ? 'border-[#1A1A1A] bg-[#0C0C0C]' : 'border-zinc-200/80 bg-zinc-50/50'
        }`}>
          {/* User Email & status */}
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
              theme === 'dark' ? 'bg-[#121212] border border-[#222222] text-indigo-400' : 'bg-zinc-200 text-indigo-600'
            }`}>
              {isGuest ? 'G' : (auth.currentUser?.email?.[0].toUpperCase() || 'U')}
            </div>
            <div className="overflow-hidden">
              <div className="text-[10px] font-bold opacity-50 tracking-wider uppercase">
                {isGuest ? (language === 'en' ? 'GUEST USER' : 'مستخدم ضيف') : (language === 'en' ? 'ACCOUNT' : 'الحساب')}
              </div>
              <div className="text-[11px] font-semibold truncate opacity-85 leading-none">{userEmail}</div>
            </div>
          </div>

          {/* Quick preferences controls */}
          <div className="flex items-center justify-between gap-2">
            {/* Language toggle */}
            <button 
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-[10px] font-extrabold tracking-tight transition-all cursor-pointer ${
                theme === 'dark' 
                  ? 'border-[#222222] bg-[#121212] hover:bg-[#1C1C1C] text-white/90' 
                  : 'border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700'
              }`}
            >
              <Globe className="w-3 h-3 text-indigo-500" />
              <span>{language === 'en' ? 'العربية' : 'English'}</span>
            </button>

            {/* Theme toggle */}
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-[10px] font-extrabold tracking-tight transition-all cursor-pointer ${
                theme === 'dark' 
                  ? 'border-[#222222] bg-[#121212] hover:bg-[#1C1C1C] text-white/90' 
                  : 'border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700'
              }`}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3 h-3 text-amber-400" />
                  <span>{t.light}</span>
                </>
              ) : (
                <>
                  <Moon className="w-3 h-3 text-indigo-600" />
                  <span>{t.dark}</span>
                </>
              )}
            </button>
          </div>

          {/* Logout button */}
          <button 
            onClick={handleLogout}
            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              theme === 'dark' 
                ? 'bg-[#121212] hover:bg-red-950/20 text-red-400 hover:text-red-300 border border-[#222222] hover:border-red-500/10' 
                : 'bg-zinc-100 hover:bg-red-50 text-red-600 border border-zinc-200 hover:border-red-200'
            }`}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t.logout}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
