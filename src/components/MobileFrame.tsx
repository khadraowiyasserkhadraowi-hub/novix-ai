import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Signal, ArrowLeft, Menu } from 'lucide-react';
import { Language, Theme } from '../types';

interface MobileFrameProps {
  children: React.ReactNode;
  theme: Theme;
  language: Language;
  onToggleSidebar?: () => void;
  showMenuButton?: boolean;
}

export default function MobileFrame({
  children,
  theme,
  language,
  onToggleSidebar,
  showMenuButton = true
}: MobileFrameProps) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      setTime(`${hours}:${minutes} ${ampm}`);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const isRtl = language === 'ar';

  return (
    <div 
      className={`min-h-screen w-full flex items-center justify-center p-0 md:p-6 transition-colors duration-500 ${
        theme === 'dark' 
          ? 'bg-[#050505] text-[#E0E0E0]' 
          : 'bg-zinc-100 text-zinc-900'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Phone Wrapper Container (Framer/Mockup style for desktop, full-screen for mobile) */}
      <div 
        id="phone-container"
        className={`relative w-full h-screen md:h-[840px] md:max-w-[412px] md:rounded-[48px] overflow-hidden md:border-[10px] md:shadow-2xl flex flex-col transition-all duration-500 ${
          theme === 'dark' 
            ? 'md:border-[#1A1A1A] md:shadow-indigo-500/10 bg-[#0A0A0A]' 
            : 'md:border-zinc-300 md:shadow-zinc-300/50 bg-white'
        }`}
      >
        {/* Hardware Camera Notch / Dynamic Island (Only visible on desktop/md screens as a frame ornament) */}
        <div className="hidden md:block absolute top-3 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50 flex items-center justify-between px-4">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-800"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-blue-900"></div>
          </div>
        </div>

        {/* Status Bar */}
        <div className={`h-11 px-6 pt-1 flex items-center justify-between text-xs font-semibold select-none z-40 transition-colors duration-300 ${
          theme === 'dark' ? 'bg-[#0A0A0A] text-white/80' : 'bg-white text-zinc-700'
        }`}>
          {/* Time on left (or right if RTL) */}
          <span className="font-medium tracking-tight tabular-nums">{time}</span>
          
          {/* Center gap for notch on desktop */}
          <div className="hidden md:block w-24"></div>

          {/* Icons on right */}
          <div className="flex items-center gap-1.5">
            <Signal className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="text-[10px] tracking-tight font-bold">5G</span>
            <Wifi className="w-3.5 h-3.5 stroke-[2.5]" />
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] tracking-tight font-bold tabular-nums">98%</span>
              <Battery className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
        </div>

        {/* Screen Frame Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {children}
        </div>

        {/* Soft Home Indicator Pill */}
        <div className={`h-5 flex items-center justify-center pb-1 transition-colors duration-300 ${
          theme === 'dark' ? 'bg-[#0A0A0A]' : 'bg-white'
        }`}>
          <div className={`w-32 h-1 rounded-full ${
            theme === 'dark' ? 'bg-white/10' : 'bg-zinc-300'
          }`}></div>
        </div>
      </div>
    </div>
  );
}
