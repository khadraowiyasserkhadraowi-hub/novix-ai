import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
import { getUserSessions, saveSession, deleteSessionFromDb } from './lib/db';
import { ChatSession, Message, Language, Theme } from './types';
import { translations } from './translations';
import MobileFrame from './components/MobileFrame';
import AuthScreen from './components/AuthScreen';
import HistorySidebar from './components/HistorySidebar';
import ChatInterface from './components/ChatInterface';
import ImageGenerator from './components/ImageGenerator';
import VoiceInterface from './components/VoiceInterface';
import HistoryTab from './components/HistoryTab';
import SettingsTab from './components/SettingsTab';
import { 
  MessageSquare, Image as ImageIcon, Sparkles, Menu, Trash2, 
  RefreshCw, LogOut, ShieldCheck, User as UserIcon, Mic, History, Settings
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

const novixLogo = '/src/assets/images/novix_app_icon_1783185001834.jpg';

export default function App() {
  const [authState, setAuthState] = useState<'loading' | 'unauthenticated' | 'authenticated'>('loading');
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(true);
  
  // App preferences
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<Theme>('dark');
  
  // App Navigation & layouts
  const [activeTab, setActiveTab] = useState<'chat' | 'images' | 'voice' | 'history' | 'settings'>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Conversational states
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  // Splash Screen timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const t = translations[language];
  const isRtl = language === 'ar';

  // Apply dark mode styling class to root body
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Sync Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsGuest(firebaseUser.isAnonymous);
        setAuthState('authenticated');
      } else {
        setUser(null);
        setIsGuest(true);
        setAuthState('authenticated');
      }
    });

    return unsubscribe;
  }, []);

  // Load chat sessions when authenticated
  useEffect(() => {
    const loadSessions = async () => {
      if (authState !== 'authenticated') return;

      if (isGuest) {
        // Load Guest sessions from LocalStorage
        const localData = localStorage.getItem('novix_guest_sessions');
        let hasLoaded = false;
        if (localData) {
          try {
            const parsed = JSON.parse(localData) as ChatSession[];
            if (parsed && parsed.length > 0) {
              setSessions(parsed);
              setActiveSessionId(parsed[0].id);
              hasLoaded = true;
            }
          } catch (e) {
            console.error('Error parsing local sessions:', e);
          }
        }
        if (!hasLoaded) {
          createNewSession();
        }
      } else if (user) {
        // Load from Firestore
        const fetched = await getUserSessions(user.uid);
        setSessions(fetched);
        if (fetched.length > 0) {
          setActiveSessionId(fetched[0].id);
        } else {
          // Create initial empty session
          createNewSession();
        }
      }
    };

    loadSessions();
  }, [authState, user, isGuest]);

  // Save guest sessions to LocalStorage on state change
  useEffect(() => {
    if (isGuest && authState === 'authenticated') {
      localStorage.setItem('novix_guest_sessions', JSON.stringify(sessions));
    }
  }, [sessions, isGuest, authState]);

  const createNewSession = () => {
    const currentUserId = user?.uid || 'guest';
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: language === 'en' ? 'New Conversation' : 'محادثة جديدة',
      userId: currentUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: []
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    
    if (!isGuest && authState === 'authenticated') {
      saveSession(newSession);
    }
  };

  const selectSession = (id: string) => {
    setActiveSessionId(id);
    setActiveTab('chat');
  };

  const deleteSession = async (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    
    if (activeSessionId === id) {
      const remaining = sessions.filter((s) => s.id !== id);
      if (remaining.length > 0) {
        setActiveSessionId(remaining[0].id);
      } else {
        setActiveSessionId(null);
      }
    }

    if (!isGuest && authState === 'authenticated') {
      await deleteSessionFromDb(id);
    }
  };

  const handleClearAllSessions = async () => {
    const copyOfSessions = [...sessions];
    setSessions([]);
    setActiveSessionId(null);
    if (!isGuest && authState === 'authenticated') {
      for (const s of copyOfSessions) {
        await deleteSessionFromDb(s.id);
      }
    }
  };

  const handleSendMessage = async (content: string, attachedImage?: string, mode: 'chat' | 'draw' = 'chat') => {
    if (isLoadingChat) return;
    setChatError(null);
    setIsLoadingChat(true);

    let currentSessionId = activeSessionId;
    let currentSessions = [...sessions];
    let activeSession = currentSessions.find((s) => s.id === currentSessionId);

    // 1. If there's no active session (or it was deleted), create a new one
    if (!activeSession) {
      const currentUserId = user?.uid || 'guest';
      const newSession: ChatSession = {
        id: `session_${Date.now()}`,
        title: content.slice(0, 24) + (content.length > 24 ? '...' : ''),
        userId: currentUserId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: []
      };
      currentSessionId = newSession.id;
      currentSessions = [newSession, ...currentSessions];
      activeSession = newSession;
      setSessions(currentSessions);
      setActiveSessionId(currentSessionId);
    }

    // 2. Format the user's message
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: mode === 'draw' ? `🎨 Draw: ${content}` : content,
      type: 'text',
      createdAt: new Date().toISOString(),
      image: attachedImage
    };

    // 3. Update the active session messages
    const updatedMessages = [...activeSession.messages, userMessage];
    
    // Auto rename session based on first prompt
    let title = activeSession.title;
    if (activeSession.messages.length === 0) {
      title = content.slice(0, 26) + (content.length > 26 ? '...' : '');
    }

    const updatedSession: ChatSession = {
      ...activeSession,
      title,
      messages: updatedMessages,
      updatedAt: new Date().toISOString()
    };

    // Update state synchronously for snappier feedback
    const updatedSessionsList = currentSessions.map((s) => 
      s.id === currentSessionId ? updatedSession : s
    );
    // Sort so modified is at the top
    const sortedSessions = updatedSessionsList.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    
    setSessions(sortedSessions);

    // Save user message to cloud database if not guest
    if (!isGuest && authState === 'authenticated') {
      await saveSession(updatedSession);
    }

    try {
      if (mode === 'draw') {
        // Direct Image Generation Mode
        const response = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: content, aspectRatio: '1:1' })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || t.errorImage);
        }

        const imageMessage: Message = {
          id: `msg_${Date.now()}_img`,
          role: 'assistant',
          content: data.imageUrl,
          type: 'image',
          createdAt: new Date().toISOString()
        };

        setSessions((prevSessions) => {
          const active = prevSessions.find((s) => s.id === currentSessionId);
          if (!active) return prevSessions;
          const updated = {
            ...active,
            messages: [...active.messages, imageMessage],
            updatedAt: new Date().toISOString()
          };
          
          if (!isGuest && authState === 'authenticated') {
            saveSession(updated);
          }
          return prevSessions.map((s) => s.id === currentSessionId ? updated : s);
        });

      } else {
        // Normal Text Chat or Multimodal Image Analysis Mode (Streaming)
        const contextMessages = updatedMessages.slice(-15).map((m) => ({
          role: m.role,
          content: m.content,
          image: m.image
        }));

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: contextMessages })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || t.errorChat);
        }

        if (!response.body) {
          throw new Error('No response body from server');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let done = false;
        let accumulatedText = '';

        // Initialize empty assistant message
        const assistantMessageId = `msg_${Date.now()}_reply`;
        
        setSessions((prevSessions) => {
          const active = prevSessions.find((s) => s.id === currentSessionId);
          if (!active) return prevSessions;
          
          const emptyAssistantMessage: Message = {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            type: 'text',
            createdAt: new Date().toISOString()
          };

          const updated = {
            ...active,
            messages: [...active.messages, emptyAssistantMessage],
            updatedAt: new Date().toISOString()
          };

          return prevSessions.map((s) => s.id === currentSessionId ? updated : s);
        });

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            const chunkStr = decoder.decode(value, { stream: !done });
            accumulatedText += chunkStr;

            setSessions((prevSessions) => {
              const active = prevSessions.find((s) => s.id === currentSessionId);
              if (!active) return prevSessions;

              const updatedMessages = active.messages.map((m) => {
                if (m.id === assistantMessageId) {
                  return { ...m, content: accumulatedText };
                }
                return m;
              });

              const updated = {
                ...active,
                messages: updatedMessages,
                updatedAt: new Date().toISOString()
              };

              return prevSessions.map((s) => s.id === currentSessionId ? updated : s);
            });
          }
        }

        // Save assistant reply to database once fully complete
        if (!isGuest && authState === 'authenticated') {
          setSessions((currentSessionsList) => {
            const completedSession = currentSessionsList.find((s) => s.id === currentSessionId);
            if (completedSession) {
              saveSession(completedSession);
            }
            return currentSessionsList;
          });
        }
      }
    } catch (err: any) {
      console.error(err);
      setChatError(err.message || t.errorChat);
    } finally {
      setIsLoadingChat(false);
    }
  };

  // When a user generates an image, we append it to their current active chat session so they see it in their timeline!
  const handleImageGenerated = async (imageUrl: string) => {
    let currentSessionId = activeSessionId;
    let activeSession = sessions.find((s) => s.id === currentSessionId);

    if (!activeSession) {
      // Create session first
      const currentUserId = user?.uid || 'guest';
      const title = language === 'en' ? '🎨 Generated Image' : '🎨 صورة مولدة';
      const newSession: ChatSession = {
        id: `session_${Date.now()}`,
        title,
        userId: currentUserId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: []
      };
      currentSessionId = newSession.id;
      activeSession = newSession;
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(currentSessionId);
    }

    const imageMessage: Message = {
      id: `msg_${Date.now()}_img`,
      role: 'assistant',
      content: imageUrl,
      type: 'image',
      createdAt: new Date().toISOString()
    };

    const updatedSession: ChatSession = {
      ...activeSession,
      messages: [...activeSession.messages, imageMessage],
      updatedAt: new Date().toISOString()
    };

    setSessions((prev) => 
      prev.map((s) => s.id === currentSessionId ? updatedSession : s)
    );

    if (!isGuest && authState === 'authenticated') {
      await saveSession(updatedSession);
    }
  };

  const handleGuestSuccess = () => {
    setIsGuest(true);
    setAuthState('authenticated');
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const activeMessages = activeSession ? activeSession.messages : [];

  return (
    <MobileFrame 
      theme={theme} 
      language={language}
      onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      showMenuButton={authState === 'authenticated'}
    >
      <AnimatePresence mode="wait">
        {(showSplash || authState === 'loading') && (
          /* High fidelity startup boot splash screen */
          <motion.div 
            key="splash-screen"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className={`flex-1 flex flex-col justify-between items-center py-12 px-6 ${
              theme === 'dark' ? 'bg-[#050505] text-[#E0E0E0]' : 'bg-zinc-50 text-zinc-900'
            }`}
          >
            {/* Top Spacer to balance layout */}
            <div className="h-6"></div>

            {/* Central App Logo and Brand container */}
            <div className="flex flex-col items-center text-center space-y-5">
              <motion.div 
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5, type: "spring", stiffness: 100 }}
                className="relative group cursor-pointer"
              >
                {/* Glowing Aura backdrop */}
                <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 rounded-3xl blur-md opacity-40 animate-pulse"></div>
                
                {/* Real App Icon generated via Imagen */}
                <div className="relative w-20 h-20 rounded-3xl overflow-hidden border border-zinc-800/20 shadow-xl bg-black">
                  <img 
                    src={novixLogo} 
                    alt="Novix AI Logo" 
                    className="w-full h-full object-cover select-none"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </motion.div>

              <div className="space-y-1.5">
                <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent font-sans">
                  Novix AI
                </h1>
                <p className={`text-[11px] font-semibold tracking-wide ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {language === 'en' ? 'Next-Gen Intelligent Companion' : 'الرفيق الذكي من الجيل القادم'}
                </p>
              </div>

              {/* Sleek Progress Loading Indicator */}
              <div className="flex gap-1.5 pt-4">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce delay-0" />
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce delay-150" />
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-bounce delay-300" />
              </div>
            </div>

            {/* Bottom Copyright & Studio indicator */}
            <div className="text-center space-y-1">
              <p className={`text-[10px] font-bold tracking-widest uppercase ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                {language === 'en' ? 'Powered by Novix AI' : 'مدعوم بنظام Novix AI'}
              </p>
              <p className={`text-[8px] font-semibold opacity-40 ${theme === 'dark' ? 'text-zinc-700' : 'text-zinc-500'}`}>
                © 2026 Novix AI Studio. All Rights Reserved.
              </p>
            </div>
          </motion.div>
        )}

        {authState === 'unauthenticated' && (
          /* Login and signup experience */
          <motion.div
            key="auth-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col h-full"
          >
            <AuthScreen 
              language={language}
              theme={theme}
              setLanguage={setLanguage}
              setTheme={setTheme}
              onAuthSuccess={() => setAuthState('authenticated')}
            />
          </motion.div>
        )}

        {authState === 'authenticated' && (
          /* Main application client space */
          <motion.div
            key="workspace-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex-1 flex flex-col h-full overflow-hidden relative"
          >
            {/* Top Toolbar */}
            <div className={`h-12 px-4 flex items-center justify-between border-b shrink-0 z-10 transition-colors duration-300 ${
              theme === 'dark' ? 'bg-[#0A0A0A]/95 border-[#1A1A1A]' : 'bg-white/95 border-zinc-200/80'
            }`}>
              <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Menu hamburger drawer selector */}
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    theme === 'dark' ? 'hover:bg-[#121212] text-white/90' : 'hover:bg-zinc-100 text-zinc-700'
                  }`}
                >
                  <Menu className="w-5 h-5" />
                </button>

                <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  {t.appName}
                </span>

                {/* Secure / Guest Badge indicator */}
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  isGuest 
                    ? (theme === 'dark' ? 'bg-amber-500/5 text-amber-500 border border-amber-500/10' : 'bg-amber-50 text-amber-600')
                    : (theme === 'dark' ? 'bg-emerald-500/5 text-emerald-400 border border-emerald-500/10' : 'bg-emerald-50 text-emerald-600')
                }`}>
                  {isGuest ? <UserIcon className="w-2.5 h-2.5" /> : <ShieldCheck className="w-2.5 h-2.5" />}
                  <span>{isGuest ? (language === 'en' ? 'Guest' : 'ضيف') : (language === 'en' ? 'Cloud' : 'سحابي')}</span>
                </div>
              </div>

              {/* Reset current chat history button */}
              {activeTab === 'chat' && activeMessages.length > 0 && (
                <button 
                  onClick={() => deleteSession(activeSessionId!)}
                  className={`p-1.5 rounded-lg transition-all text-zinc-400 hover:text-red-500 cursor-pointer ${
                    theme === 'dark' ? 'hover:bg-[#121212]' : 'hover:bg-zinc-100'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sub Screens according to Active Tab */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {activeTab === 'chat' && (
                <ChatInterface 
                  language={language}
                  theme={theme}
                  messages={activeMessages}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoadingChat}
                  error={chatError}
                  onClearChat={() => deleteSession(activeSessionId!)}
                />
              )}
              {activeTab === 'images' && (
                <ImageGenerator 
                  language={language}
                  theme={theme}
                  onImageGenerated={handleImageGenerated}
                />
              )}
              {activeTab === 'voice' && (
                <VoiceInterface 
                  language={language}
                  theme={theme}
                  activeSessionId={activeSessionId}
                  sessions={sessions}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoadingChat}
                />
              )}
              {activeTab === 'history' && (
                <HistoryTab 
                  sessions={sessions}
                  activeSessionId={activeSessionId}
                  onSelectSession={selectSession}
                  onNewSession={createNewSession}
                  onDeleteSession={deleteSession}
                  language={language}
                  theme={theme}
                  isGuest={isGuest}
                />
              )}
              {activeTab === 'settings' && (
                <SettingsTab 
                  language={language}
                  setLanguage={setLanguage}
                  theme={theme}
                  setTheme={setTheme}
                  isGuest={isGuest}
                  sessions={sessions}
                  onLogout={async () => {
                    try {
                      await auth.signOut();
                    } catch (e) {
                      console.error("Signout error: ", e);
                    }
                  }}
                  onClearAllSessions={handleClearAllSessions}
                />
              )}
            </div>

            {/* Bottom tab menu navigation bar */}
            <div className={`h-14 border-t px-2 flex items-center justify-around shrink-0 transition-colors duration-300 ${
              theme === 'dark' ? 'bg-[#0A0A0A] border-t-[#1A1A1A]' : 'bg-white border-zinc-200'
            }`}>
              {/* Tab 1: Chat with AI */}
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'chat'
                    ? 'text-indigo-400 font-bold scale-102'
                    : 'text-zinc-500 font-semibold opacity-70 hover:opacity-100'
                }`}
              >
                <MessageSquare className="w-4.5 h-4.5 stroke-[2]" />
                <span className="text-[9px] tracking-tight truncate max-w-full">{t.chat}</span>
              </button>

              {/* Tab 2: AI Image generator */}
              <button
                onClick={() => setActiveTab('images')}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'images'
                    ? 'text-indigo-400 font-bold scale-102'
                    : 'text-zinc-500 font-semibold opacity-70 hover:opacity-100'
                }`}
              >
                <ImageIcon className="w-4.5 h-4.5 stroke-[2]" />
                <span className="text-[9px] tracking-tight truncate max-w-full">{t.imageGen}</span>
              </button>

              {/* Tab 3: Dedicated Voice Assistant mode */}
              <button
                onClick={() => setActiveTab('voice')}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'voice'
                    ? 'text-indigo-400 font-bold scale-102'
                    : 'text-zinc-500 font-semibold opacity-70 hover:opacity-100'
                }`}
              >
                <Mic className="w-4.5 h-4.5 stroke-[2]" />
                <span className="text-[9px] tracking-tight truncate max-w-full">
                  {language === 'en' ? 'Voice' : 'صوت'}
                </span>
              </button>

              {/* Tab 4: Local/Cloud memory history */}
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'history'
                    ? 'text-indigo-400 font-bold scale-102'
                    : 'text-zinc-500 font-semibold opacity-70 hover:opacity-100'
                }`}
              >
                <History className="w-4.5 h-4.5 stroke-[2]" />
                <span className="text-[9px] tracking-tight truncate max-w-full">{t.chatHistory}</span>
              </button>

              {/* Tab 5: Settings dashboard */}
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'text-indigo-400 font-bold scale-102'
                    : 'text-zinc-500 font-semibold opacity-70 hover:opacity-100'
                }`}
              >
                <Settings className="w-4.5 h-4.5 stroke-[2]" />
                <span className="text-[9px] tracking-tight truncate max-w-full">{t.settings}</span>
              </button>
            </div>

            {/* Sliding Drawer Sidebar overlay */}
            <AnimatePresence>
              {isSidebarOpen && (
                <HistorySidebar 
                  isOpen={isSidebarOpen}
                  onClose={() => setIsSidebarOpen(false)}
                  language={language}
                  theme={theme}
                  setLanguage={setLanguage}
                  setTheme={setTheme}
                  sessions={sessions}
                  activeSessionId={activeSessionId}
                  onSelectSession={selectSession}
                  onCreateSession={createNewSession}
                  onDeleteSession={deleteSession}
                  isGuest={isGuest}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileFrame>
  );
}
