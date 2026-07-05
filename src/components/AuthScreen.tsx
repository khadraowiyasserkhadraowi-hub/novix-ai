import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInAnonymously,
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth } from '../firebase';
import { translations } from '../translations';
import { Language, Theme } from '../types';
import { Globe, Moon, Sun, KeyRound, Mail, Sparkles, User, AlertCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const novixLogo = '/src/assets/images/novix_app_icon_1783185001834.jpg';

interface AuthScreenProps {
  language: Language;
  theme: Theme;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  onAuthSuccess: () => void;
}

export default function AuthScreen({
  language,
  theme,
  setLanguage,
  setTheme,
  onAuthSuccess
}: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const t = translations[language];
  const isRtl = language === 'ar';

  const validateEmail = (emailStr: string) => {
    return /\S+@\S+\.\S+/.test(emailStr);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email || !password) {
      setError(language === 'en' ? 'Please fill in all fields.' : 'يرجى ملء جميع الحقول.');
      return;
    }

    if (!validateEmail(email)) {
      setError(t.invalidEmail);
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onAuthSuccess();
    } catch (err: any) {
      console.error(err);
      let errorMsg = err.message;
      if (err.code === 'auth/email-already-in-use') {
        errorMsg = language === 'en' ? 'This email is already registered.' : 'هذا البريد الإلكتروني مسجل بالفعل.';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        errorMsg = language === 'en' ? 'Incorrect email or password.' : 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
      } else if (err.code === 'auth/weak-password') {
        errorMsg = language === 'en' ? 'Password should be at least 6 characters.' : 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.';
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError(language === 'en' ? 'Please enter your email address.' : 'يرجى إدخال البريد الإلكتروني.');
      return;
    }

    if (!validateEmail(email)) {
      setError(t.invalidEmail);
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage(t.resetEmailSent);
      setTimeout(() => setIsForgotPassword(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await signInAnonymously(auth);
      onAuthSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex-1 flex flex-col justify-between px-6 py-8 transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#0A0A0A] text-[#E0E0E0]' : 'bg-white text-zinc-900'
    }`}>
      {/* Top Header Control Bar */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            theme === 'dark' 
              ? 'border-[#222222] bg-[#121212] hover:bg-[#1C1C1C] text-white/90' 
              : 'border-zinc-200 bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{language === 'en' ? 'العربية' : 'English'}</span>
        </button>

        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={`p-2 rounded-full border transition-all ${
            theme === 'dark' 
              ? 'border-[#222222] bg-[#121212] hover:bg-[#1C1C1C] text-white/90' 
              : 'border-zinc-200 bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
          }`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>
      </div>

      {/* Main Brand & Logo */}
      <div className="flex flex-col items-center justify-center my-6 text-center">
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl shadow-xl mb-4">
          {/* Glowing Aura backdrop */}
          <div className="absolute -inset-0.5 bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 rounded-2xl blur opacity-30 animate-pulse"></div>
          
          {/* Real App Icon */}
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-zinc-800/10">
            <img 
              src={novixLogo} 
              alt="Novix AI App Icon" 
              className="w-full h-full object-cover select-none"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent font-sans">
          {t.appName}
        </h1>
        <p className={`text-xs mt-1 font-medium ${theme === 'dark' ? 'text-[#A0A0A0]' : 'text-zinc-500'}`}>
          {t.tagline}
        </p>
      </div>

      {/* Forms and inputs card */}
      <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto">
        <AnimatePresence mode="wait">
          {!isForgotPassword ? (
            <motion.form 
              key="login-signup-form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleAuth} 
              className="space-y-4"
            >
              {/* Heading */}
              <div className="text-center mb-2">
                <h2 className="text-xl font-bold">
                  {isSignUp ? t.signUp : t.login}
                </h2>
              </div>

              {/* Status/Errors Alert */}
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-start gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-1">
                <label className="text-xs font-semibold opacity-75">{t.email}</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 w-4 h-4 opacity-50" />
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                      theme === 'dark' 
                        ? 'bg-[#121212] border-[#222222] text-[#E0E0E0] placeholder-[#666666]' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400'
                    }`}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold opacity-75">{t.password}</label>
                  {!isSignUp && (
                    <button 
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-xs font-semibold text-indigo-400 hover:underline"
                    >
                      {t.forgotPassword}
                    </button>
                  )}
                </div>
                <div className="relative flex items-center">
                  <KeyRound className="absolute left-3 w-4 h-4 opacity-50" />
                  <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                      theme === 'dark' 
                        ? 'bg-[#121212] border-[#222222] text-[#E0E0E0] placeholder-[#666666]' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400'
                    }`}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>{isSignUp ? t.signUpBtn : t.loginBtn}</span>
                    <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>
            </motion.form>
          ) : (
            <motion.form 
              key="forgot-password-form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleForgotPassword} 
              className="space-y-4"
            >
              <div className="text-center">
                <h2 className="text-xl font-bold">{t.forgotPassword}</h2>
                <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-[#A0A0A0]' : 'text-zinc-500'}`}>
                  {language === 'en' ? 'Enter your email to receive a password reset link' : 'أدخل بريدك الإلكتروني لتلقي رابط إعادة تعيين كلمة المرور'}
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-start gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {message && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-start gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{message}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold opacity-75">{t.email}</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 w-4 h-4 opacity-50" />
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                      theme === 'dark' 
                        ? 'bg-[#121212] border-[#222222] text-[#E0E0E0] placeholder-[#666666]' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400'
                    }`}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <span>{language === 'en' ? 'Send Link' : 'إرسال الرابط'}</span>
                  )}
                </button>

                <button 
                  type="button"
                  onClick={() => setIsForgotPassword(false)}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    theme === 'dark' 
                      ? 'border-[#222222] bg-[#121212] hover:bg-[#1C1C1C] text-white/90' 
                      : 'border-zinc-200 bg-zinc-100/50 hover:bg-zinc-100 text-zinc-600'
                  }`}
                >
                  {t.back}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Auth Mode Toggle */}
        {!isForgotPassword && (
          <div className="text-center mt-6 text-xs">
            <span className="opacity-70">{isSignUp ? t.alreadyHaveAccount : t.dontHaveAccount}</span>{' '}
            <button 
              type="button" 
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-bold text-indigo-400 hover:underline cursor-pointer"
            >
              {isSignUp ? t.login : t.signUp}
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-[#222222]"></div>
          <span className="flex-shrink mx-4 text-[10px] font-bold opacity-30 tracking-wider uppercase">
            {language === 'en' ? 'or' : 'أو'}
          </span>
          <div className="flex-grow border-t border-[#222222]"></div>
        </div>

        {/* Guest Mode Option */}
        <button 
          onClick={handleGuestSignIn}
          disabled={loading}
          className={`w-full py-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
            theme === 'dark' 
              ? 'border-[#222222] bg-[#121212] hover:bg-[#1C1C1C] text-white/90' 
              : 'border-zinc-200 bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>{t.guestMode}</span>
        </button>
      </div>

      {/* Footer Branding */}
      <div className="text-center text-[10px] opacity-40 font-mono tracking-widest mt-4 uppercase">
        © 2026 Novix Lab
      </div>
    </div>
  );
}
