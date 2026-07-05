import React, { useState } from 'react';
import { Search, Calendar, MessageSquare, Trash2, Plus, Sparkles, FolderOpen, Info, ShieldAlert } from 'lucide-react';
import { ChatSession, Language, Theme } from '../types';
import { translations } from '../translations';

interface HistoryTabProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  language: Language;
  theme: Theme;
  isGuest: boolean;
}

export default function HistoryTab({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  language,
  theme,
  isGuest
}: HistoryTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const t = translations[language];
  const isRtl = language === 'ar';

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (session.messages && session.messages.some(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  // Grouping by Date
  const getGroupTitle = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return language === 'en' ? 'Today' : 'اليوم';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return language === 'en' ? 'Yesterday' : 'أمس';
    } else {
      // Standard date format
      return date.toLocaleDateString(language === 'en' ? 'en-US' : 'ar-EG', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  // Map dates to groups
  const groups: { [key: string]: ChatSession[] } = {};
  filteredSessions.forEach(session => {
    const key = getGroupTitle(session.updatedAt);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(session);
  });

  return (
    <div className={`flex-1 flex flex-col justify-between overflow-y-auto px-4 py-5 scrollbar-thin transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#050505]' : 'bg-zinc-50'
    }`} dir={isRtl ? 'rtl' : 'ltr'}>
      
      <div className="space-y-4">
        {/* Header Title section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-xl font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
              {t.chatHistory}
            </h1>
            <p className={`text-[10px] font-semibold mt-0.5 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
              {language === 'en' 
                ? `Manage your active memory & voice timelines (${sessions.length} sessions)` 
                : `إدارة الذاكرة النشطة والمخططات الزمنية (${sessions.length} جلسة)`}
            </p>
          </div>

          <button
            onClick={onNewSession}
            className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md shadow-indigo-500/10 transition-all flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{t.newChat}</span>
          </button>
        </div>

        {/* Guest Mode Alert info banner */}
        {isGuest && (
          <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-amber-500 flex items-start gap-2.5 text-xs font-semibold leading-relaxed">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-amber-400">{language === 'en' ? 'Guest mode restrictions' : 'قيود وضع الضيف'}</span>
              <p className="opacity-80 text-[10px] leading-snug">{t.guestAlert}</p>
            </div>
          </div>
        )}

        {/* Search Input field */}
        <div className="relative">
          <Search className={`absolute top-3 w-4 h-4 ${isRtl ? 'right-3.5' : 'left-3.5'} opacity-40`} />
          <input
            type="text"
            placeholder={language === 'en' ? 'Search chat history...' : 'ابحث في سجل المحادثات...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full py-2.5 rounded-xl text-xs font-semibold border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
              isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'
            } ${
              theme === 'dark'
                ? 'bg-[#0A0A0A] border-[#1A1A1A] text-white placeholder-[#666666]'
                : 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400'
            }`}
          />
        </div>

        {/* Dynamic Groups list */}
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center justify-center space-y-3.5 opacity-60">
              <div className={`p-4 rounded-full ${theme === 'dark' ? 'bg-[#121212] border border-[#1A1A1A] text-zinc-500' : 'bg-zinc-100 text-zinc-400'}`}>
                <FolderOpen className="w-8 h-8 stroke-[1.5]" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold">{t.noHistory}</p>
                <p className={`text-[10px] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {language === 'en' ? 'Start a conversation with Novix AI to build history' : 'ابدأ محادثة مع نوفيكس لبناء السجل الخاص بك'}
                </p>
              </div>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center justify-center space-y-2 opacity-50">
              <p className="text-xs font-bold">{language === 'en' ? 'No matching results found' : 'لم يتم العثور على نتائج مطابقة'}</p>
              <p className="text-[10px]">{language === 'en' ? 'Try adjusting your keywords' : 'جرب تعديل كلمات البحث'}</p>
            </div>
          ) : (
            Object.keys(groups).map(groupTitle => (
              <div key={groupTitle} className="space-y-2">
                <div className="flex items-center gap-1.5 opacity-40 px-1 select-none">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold tracking-wider uppercase font-mono">{groupTitle}</span>
                </div>

                <div className="space-y-2">
                  {groups[groupTitle].map(session => {
                    const isActive = session.id === activeSessionId;
                    const messageCount = session.messages ? session.messages.length : 0;
                    
                    return (
                      <div
                        key={session.id}
                        className={`group relative flex items-center justify-between p-3.5 rounded-2xl cursor-pointer border transition-all ${
                          isActive
                            ? (theme === 'dark' ? 'bg-[#121212] border-[#222222] text-white shadow-inner shadow-indigo-500/5' : 'bg-zinc-100 border-zinc-200 text-zinc-900')
                            : (theme === 'dark' ? 'bg-[#0A0A0A] border-[#1A1A1A] text-zinc-400 hover:bg-[#121212]/50 hover:text-zinc-200 hover:border-[#222222]' : 'bg-white border-zinc-100 text-zinc-600 hover:bg-zinc-100/50 hover:text-zinc-900 hover:border-zinc-200')
                        }`}
                        onClick={() => onSelectSession(session.id)}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border transition-colors ${
                            isActive
                              ? 'bg-indigo-600 border-indigo-500 text-white'
                              : (theme === 'dark' ? 'bg-[#151515] border-[#222222] text-indigo-400' : 'bg-zinc-50 border-zinc-100 text-indigo-600')
                          }`}>
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-bold truncate ${isActive ? 'text-white' : (theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800')}`}>
                              {session.title}
                            </p>
                            <p className="text-[9px] font-mono opacity-50 mt-0.5">
                              {messageCount} {language === 'en' ? 'messages' : 'رسائل'}
                            </p>
                          </div>
                        </div>

                        {/* Delete Session Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(session.id);
                          }}
                          className={`p-2 rounded-xl transition-all hover:bg-red-950/20 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 focus:opacity-100 border border-transparent hover:border-red-500/10 cursor-pointer ${
                            isRtl ? 'mr-2' : 'ml-2'
                          }`}
                          title={t.delete}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Static premium bottom info tag */}
      <div className={`p-4 mt-6 rounded-2xl border text-center text-[10px] font-semibold leading-normal shrink-0 ${
        theme === 'dark' 
          ? 'bg-[#0A0A0A] border-[#1A1A1A] text-zinc-500' 
          : 'bg-white border-zinc-200 text-zinc-400'
      }`}>
        <p className="flex items-center justify-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-indigo-400" />
          <span>
            {language === 'en' 
              ? "Selecting any session automatically redirects you to the AI Chat screen." 
              : "اختيار أي جلسة سيوجهك تلقائياً إلى شاشة المحادثة النشطة."}
          </span>
        </p>
      </div>
    </div>
  );
}
