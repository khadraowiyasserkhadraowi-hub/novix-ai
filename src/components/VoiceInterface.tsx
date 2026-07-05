import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Volume2, VolumeX, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { Language, Theme, ChatSession, Message } from '../types';
import { translations } from '../translations';

interface VoiceInterfaceProps {
  theme: Theme;
  language: Language;
  activeSessionId: string | null;
  sessions: ChatSession[];
  onSendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
}

type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

export default function VoiceInterface({
  theme,
  language,
  activeSessionId,
  sessions,
  onSendMessage,
  isLoading
}: VoiceInterfaceProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [responseMessage, setResponseMessage] = useState<string>('');
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  const t = translations[language];
  const isRtl = language === 'ar';

  // Initialize Speech Synthesis and Recognition
  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition not natively supported in this browser. Falling back to simulated input.");
    } else {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      
      rec.onstart = () => {
        setVoiceState('listening');
        setTranscript(language === 'en' ? 'Listening...' : 'جاري الاستماع...');
        setResponseMessage('');
      };

      rec.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        setTranscript(resultText);
        setVoiceState('thinking');
        handleVoiceQuerySubmit(resultText);
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error !== 'no-speech') {
          setVoiceState('idle');
          setTranscript(language === 'en' ? 'Could not hear. Tap to try again.' : 'تعذر السماع. اضغط للمحاولة ثانية.');
        } else {
          setVoiceState('idle');
          setTranscript('');
        }
      };

      rec.onend = () => {
        if (voiceState === 'listening') {
          setVoiceState('idle');
        }
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [language]);

  // Sync internal voice state with App's chat loading state
  useEffect(() => {
    if (isLoading && voiceState === 'listening') {
      setVoiceState('thinking');
    }
  }, [isLoading]);

  // Watch sessions for new assistant replies when we are in 'thinking' state
  useEffect(() => {
    if (voiceState === 'thinking' && !isLoading) {
      const activeSession = sessions.find(s => s.id === activeSessionId);
      if (activeSession && activeSession.messages.length > 0) {
        const lastMsg = activeSession.messages[activeSession.messages.length - 1];
        if (lastMsg.role === 'assistant') {
          setVoiceState('speaking');
          setResponseMessage(lastMsg.content);
          if (!isMuted) {
            speakResponse(lastMsg.content);
          } else {
            setVoiceState('idle');
          }
        } else {
          setVoiceState('idle');
        }
      } else {
        setVoiceState('idle');
      }
    }
  }, [sessions, isLoading, activeSessionId]);

  // Handle actual API trigger
  const handleVoiceQuerySubmit = async (query: string) => {
    if (!query.trim()) return;
    try {
      await onSendMessage(query);
    } catch (err) {
      console.error(err);
      setVoiceState('idle');
      setTranscript(language === 'en' ? 'Error sending query' : 'خطأ أثناء إرسال الطلب');
    }
  };

  // Speaks out the AI response
  const speakResponse = (text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();

    // Remove markdown symbols for pleasant clean TTS
    const cleanText = text.replace(/[\*#_`\-\[\]]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'ar' ? 'ar-SA' : 'en-US';
    
    // Attempt to set a friendly robotic voice if available
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(v => 
      language === 'ar' ? v.lang.startsWith('ar') : (v.name.includes('Google') || v.name.includes('Natural'))
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => {
      setVoiceState('idle');
    };

    utterance.onerror = () => {
      setVoiceState('idle');
    };

    activeUtteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  // Toggle listening or simulation
  const toggleListening = () => {
    // If speaking, stop speaking
    if (voiceState === 'speaking') {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      setVoiceState('idle');
      return;
    }

    // Cancel current speech anyway
    if (synthRef.current) {
      synthRef.current.cancel();
    }

    if (recognitionRef.current) {
      if (voiceState === 'listening') {
        recognitionRef.current.stop();
        setVoiceState('idle');
      } else {
        try {
          recognitionRef.current.lang = language === 'ar' ? 'ar-SA' : 'en-US';
          recognitionRef.current.start();
        } catch (e) {
          // If already running
          recognitionRef.current.stop();
          setTimeout(() => {
            recognitionRef.current.lang = language === 'ar' ? 'ar-SA' : 'en-US';
            recognitionRef.current.start();
          }, 100);
        }
      }
    } else {
      // Fallback Simulation for browser constraints (iframe environment frequently restricts mic permissions)
      simulateVoiceConversation();
    }
  };

  // Highly robust interactive fallback simulation
  const simulateVoiceConversation = () => {
    if (voiceState === 'listening') {
      setVoiceState('idle');
      return;
    }

    setVoiceState('listening');
    setTranscript(language === 'en' ? 'Listening...' : 'جاري الاستماع...');
    setResponseMessage('');

    const simulationsEn = [
      "Tell me a fun fact about deep space",
      "Explain artificial intelligence in one simple sentence",
      "Suggest a beautiful city to visit",
      "Give me a motivation boost for today"
    ];

    const simulationsAr = [
      "أخبرني بمعلومة ممتعة عن الفضاء العميق",
      "اشرح لي الذكاء الاصطناعي في جملة واحدة بسيطة",
      "اقترح علي مدينة جميلة لزيارتها",
      "أعطني دفعة تحفيزية لليوم"
    ];

    const phrases = language === 'en' ? simulationsEn : simulationsAr;
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];

    // Simulate speech typing delay
    setTimeout(() => {
      setTranscript(randomPhrase);
      setVoiceState('thinking');
      handleVoiceQuerySubmit(randomPhrase);
    }, 2500);
  };

  // Toggle Mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted && synthRef.current) {
      synthRef.current.cancel();
      if (voiceState === 'speaking') {
        setVoiceState('idle');
      }
    }
  };

  // Waveform heights animations helper
  const renderWaveform = () => {
    const barsCount = 12;
    return (
      <div className="flex items-center justify-center gap-1.5 h-16 my-4">
        {Array.from({ length: barsCount }).map((_, i) => {
          let duration = 0.5 + Math.random() * 0.8;
          let scaleY = voiceState === 'listening' 
            ? [1, 2.5, 1] 
            : voiceState === 'speaking' 
              ? [1, 3.5, 1] 
              : voiceState === 'thinking' 
                ? [1, 1.5, 1] 
                : [1, 1, 1];
          return (
            <motion.div
              key={i}
              animate={{ scaleY: scaleY }}
              transition={{
                duration: duration,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.05
              }}
              className={`w-1 rounded-full origin-center ${
                voiceState === 'listening' 
                  ? 'bg-emerald-400 h-4' 
                  : voiceState === 'speaking'
                    ? 'bg-gradient-to-t from-indigo-500 to-pink-500 h-5'
                    : voiceState === 'thinking'
                      ? 'bg-purple-500/50 h-3'
                      : 'bg-zinc-600 h-2'
              }`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className={`flex-1 flex flex-col justify-between overflow-y-auto px-6 py-6 scrollbar-thin transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#050505]' : 'bg-zinc-50'
    }`}>
      {/* Top Controls bar */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${
            voiceState === 'listening' ? 'bg-emerald-500 animate-ping' :
            voiceState === 'thinking' ? 'bg-purple-500 animate-pulse' :
            voiceState === 'speaking' ? 'bg-indigo-500 animate-pulse' :
            'bg-zinc-500'
          }`} />
          <span className={`text-[10px] font-mono tracking-wider uppercase font-bold ${
            theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'
          }`}>
            {voiceState === 'listening' ? (language === 'en' ? 'listening' : 'استماع') :
             voiceState === 'thinking' ? (language === 'en' ? 'processing' : 'تحليل') :
             voiceState === 'speaking' ? (language === 'en' ? 'speaking' : 'تحدث') :
             (language === 'en' ? 'voice stand-by' : 'وضع الاستعداد')}
          </span>
        </div>

        <button
          onClick={toggleMute}
          className={`p-2 rounded-xl border transition-all ${
            theme === 'dark'
              ? 'border-[#1A1A1A] bg-[#0A0A0A] text-white/80 hover:text-white hover:bg-[#121212]'
              : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100'
          }`}
          title={isMuted ? 'Unmute TTS' : 'Mute TTS'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-indigo-400" />}
        </button>
      </div>

      {/* Main Interactive Circle & Visualizer */}
      <div className="flex-1 flex flex-col items-center justify-center py-6 text-center select-none">
        
        {/* Glow pulsing ring orb */}
        <div className="relative flex items-center justify-center w-52 h-52 mb-8">
          <AnimatePresence>
            {voiceState !== 'idle' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: [0.15, 0.4, 0.15],
                  scale: [1, 1.4, 1],
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  duration: voiceState === 'speaking' ? 2 : 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className={`absolute inset-0 rounded-full blur-2xl ${
                  voiceState === 'listening' ? 'bg-emerald-500/30' :
                  voiceState === 'speaking' ? 'bg-indigo-500/30' :
                  'bg-purple-500/30'
                }`}
              />
            )}
          </AnimatePresence>

          {/* Solid decorative border orb */}
          <motion.div 
            animate={{
              rotate: voiceState === 'thinking' ? 360 : 0,
              scale: voiceState === 'listening' ? [1, 1.05, 1] : 1
            }}
            transition={{
              rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
              scale: { duration: 1, repeat: Infinity, ease: 'easeInOut' }
            }}
            className={`w-40 h-40 rounded-full flex items-center justify-center p-0.5 border-2 ${
              voiceState === 'listening' ? 'border-emerald-500/40' :
              voiceState === 'speaking' ? 'border-indigo-500/40' :
              voiceState === 'thinking' ? 'border-dashed border-purple-500/60' :
              'border-[#222222]'
            } bg-[#070707] shadow-inner relative z-10`}
          >
            {/* The main mic interactive button */}
            <button
              onClick={toggleListening}
              className={`w-32 h-32 rounded-full flex flex-col items-center justify-center shadow-lg transition-all transform hover:scale-105 active:scale-95 cursor-pointer relative overflow-hidden ${
                voiceState === 'listening' 
                  ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                  : voiceState === 'speaking'
                    ? 'bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-indigo-500/20'
                    : voiceState === 'thinking'
                      ? 'bg-[#121212] border border-purple-500/40 text-purple-400 shadow-purple-500/10'
                      : 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white shadow-purple-500/15'
              }`}
            >
              {voiceState === 'listening' ? (
                <MicOff className="w-10 h-10 animate-pulse stroke-[2.5]" />
              ) : voiceState === 'thinking' ? (
                <RefreshCw className="w-10 h-10 animate-spin stroke-[2.5]" />
              ) : voiceState === 'speaking' ? (
                <Volume2 className="w-10 h-10 animate-bounce stroke-[2.5]" />
              ) : (
                <Mic className="w-10 h-10 stroke-[2.5]" />
              )}
              
              <span className="text-[9px] font-bold uppercase tracking-wider mt-2.5 opacity-90">
                {voiceState === 'listening' ? (language === 'en' ? 'Stop' : 'إيقاف') :
                 voiceState === 'speaking' ? (language === 'en' ? 'Stop TTS' : 'إيقاف الصوت') :
                 (language === 'en' ? 'Tap to Speak' : 'اضغط للتحدث')}
              </span>
            </button>
          </motion.div>
        </div>

        {/* Dynamic Waveform Visualizer representation */}
        {renderWaveform()}

        {/* Transcription and Subtitles container */}
        <div className="w-full max-w-sm px-4 min-h-[90px] flex flex-col justify-center space-y-2.5">
          {transcript && (
            <motion.p 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-xs font-semibold leading-relaxed tracking-tight ${
                theme === 'dark' ? 'text-white/90' : 'text-zinc-800'
              }`}
            >
              <span className="text-[10px] font-bold text-indigo-400 block uppercase mb-0.5 tracking-wider font-mono">
                {language === 'en' ? 'You said:' : 'قلت أنت:'}
              </span>
              "{transcript}"
            </motion.p>
          )}

          {responseMessage && voiceState === 'speaking' && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-xs font-medium leading-relaxed tracking-tight line-clamp-3 ${
                theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'
              }`}
            >
              <span className="text-[10px] font-bold text-pink-400 block uppercase mb-0.5 tracking-wider font-mono">
                {language === 'en' ? 'Novix Response:' : 'إجابة نوفيكس:'}
              </span>
              {responseMessage}
            </motion.p>
          )}
        </div>
      </div>

      {/* Mic/browser permission tips / footer */}
      <div className={`p-4 rounded-2xl border text-center text-[10px] font-semibold leading-normal shrink-0 ${
        theme === 'dark' 
          ? 'bg-[#0A0A0A] border-[#1A1A1A] text-zinc-500' 
          : 'bg-white border-zinc-200 text-zinc-400'
      }`}>
        <p className="flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>
            {language === 'en' 
              ? "Dual Mode: Supports browser speech API & smart keyboard simulations." 
              : "الوضع المزدوج: يدعم ميزة التعرف على الصوت والأنماط التفاعلية الذكية."}
          </span>
        </p>
      </div>
    </div>
  );
}
