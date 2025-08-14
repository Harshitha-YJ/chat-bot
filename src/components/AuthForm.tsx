import React, { useState, useEffect } from 'react';
import { useSignInEmailPassword, useSignUpEmailPassword } from '@nhost/react';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import BotArt from '../assets/ai-bot.png';
import BrandLogo from '../assets/brand-logo.png';

interface AuthFormProps {
  onSuccess?: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { 
    signInEmailPassword, 
    isLoading: signInLoading, 
    isSuccess: signInSuccess,
    isError: signInError,
    error: signInErrorObj
  } = useSignInEmailPassword();
  
  const { 
    signUpEmailPassword, 
    isLoading: signUpLoading, 
    isSuccess: signUpSuccess,
    isError: signUpError,
    error: signUpErrorObj
  } = useSignUpEmailPassword();

  const isLoading = signInLoading || signUpLoading;
  const error = signInErrorObj?.message || signUpErrorObj?.message || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted:', { isLogin, email, password: '***' });

    try {
      if (isLogin) {
        console.log('Attempting sign in...');
        const result = await signInEmailPassword(email, password);
        console.log('Sign in result:', result);
      } else {
        console.log('Attempting sign up...');
        const result = await signUpEmailPassword(email, password);
        console.log('Sign up result:', result);
      }
    } catch (err) {
      console.error('Authentication error:', err);
    }
  };

  // Move debug logging into useEffect to prevent infinite renders
  useEffect(() => {
    console.log('Auth form state:', {
      isLogin,
      isLoading,
      signInLoading,
      signUpLoading,
      signInSuccess,
      signUpSuccess,
      signInError,
      signUpError,
      error
    });
  }, [isLogin, isLoading, signInSuccess, signUpSuccess, signInError, signUpError, error]);

  // Add success handling
  useEffect(() => {
    if (signInSuccess || signUpSuccess) {
      console.log('Authentication successful!');
      if (onSuccess) {
        onSuccess();
      }
      // The auth state change will be handled by ChatApp automatically
    }
  }, [signInSuccess, signUpSuccess, onSuccess]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      {/* Decorative blobs */}
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-blue-600/30 blur-3xl animate-blob" />
      <div className="absolute -bottom-28 -right-24 w-72 h-72 rounded-full bg-indigo-600/30 blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute top-1/2 -translate-y-1/2 -right-36 w-64 h-64 rounded-full bg-cyan-500/20 blur-3xl animate-blob animation-delay-4000" />
      
      <div className="w-full max-w-2xl grid md:grid-cols-2 gap-6 items-center z-10">
        {/* Illustration card */}
        <div className="hidden md:block">
          <div className="glass rounded-2xl p-6 text-center">
            <img src={BotArt} alt="AI Bot" className="mx-auto mb-4 w-40 drop-shadow-lg" />
            <h3 className="text-white font-semibold text-lg">Buddy is ready to help</h3>
            <p className="text-slate-300 text-sm">Sign in to start chatting with your AI assistant.</p>
          </div>
        </div>

        {/* Form card */}
        <div className="glass rounded-2xl p-8">
          <img src={BrandLogo} alt="Buddy Logo" className="w-12 h-12 mb-3" />
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-slate-300 text-sm">
              {isLogin ? 'Sign in to continue' : 'Join us and start the conversation'}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-200">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 text-white placeholder:text-slate-300 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500/60 focus:border-transparent transition-all"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-200">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-white/10 text-white placeholder:text-slate-300 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500/60 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Debug Info */}
            {/* Removed verbose debug info for cleaner UI */}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Switch Mode */}
          <div className="mt-6 text-center">
            <p className="text-slate-300">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  // Clear any existing errors when switching modes
                  setEmail('');
                  setPassword('');
                }}
                className="text-white underline decoration-blue-400/60 hover:decoration-blue-300 font-semibold transition-colors"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;