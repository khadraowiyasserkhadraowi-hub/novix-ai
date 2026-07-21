import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Sparkles, Copy, Check, Volume2, VolumeX, Mic,
  MessageSquare, User, Brain, AlertCircle, RefreshCw,
  Paperclip, X, Image as ImageIcon, Wand2, ArrowDown
} from 'lucide-react';
import { translations } from '../translations';
import { Language, Theme, Message } from '../types';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
interface ChatInterfaceProps {
  language: Language;
  theme: Theme;
  messages: Message[];
  onSendMessage: (content: string, image?: string, mode?: 'chat' | 'draw') => void;
  isLoading: boolean;
  error: string | null;
  onClearChat?: () => void;
}

export default function ChatInterface({
  language,
  theme,
  messages,
  onSendMessage,
  isLoading,
  error,
  onClearChat
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [chatMode, setChatMode] = useState<'chat' | 'draw'>('chat');
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const t = translations[language];
  const isRtl = language === 'ar';

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;  
 }
  }, []);

  // Monitor scroll to show floating scroll-down button
  const handleScroll = () => {
    if (!listContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = listContainerRef.current;
    // Show button if user has scrolled up more than 300px
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 300;
    setShowScrollBtn(isScrolledUp);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    // Call the callback with prompt, attached base64 image (if any), and active mode ('chat' or 'draw')
    onSendMessage(input.trim(), selectedImage || undefined, chatMode);
    
    // Clear inputs
    setInput('');
    setSelectedImage(null);
  };

  const handleSuggestionClick = (prompt: string) => {
    if (isLoading) return;
    onSendMessage(prompt, undefined, chatMode);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (text: string, id: string) => {
    if (!synthRef.current) return;

    if (speakingId === id) {
      synthRef.current.cancel();
      setSpeakingId(null);
      return;
    }

    synthRef.current.cancel(); // Stop any current speech
    
    // Clean markdown characters for better TTS speech
    const cleanText = text.replace(/[\*#_`\-\[\]]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'ar' ? 'ar-SA' : 'en-US';
    
    utterance.onend = () => {
      setSpeakingId(null);
    };

    utterance.onerror = () => {
      setSpeakingId(null);
    };

    setSpeakingId(id);
    synthRef.current.speak(utterance);
  };

  // Handling file uploads for image analysis
  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert(language === 'en' ? 'Image is too large. Max size 8MB.' : 'حجم الصورة كبير جداً. الحد الأقصى 8 ميجابايت.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Simulating speech recognition/voice input
  const handleVoiceInput = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    setIsListening(true);
    
    // Simulate smart audio listening
    const simulatedPhrasesEn = [
      "Tell me a fun fact about space",
      "Write a short motivational poem",
      "How does artificial intelligence work?",
      "Give me a creative name for my cat"
    ];
    
    const simulatedPhrasesAr = [
      "أخبرني بمعلومة ممتعة عن الفضاء",
      "اكتب لي قصيدة قصيرة محفزة",
      "كيف يعمل الذكاء الاصطناعي؟",
      "اقترح علي اسم قطة لطيف"
    ];

    const phrases = language === 'en' ? simulatedPhrasesEn : simulatedPhrasesAr;
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];

    setTimeout(() => {
      if (isListening) {
        // Incrementally type the voice prompt
        let currentText = "";
        let index = 0;
        const interval = setInterval(() => {
          if (index < randomPhrase.length) {
            currentText += randomPhrase[index];
            setInput(currentText);
            index++;
          } else {
            clearInterval(interval);
            setIsListening(false);
          }
        }, 30);
      }
    }, 2000);
  };

  // Context-specific Suggestions
  const chatSuggestions = language === 'en' ? [
    { label: "💡 Smart Explainer", prompt: "Explain quantum computing in simple terms" },
    { label: "✍️ Professional Email", prompt: "Write a polite email asking for sick leave" },
    { label: "🍳 Recipe Helper", prompt: "Give me ideas for a healthy high-protein breakfast" },
    { label: "💻 Code Refactor", prompt: "Show me a clean TypeScript debounce utility function" }
  ] : [
    { label: "💡 شرح مبسط", prompt: "اشرح لي الحوسبة الكمية بأسلوب بسيط جداً" },
    { label: "✍️ كتابة بريد", prompt: "اكتب مسودة بريد إلكتروني مهذب لطلب إجازة مرضية" },
    { label: "🍳 فطور صحي", prompt: "اقترح أفكاراً لوجبة فطور صحية وعالية البروتين" },
    { label: "💻 تحسين الأكواد", prompt: "أظهر لي كود TypeScript نظيف لتأخير تنفيذ الدوال debounce" }
  ];

  const drawSuggestions = language === 'en' ? [
    { label: "🐱 Cyberpunk Kitty", prompt: "Cyberpunk cat wearing neon glasses, synthwave style, highly detailed 8k art" },
    { label: "🏔️ Serene Cabin", prompt: "A cozy wooden cabin nested in green pine forest with misty mountains at sunset" },
    { label: "🌌 Floating Oasis", prompt: "A floating island with waterfalls cascading into clouds, surreal fantasy landscape" },
    { label: "🚀 Future Tokyo", prompt: "Futuristic city metropolis with flying cars, holograms, architectural masterpiece" }
  ] : [
    { label: "🐱 قطة نيون", prompt: "قط سايبربانك يرتدي نظارات نيون، نمط سينث ويف، تفاصيل دقيقة للغاية بدقة 8k" },
    { label: "🏔️ كوخ الغروب", prompt: "كوخ خشبي دافئ يقع في غابة صنوبر خضراء مع جبال ضبابية عند غروب الشمس" },
    { label: "🌌 جزيرة خيالية", prompt: "جزيرة عائمة تسقط منها شلالات في السحاب، منظر خيالي سريالي" },
    { label: "🚀 طوكيو المستقبل", prompt: "مدينة مستقبلية عملاقة مع سيارات طائرة وصور مجسمة، تحفة معمارية" }
  ];

  const suggestions = chatMode === 'chat' ? chatSuggestions : drawSuggestions;

  return (
    <div className={`flex-1 flex flex-col justify-between overflow-hidden relative ${
      theme === 'dark' ? 'bg-[#050505]' : 'bg-zinc-50'
    }`}>
      
      {/* Invisible file input */}
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleImageChange}
        accept="image/*"
        className="hidden"
      />

      {/* Mode Selector Pill Group */}
      <div className={`flex items-center justify-center p-2 border-b shrink-0 transition-colors duration-300 ${
        theme === 'dark' ? 'border-[#1A1A1A] bg-[#080808]/80' : 'border-zinc-200 bg-white/80'
      } backdrop-blur-md z-10`}>
        <div className={`flex gap-1 p-1 rounded-xl ${theme === 'dark' ? 'bg-zinc-900/60' : 'bg-zinc-100'}`}>
          <button
            type="button"
            onClick={() => setChatMode('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              chatMode === 'chat'
                ? 'bg-indigo-600 text-white shadow-sm'
                : `text-zinc-500 hover:text-indigo-400`
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Smart Assistant' : 'المساعد الذكي'}</span>
          </button>
          <button
            type="button"
            onClick={() => setChatMode('draw')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              chatMode === 'draw'
                ? 'bg-purple-600 text-white shadow-sm'
                : `text-zinc-500 hover:text-purple-400`
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Generate Art' : 'لوحة فنية'}</span>
          </button>
        </div>
      </div>

      {/* Messages Window Container */}
      <div 
        ref={listContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scroll-smooth relative"
      >
        {messages.length === 0 ? (
          /* Landing screen / Suggestions view */
          <div className="h-full flex flex-col items-center justify-center py-6">
            <div className="flex flex-col items-center text-center max-w-xs space-y-3 mb-6">
              <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-md">
                {chatMode === 'chat' ? (
                  <Brain className="w-6 h-6 text-white stroke-[2]" />
                ) : (
                  <Sparkles className="w-6 h-6 text-white stroke-[2]" />
                )}
              </div>
              <h2 className="text-xl font-extrabold tracking-tight mt-2">
                {chatMode === 'chat' ? t.welcomeTitle : (language === 'en' ? 'What should I paint today?' : 'ماذا تريد أن أرسم اليوم؟')}
              </h2>
              <p className={`text-xs font-semibold ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {chatMode === 'chat' ? t.welcomeSubtitle : (language === 'en' ? 'Powered by Novix Art Engine' : 'مدعوم بنظام Novix الفني')}
              </p>
            </div>

            {/* Suggestions Grid */}
            <div className="grid grid-cols-2 gap-2.5 w-full max-w-sm px-2">
              {suggestions.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(sug.prompt)}
                  className={`p-3.5 rounded-2xl text-left border text-xs font-bold leading-relaxed transition-all cursor-pointer flex flex-col justify-between h-[110px] hover:scale-101 active:scale-99 ${
                    isRtl ? 'text-right' : 'text-left'
                  } ${
                    theme === 'dark' 
                      ? 'bg-[#0A0A0A] border-[#1A1A1A] hover:bg-[#121212] hover:border-[#222222] text-[#E0E0E0] hover:text-white' 
                      : 'bg-white border-zinc-200/80 hover:bg-zinc-100 hover:border-zinc-300 text-zinc-700 hover:text-zinc-900'
                  }`}
                >
                  <span className="opacity-95">{sug.label}</span>
                  <span className={`text-[10px] font-medium mt-1 line-clamp-2 w-full ${theme === 'dark' ? 'text-[#666666]' : 'text-zinc-400'}`}>
                    {sug.prompt}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Actual Message Bubble List */
          <div className="space-y-4 pt-1">
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              const isLastActiveAssistant = !isUser && idx === messages.length - 1 && isLoading;
              return (
                <div 
                  key={msg.id} 
                  className={`flex gap-3 max-w-[88%] ${
                    isUser 
                      ? (isRtl ? 'mr-auto flex-row-reverse' : 'ml-auto flex-row-reverse') 
                      : (isRtl ? 'ml-auto' : 'mr-auto')
                  }`}
                >
                  {/* Sender Avatar */}
                  <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-bold text-xs ${
                    isUser 
                      ? 'bg-gradient-to-tr from-indigo-500 to-purple-600 text-white' 
                      : (theme === 'dark' ? 'bg-[#0A0A0A] text-indigo-400 border border-[#1A1A1A]' : 'bg-white text-indigo-600 border border-zinc-200')
                  }`}>
                    {isUser ? <User className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble Column */}
                  <div className="flex flex-col space-y-1.5 w-full">
                    <div className={`p-3.5 rounded-2xl text-xs font-medium leading-relaxed shadow-xs transition-colors duration-300 overflow-hidden ${
                      isUser 
                        ? 'bg-indigo-600 text-white rounded-br-none' 
                        : (theme === 'dark' ? 'bg-[#0A0A0A] text-[#E0E0E0] border border-[#1A1A1A] rounded-bl-none' : 'bg-white text-zinc-950 border border-zinc-200/80 rounded-bl-none')
                    }`}>
                      
                      {/* Attached/Uploaded multimodal image rendering */}
                      {msg.image && (
                        <div className="mb-2 max-w-sm rounded-lg overflow-hidden border border-zinc-200/10 shadow-sm">
                          <img 
                            src={msg.image} 
                            alt="Uploaded query context" 
                            className="max-h-[200px] w-full object-cover rounded-lg"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      {msg.type === 'image' ? (
                        <div className="space-y-2">
                          <img 
                            src={msg.content} 
                            alt="AI generated art" 
                            className="rounded-xl w-full object-cover max-h-[280px] shadow-md cursor-pointer hover:scale-[1.01] transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="markdown-body select-text">
                          <ReactMarkdown
                            components={{
                              code({ className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || '');
                                const codeText = String(children).replace(/\n$/, '');
                                return match ? (
                                  <div className="my-2.5 rounded-xl overflow-hidden border border-zinc-800 bg-[#0A0A0A] text-zinc-100 font-mono text-xs shadow-lg">
                                    <div className="flex items-center justify-between px-3.5 py-2 bg-[#121212] border-b border-zinc-800 text-[10px] font-bold text-zinc-400">
                                      <span className="uppercase tracking-wider">{match[1]}</span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigator.clipboard.writeText(codeText);
                                        }}
                                        className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                                      >
                                        <Copy className="w-3 h-3" />
                                        <span>{language === 'en' ? 'Copy' : 'نسخ'}</span>
                                      </button>
                                    </div>
                                    <pre className="p-3.5 overflow-x-auto scrollbar-thin text-left leading-relaxed">
                                      <code className={className} {...props}>
                                        {children}
                                      </code>
                                    </pre>
                                  </div>
                                ) : (
                                  <code className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 font-mono text-[11px]" {...props}>
                                    {children}
                                  </code>
                                );
                              }
                            }}
                          >
                         <ReactMarkdownrehypePlugins={[rehypeRaw]}>
   {msg.content}
          
               </ReactMarkdown>
                          {isLastActiveAssistant && (
                            <span className="inline-block w-1.5 h-3.5 bg-indigo-400 ml-1 rounded-sm animate-pulse" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quick utility controls underneath model messages (copy, voice reading) */}
                    {!isUser && msg.type === 'text' && (
                      <div className={`flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity justify-end ${
                        isRtl ? 'flex-row-reverse' : 'flex-row'
                      }`}>
                        <button 
                          onClick={() => handleCopy(msg.content, msg.id)}
                          title={t.copy}
                          className={`p-1 rounded-md transition-colors ${
                            theme === 'dark' ? 'hover:bg-[#121212] text-zinc-500 hover:text-white' : 'hover:bg-zinc-100 text-zinc-500'
                          }`}
                        >
                          {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>

                        <button 
                          onClick={() => handleSpeak(msg.content, msg.id)}
                          className={`p-1 rounded-md transition-colors ${
                            theme === 'dark' ? 'hover:bg-[#121212] text-zinc-500 hover:text-white' : 'hover:bg-zinc-100 text-zinc-500'
                          }`}
                        >
                          {speakingId === msg.id ? (
                            <VolumeX className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Gemini Thinking Animation */}
            {isLoading && messages[messages.length - 1].role !== 'assistant' && (
              <div className={`flex gap-3 max-w-[85%] ${isRtl ? 'ml-auto' : 'mr-auto'}`}>
                <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-bold text-xs ${
                  theme === 'dark' ? 'bg-[#0A0A0A] text-indigo-400 border border-[#1A1A1A]' : 'bg-white text-indigo-600 border border-zinc-200'
                }`}>
                  <Brain className="w-4 h-4 animate-pulse" />
                </div>
                <div className="flex flex-col space-y-1">
                  <div className={`p-3.5 rounded-2xl rounded-bl-none text-xs flex items-center gap-2 ${
                    theme === 'dark' ? 'bg-[#0A0A0A]/60 text-zinc-400 border border-[#1A1A1A]' : 'bg-white text-zinc-500 border border-zinc-200/80'
                  }`}>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                    <span className="font-semibold">
                      {chatMode === 'draw' 
                        ? (language === 'en' ? 'Painting your canvas...' : 'جاري رسم لوحتك الفنية...')
                        : t.thinking}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Error messaging inside log */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-start gap-2.5 text-xs max-w-sm mx-auto">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">{t.errorChat}</p>
                  <p className="opacity-75 text-[10px]">{error}</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Floating Scroll to Bottom trigger */}
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-28 right-6 p-2 rounded-full shadow-lg bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer z-10"
        >
          <ArrowDown className="w-4 h-4 animate-bounce" />
        </button>
      )}

      {/* Mic listening overlay */}
      {isListening && (
        <div className="absolute inset-0 bg-indigo-950/25 backdrop-blur-xs flex flex-col items-center justify-center z-20 space-y-3">
          <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg relative">
            <div className="absolute inset-0 rounded-full bg-indigo-600/30 animate-ping"></div>
            <Mic className="w-8 h-8 text-white" />
          </div>
          <p className="text-white text-xs font-bold tracking-wide drop-shadow-md">
            {language === 'en' ? 'Listening...' : 'جاري الاستماع...'}
          </p>
        </div>
      )}

      {/* Uploaded Base64 Image Preview Bar */}
      {selectedImage && (
        <div className={`px-4 py-2 border-t flex items-center gap-3 shrink-0 relative ${
          theme === 'dark' ? 'bg-[#0D0D0D] border-[#1A1A1A]' : 'bg-zinc-100 border-zinc-200'
        }`}>
          <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-zinc-700">
            <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/60 text-white hover:bg-red-600 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="text-[10px] text-zinc-500 font-semibold">
            {language === 'en' ? 'Image loaded. Send a prompt to analyze.' : 'تم تحميل الصورة. أرسل استفسارك لتحليلها.'}
          </div>
        </div>
      )}

      {/* Input Form Box */}
      <div className={`p-3.5 border-t transition-colors duration-300 shrink-0 ${
        theme === 'dark' ? 'bg-[#0A0A0A] border-[#1A1A1A]' : 'bg-white border-zinc-200'
      }`}>
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          
          {/* File attachment upload button - Hidden when generating images direct */}
          {chatMode === 'chat' && (
            <button
              type="button"
              onClick={handleImageUploadClick}
              title={language === 'en' ? 'Upload Image' : 'تحميل صورة'}
              className={`p-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                theme === 'dark' 
                  ? 'border-[#1A1A1A] bg-[#0A0A0A] hover:bg-[#121212] text-[#E0E0E0] hover:text-indigo-400' 
                  : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-500 hover:text-indigo-600'
              }`}
            >
              <Paperclip className="w-4 h-4" />
            </button>
          )}

          {/* Microphone Sim button */}
          <button
            type="button"
            onClick={handleVoiceInput}
            className={`p-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
              theme === 'dark' 
                ? 'border-[#1A1A1A] bg-[#0A0A0A] hover:bg-[#121212] text-[#E0E0E0] hover:text-indigo-400' 
                : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-500 hover:text-indigo-600'
            }`}
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Typing Input */}
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={chatMode === 'chat' ? t.typeMessage : t.typePrompt}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold border focus:outline-none focus:ring-2 transition-all ${
              theme === 'dark' 
                ? 'bg-[#050505] border-[#1A1A1A] text-white placeholder-[#666666] focus:ring-indigo-500' 
                : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:ring-indigo-500'
            }`}
          />

          {/* Send Trigger */}
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`p-2.5 rounded-xl text-white flex items-center justify-center transition-all cursor-pointer ${
              input.trim() && !isLoading
                ? (chatMode === 'chat' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20' : 'bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/20') + ' active:scale-95'
                : 'bg-zinc-400 opacity-40 cursor-not-allowed'
            }`}
          >
            {chatMode === 'chat' ? (
              <Send className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
            ) : (
              <Wand2 className="w-4 h-4 animate-pulse" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
