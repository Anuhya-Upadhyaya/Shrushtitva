import React, { useState } from 'react';
import { UserProfile } from '../types/plant';
import { api } from '../services/api';
import { X, Lock, Mail, User, Sprout, AlertCircle, Loader2, KeyRound } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [locationName, setLocationName] = useState('Bengaluru, Karnataka, India');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      if (mode === 'signin') {
        const { user } = await api.login(email, password);
        onAuthSuccess(user);
        onClose();
      } else if (mode === 'signup') {
        const { user } = await api.signup({
          email,
          password,
          name,
          locationName,
        });
        onAuthSuccess(user);
        onClose();
      } else if (mode === 'forgot') {
        const res = await api.resetPassword(email, password);
        setInfoMessage(res.message);
        setMode('signin');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { user } = await api.guestLogin();
      onAuthSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in as guest.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden my-6 flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-200 flex items-center justify-between bg-[#FAF7F5]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#3B182E] text-white flex items-center justify-center">
              <Sprout className="w-4 h-4 text-[#F7D6C8]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                {mode === 'signin' && 'Welcome to Shrushtitva'}
                {mode === 'signup' && 'Create Your Botanical Account'}
                {mode === 'forgot' && 'Reset Garden Account Password'}
              </h2>
              <p className="text-[11px] text-neutral-500">Private, secure plant-care isolation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-neutral-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl">
              {infoMessage}
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="font-bold text-neutral-800 block mb-1">Your Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Anuhya Upadhyaya"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-neutral-200 rounded-xl"
                />
              </div>
            </div>
          )}

          <div>
            <label className="font-bold text-neutral-800 block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-neutral-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-neutral-800 block">
                {mode === 'forgot' ? 'New Password' : 'Password'}
              </label>
              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-[11px] text-[#3B182E] hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-neutral-200 rounded-xl"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="font-bold text-neutral-800 block mb-1">Garden City / Location</label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. Bengaluru, Karnataka, India"
                className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 font-bold text-white bg-[#3B182E] hover:bg-[#2B1020] rounded-xl transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2 shadow-xs"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === 'signin' ? (
              'Sign In to My Garden'
            ) : mode === 'signup' ? (
              'Create Garden Account'
            ) : (
              'Save New Password'
            )}
          </button>

          {/* Quick Guest Explorer for frictionless testing */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={isLoading}
              className="w-full py-2 px-3 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors cursor-pointer"
            >
              Explore Instantly as Sample Gardener (Anuhya)
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="text-center pt-2 text-xs text-neutral-500">
            {mode === 'signin' ? (
              <p>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="font-bold text-[#3B182E] hover:underline cursor-pointer"
                >
                  Sign Up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="font-bold text-[#3B182E] hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
