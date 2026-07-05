import React, { useState } from 'react';
import { 
  Sparkles, Image, RefreshCw, Download, Copy, Check, AlertCircle, 
  ChevronRight, ArrowLeftRight, Compass 
} from 'lucide-react';
import { translations } from '../translations';
import { Language, Theme } from '../types';

interface ImageGeneratorProps {
  language: Language;
  theme: Theme;
  onImageGenerated: (imageUrl: string) => void;
}

export default function ImageGenerator({
  language,
  theme,
  onImageGenerated
}: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const t = translations[language];
  const isRtl = language === 'ar';

  const ratios = [
    { label: '1:1 Square', value: '1:1', desc: 'Social & Icons' },
    { label: '9:16 Portrait', value: '3:4', desc: 'Mobile Story' }, // Use 3:4 or 3:2 depending on standard imagen mappings
    { label: '16:9 Wide', value: '4:3', desc: 'Landscape / Web' }  // Standard 4:3 works best as an aspect ratio support or 1:1
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);
    setGeneratedUrl(null);

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), aspectRatio })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || t.errorImage);
      }

      setGeneratedUrl(data.imageUrl);
      onImageGenerated(data.imageUrl); // Store in chat log too if active
    } catch (err: any) {
      console.error(err);
      setError(err.message || t.errorImage);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!generatedUrl) return;
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSuggestionClick = (text: string) => {
    setPrompt(text);
  };

  const creativePrompts = language === 'en' ? [
    "Cyberpunk cat wearing neon glasses, synthwave style, highly detailed 8k art",
    "A cozy wooden cabin nested in green pine forest with misty mountains at sunset",
    "A floating island with waterfalls cascading into clouds, surreal fantasy landscape",
    "Futuristic city metropolis with flying cars, holograms, architectural masterpiece"
  ] : [
    "قط سايبربانك يرتدي نظارات نيون، نمط سينث ويف، تفاصيل دقيقة للغاية بدقة 8k",
    "كوخ خشبي دافئ يقع في غابة صنوبر خضراء مع جبال ضبابية عند غروب الشمس",
    "جزيرة عائمة تسقط منها شلالات في السحاب، منظر خيالي سريالي",
    "مدينة مستقبلية عملاقة مع سيارات طائرة وصور مجسمة، تحفة معمارية"
  ];

  return (
    <div className={`flex-1 flex flex-col justify-between overflow-y-auto px-4 py-5 scrollbar-thin transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#050505]' : 'bg-zinc-50'
    }`}>
      <div className="space-y-5">
        {/* Header Title */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-extrabold bg-indigo-500/15 text-indigo-500 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.imageGenTitle}</span>
          </div>
          <h2 className="text-lg font-extrabold tracking-tight">
            {language === 'en' ? 'Create with Novix Art' : 'ابتكر مع Novix Art'}
          </h2>
          <p className={`text-xs ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
            {t.imageGenSub}
          </p>
        </div>

        {/* Generated Image Showcase Card */}
        <div className={`relative aspect-square w-full rounded-3xl overflow-hidden border flex items-center justify-center transition-all ${
          theme === 'dark' ? 'bg-[#0A0A0A] border-[#1A1A1A]' : 'bg-white border-zinc-200'
        }`}>
          {loading ? (
            /* Cool Creative loading reveal */
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 px-4 text-center">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-indigo-500 animate-spin absolute" />
                <div className="absolute inset-0 border-2 border-dashed border-indigo-500/40 rounded-full animate-ping"></div>
              </div>
              <p className="text-xs font-bold text-indigo-500 animate-pulse">{t.generating}</p>
              <p className={`text-[10px] opacity-60 leading-relaxed max-w-[240px] ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {language === 'en' ? 'Rendering fine details and styling...' : 'جاري معالجة التفاصيل الدقيقة والنمط الفني...'}
              </p>
            </div>
          ) : generatedUrl ? (
            /* Successful Art Result */
            <div className="absolute inset-0 group">
              <img 
                src={generatedUrl} 
                alt="AI generated creation" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                referrerPolicy="no-referrer"
              />
              
              {/* Overlay controls */}
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex items-center justify-between opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-[10px] text-zinc-300 font-medium truncate max-w-[50%]">
                  {prompt}
                </span>

                <div className="flex gap-1.5 shrink-0">
                  <button 
                    onClick={handleCopyLink}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all cursor-pointer"
                    title="Copy Image URL"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  <a 
                    href={generatedUrl} 
                    download={`novix-ai-art-${Date.now()}.jpg`}
                    className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all flex items-center justify-center"
                    title={t.download}
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            /* Placeholder state */
            <div className="text-center p-6 flex flex-col items-center justify-center space-y-2.5 opacity-60">
              <div className={`p-4 rounded-full ${theme === 'dark' ? 'bg-[#121212] text-zinc-500 border border-[#1A1A1A]' : 'bg-zinc-100 text-zinc-400'}`}>
                <Image className="w-8 h-8 stroke-[1.5]" />
              </div>
              <p className="text-xs font-bold">
                {language === 'en' ? 'Your Creation Area' : 'مساحة الابتكار الخاصة بك'}
              </p>
              <p className={`text-[10px] max-w-[220px] leading-relaxed ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {language === 'en' ? 'Describe your masterpiece below to paint with artificial intelligence' : 'صف تحفتك الفنية في الأسفل للرسم بالذكاء الاصطناعي'}
              </p>
            </div>
          )}
        </div>

        {/* Error reporting */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-start gap-2.5 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">{t.errorImage}</p>
              <p className="opacity-75 text-[10px]">{error}</p>
            </div>
          </div>
        )}

        {/* Interactive Text Input and Controls */}
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold opacity-80">{language === 'en' ? 'Prompt Description' : 'وصف الصورة'}</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t.typePrompt}
              rows={3}
              required
              className={`w-full px-4 py-3 rounded-2xl text-xs font-semibold leading-relaxed border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none ${
                theme === 'dark' 
                  ? 'bg-[#0A0A0A] border-[#1A1A1A] text-white placeholder-[#666666]' 
                  : 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400'
              }`}
            />
          </div>

          {/* Quick Ideas Grid */}
          {!prompt && (
            <div className="space-y-1.5">
              <span className={`text-[10px] font-bold tracking-wide uppercase flex items-center gap-1 opacity-55 ${
                isRtl ? 'flex-row-reverse' : ''
              }`}>
                <Compass className="w-3.5 h-3.5 text-indigo-500" />
                <span>{language === 'en' ? 'Inspire Me' : 'أفكار ملهمة'}</span>
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x">
                {creativePrompts.map((idea, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSuggestionClick(idea)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold shrink-0 max-w-[200px] truncate border cursor-pointer ${
                      theme === 'dark' 
                        ? 'bg-[#0A0A0A] border-[#1A1A1A] text-zinc-400 hover:bg-[#121212] hover:text-white' 
                        : 'bg-zinc-100 border-zinc-200/60 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    {idea}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Ratio Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold opacity-80">{t.aspectRatio}</label>
            <div className="grid grid-cols-3 gap-2">
              {ratios.map((r) => {
                const isSelected = aspectRatio === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setAspectRatio(r.value)}
                    className={`py-2 px-1.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-0.5 ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10'
                        : (theme === 'dark' ? 'bg-[#0A0A0A] border-[#1A1A1A] text-zinc-400 hover:bg-[#121212] hover:text-white' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50')
                    }`}
                  >
                    <span className="text-[10px] font-extrabold">{r.value}</span>
                    <span className={`text-[8px] truncate max-w-full font-medium ${isSelected ? 'text-indigo-100' : 'opacity-60'}`}>{r.label.split(' ')[1]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Trigger button */}
          <button
            type="submit"
            disabled={!prompt.trim() || loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/15 hover:shadow-indigo-600/35 active:scale-98 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{t.generate}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
