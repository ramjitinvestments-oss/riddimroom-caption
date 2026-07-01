import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RiddimLogo } from './RiddimLogo';
import { Mail, Lock, User, ArrowRight, RefreshCw, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

interface LoginPageProps {
  onGoogleLogin: () => Promise<void>;
  onEmailAuth: (
    mode: 'login' | 'signup',
    email: string,
    password: string,
    displayName?: string
  ) => Promise<void>;
  onForgotPassword: (email: string) => Promise<void>;
  authModalError: string | null;
  setAuthModalError: (err: string | null) => void;
  isSubmittingAuth: boolean;
  rememberMe: boolean;
  setRememberMe: (val: boolean) => void;
}

export function LoginPage({
  onGoogleLogin,
  onEmailAuth,
  onForgotPassword,
  authModalError,
  setAuthModalError,
  isSubmittingAuth,
  rememberMe,
  setRememberMe
}: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthModalError(null);
    setForgotSuccess(null);

    try {
      if (mode === 'login') {
        if (!email || !password) {
          setAuthModalError('Please fill in all email and password fields.');
          return;
        }
        await onEmailAuth('login', email, password);
      } else if (mode === 'signup') {
        if (!email || !password || !displayName) {
          setAuthModalError('Please fill in your name, email, and password.');
          return;
        }
        if (password.length < 6) {
          setAuthModalError('Password must be at least 6 characters.');
          return;
        }
        await onEmailAuth('signup', email, password, displayName);
      } else if (mode === 'forgot') {
        if (!email) {
          setAuthModalError('Please enter your email address to reset password.');
          return;
        }
        await onForgotPassword(email);
        setForgotSuccess('A password reset link has been dispatched to your email inbox.');
      }
    } catch (err: any) {
      setAuthModalError(err.message || 'An authentication error occurred.');
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] flex flex-col items-center justify-center p-4 relative overflow-hidden select-none font-sans">
      {/* Decorative radial gradients for visual depth */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-[440px] z-10 space-y-6">
        {/* Logo and Branding Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="relative cursor-pointer hover:scale-105 active:scale-95 transition-transform"
          >
            <RiddimLogo size={120} />
          </motion.div>
          <motion.div
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="space-y-1 pt-1"
          >
            <h1 className="text-3xl font-black bg-gradient-to-r from-[#10B981] via-[#FBBF24] to-[#EF4444] bg-clip-text text-transparent tracking-tighter uppercase italic">
              Riddimroom Caption
            </h1>
            <p className="text-xs text-white/40 max-w-xs mx-auto">
              Secure administrative operations, dynamic speech synchronizer & animated subtitles
            </p>
          </motion.div>
        </div>

        {/* Auth Card Container */}
        <motion.div
          initial={{ y: 25, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-[#0e0e13]/95 border border-white/5 shadow-2xl rounded-2xl p-6 sm:p-8 backdrop-blur-xl relative"
        >
          {/* Form Header */}
          <div className="mb-6">
            <h2 className="text-lg font-extrabold text-white tracking-tight">
              {mode === 'login' && 'Sign In'}
              {mode === 'signup' && 'Create Your Account'}
              {mode === 'forgot' && 'Reset Password'}
            </h2>
            <p className="text-xs text-white/50 mt-1">
              {mode === 'login' && 'Access the vibrant subtitles creator platform.'}
              {mode === 'signup' && 'Register to level up your promo clips & shorts.'}
              {mode === 'forgot' && 'Enter your registered email to get a restore link.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error & Success Messages */}
            <AnimatePresence mode="wait">
              {authModalError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{authModalError}</span>
                </motion.div>
              )}

              {forgotSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-start gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{forgotSuccess}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-3">
              {/* Display Name Field (Signup Mode Only) */}
              {mode === 'signup' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramjit Investments"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#14141a] border border-white/10 rounded-xl text-xs text-white placeholder-white/20 outline-none focus:border-emerald-500 transition-all pl-10"
                    />
                    <User className="w-4 h-4 text-white/30 absolute left-3.5 top-3" />
                  </div>
                </div>
              )}

              {/* Email Address Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="e.g. name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#14141a] border border-white/10 rounded-xl text-xs text-white placeholder-white/20 outline-none focus:border-emerald-500 transition-all pl-10"
                  />
                  <Mail className="w-4 h-4 text-white/30 absolute left-3.5 top-3" />
                </div>
              </div>

              {/* Password Field (Except Forgot Mode) */}
              {mode !== 'forgot' && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Password</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setAuthModalError(null);
                        }}
                        className="text-[10px] font-bold text-[#FBBF24] hover:underline"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder={mode === 'signup' ? 'Minimum 6 characters' : 'Enter password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#14141a] border border-white/10 rounded-xl text-xs text-white placeholder-white/20 outline-none focus:border-emerald-500 transition-all pl-10"
                    />
                    <Lock className="w-4 h-4 text-white/30 absolute left-3.5 top-3" />
                  </div>
                </div>
              )}
            </div>

            {/* Remember Me Toggle */}
            {mode === 'login' && (
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-[#14141a] border-white/10 text-emerald-500 focus:ring-0 focus:ring-offset-0 transition-all cursor-pointer"
                  />
                  <span className="text-[11px] font-semibold text-white/50 hover:text-white/80 transition-colors">
                    Remember my credentials
                  </span>
                </label>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmittingAuth}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
              >
                {isSubmittingAuth ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <span>
                      {mode === 'login' && 'Sign In With Email'}
                      {mode === 'signup' && 'Register Account'}
                      {mode === 'forgot' && 'Send Reset Instructions'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Third-Party Integrations Separator */}
          {mode !== 'forgot' && (
            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-white/5"></div>
              <span className="flex-shrink mx-3 text-[10px] font-bold text-white/25 uppercase tracking-wider">
                Or Continue With
              </span>
              <div className="flex-grow border-t border-white/5"></div>
            </div>
          )}

          {/* Google Sign-In Trigger */}
          {mode !== 'forgot' && (
            <button
              onClick={onGoogleLogin}
              disabled={isSubmittingAuth}
              type="button"
              className="w-full py-2.5 px-4 bg-[#14141a] hover:bg-[#1a1a24] text-white/80 hover:text-white font-bold text-xs rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          )}

          {/* Toggle Form Mode links */}
          <div className="mt-6 text-center text-xs">
            {mode === 'login' && (
              <p className="text-white/40">
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    setMode('signup');
                    setAuthModalError(null);
                  }}
                  className="font-bold text-emerald-400 hover:underline cursor-pointer"
                >
                  Create Account
                </button>
              </p>
            )}

            {mode === 'signup' && (
              <p className="text-white/40">
                Already registered?{' '}
                <button
                  onClick={() => {
                    setMode('login');
                    setAuthModalError(null);
                  }}
                  className="font-bold text-emerald-400 hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            )}

            {mode === 'forgot' && (
              <p className="text-white/40">
                Remember your password?{' '}
                <button
                  onClick={() => {
                    setMode('login');
                    setAuthModalError(null);
                  }}
                  className="font-bold text-emerald-400 hover:underline cursor-pointer"
                >
                  Return to Sign In
                </button>
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
