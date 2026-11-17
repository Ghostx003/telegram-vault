import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Phone, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  RefreshCw,
  Key
} from 'lucide-react';

export function AuthModal({ 
  isOpen, 
  onClose, 
  authStatus, 
  step, 
  setStep, 
  sendCode, 
  verifyCode, 
  verifyPassword, 
  logout, 
  actionLoading, 
  error,
  onStartSync 
}) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  if (!isOpen) return null;

  const handleSendCode = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!phoneNumber.trim()) {
      setLocalError('Please enter your phone number with country code (e.g. +1234567890)');
      return;
    }
    try {
      await sendCode(phoneNumber);
    } catch (err) {
      setLocalError(err.message);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!code.trim()) {
      setLocalError('Please enter the code sent to your Telegram app');
      return;
    }
    try {
      await verifyCode(code);
    } catch (err) {
      setLocalError(err.message);
    }
  };

  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!password.trim()) {
      setLocalError('Please enter your Two-Step Verification password');
      return;
    }
    try {
      await verifyPassword(password);
    } catch (err) {
      setLocalError(err.message);
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out of your Telegram session?')) {
      await logout();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-950/40">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Telegram Authentication</h2>
            <p className="text-xs text-neutral-400">Official Telegram Account Login</p>
          </div>
        </div>

        {/* Error notification */}
        {(error || localError) && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{localError || error}</span>
          </div>
        )}

        {/* Step: Authenticated */}
        {authStatus?.authenticated ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-neutral-950/80 border border-emerald-500/30 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">Authenticated with Telegram</p>
                <p className="text-xs text-neutral-300">
                  User: <span className="text-emerald-400 font-medium">{authStatus.user?.firstName || 'Telegram User'}</span>
                  {authStatus.user?.username && ` (@${authStatus.user.username})`}
                </p>
                <p className="text-xs text-neutral-400">
                  Target Channel ID: <span className="font-mono text-neutral-300">-1001269413427</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  onClose();
                  onStartSync(true);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-sm font-semibold shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Sync Channel Library Now
              </button>

              <button
                onClick={handleLogout}
                disabled={actionLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium flex items-center justify-center gap-2 transition-all"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                Disconnect & Log Out
              </button>
            </div>
          </div>
        ) : step === 'code' ? (
          /* Step: Enter Code */
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800 text-xs text-neutral-300 space-y-1">
              <p className="font-medium text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-rose-400" />
                Verification Code Sent
              </p>
              <p className="text-neutral-400">
                A verification code was sent to your Telegram app. Enter it below to sign in.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300 tracking-wide uppercase">
                Telegram Code
              </label>
              <input
                type="text"
                placeholder="12345"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-center font-mono text-lg tracking-widest placeholder-neutral-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-1/3 py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="w-2/3 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2 transition-all"
              >
                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Verify Code'}
              </button>
            </div>
          </form>
        ) : step === 'password' ? (
          /* Step: 2FA Password */
          <form onSubmit={handleVerifyPassword} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800 text-xs text-neutral-300 space-y-1">
              <p className="font-medium text-white flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-400" />
                Two-Step Verification (2FA)
              </p>
              <p className="text-neutral-400">
                Your account is protected by Two-Step Verification. Please enter your 2FA password.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300 tracking-wide uppercase">
                Account Password
              </label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-white placeholder-neutral-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep('code')}
                className="w-1/3 py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="w-2/3 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2 transition-all"
              >
                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Unlock & Sign In'}
              </button>
            </div>
          </form>
        ) : (
          /* Step: Phone input (Credentials are hardwired) */
          <form onSubmit={handleSendCode} className="space-y-4">
            
            {/* Hardwired Status Badge */}
            <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-400" />
                <span className="text-neutral-300">API ID: 27316185</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-sans font-medium">
                Hardwired
              </span>
            </div>

            {/* Phone Number Input */}
            <div>
              <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                Telegram Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="+1234567890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-rose-500 transition-all font-mono"
                />
              </div>
              <p className="text-[10px] text-neutral-500 mt-1">Include country code e.g. +1 (US) or +91 (IN)</p>
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-sm font-semibold shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2 transition-all mt-4"
            >
              {actionLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Sending code to Telegram...
                </>
              ) : (
                'Send Verification Code'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
