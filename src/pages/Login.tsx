import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, Loader2, ArrowRight } from 'lucide-react';
import { Logo } from '../components/Logo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-[440px] flex flex-col items-center">
        {/* Logo and Header */}
        <Logo className="h-10 mb-6" />
        <h2 className="text-[28px] font-bold tracking-tight text-[#181820] mb-2">Welcome back</h2>
        <p className="text-[15px] text-gray-500 text-center mb-8 max-w-[320px]">
          Enter your credentials to enter your curated social circle.
        </p>

        {/* Form Container */}
        <div className="w-full">
          <form className="space-y-5" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-[#181820] ml-1">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-400 font-medium">@</span>
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-11"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="block text-[13px] font-semibold text-[#181820]">Password</label>
                <Link to="#" className="text-[13px] font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-11"
                  placeholder="••••••••••••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log In'}
                {!loading && <ArrowRight className="w-4 h-4 ml-1" />}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="my-7 flex items-center justify-center">
            <div className="h-px bg-gray-200 flex-1" />
            <span className="px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-[#F8F8FB]">OR</span>
            <div className="h-px bg-gray-200 flex-1" />
          </div>

          {/* Social Logins */}
          <div className="space-y-3">
            <button type="button" className="btn-dark" onClick={() => {}}>
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.592 10.371c-.027-2.909 2.378-4.316 2.484-4.382-1.353-1.979-3.454-2.247-4.204-2.285-1.787-.181-3.486 1.053-4.404 1.053-.918 0-2.31-1.018-3.791-0.989-1.939.028-3.727 1.127-4.721 2.852-2.115 3.666-.541 9.083 1.521 12.062.999 1.442 2.181 3.056 3.743 2.998 1.506-.057 2.086-.97 3.9-.97 1.815 0 2.338.97 3.929.941 1.62-.028 2.646-1.468 3.639-2.916 1.144-1.67 1.616-3.292 1.64-3.376-.037-.015-3.159-1.213-3.197-4.836zm-1.89-6.495c.833-1.008 1.393-2.413 1.239-3.812-1.196.048-2.668.796-3.527 1.828-.769.923-1.439 2.361-1.258 3.73 1.339.104 2.713-.735 3.546-1.746z" />
              </svg>
              Continue with Apple
            </button>
            <button type="button" onClick={handleGoogleLogin} disabled={loading} className="btn-secondary">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="mt-8 text-center text-[14px]">
            <span className="text-gray-500">Don't have an account?</span>{' '}
            <Link to="/signup" className="font-bold text-brand-600 hover:text-brand-700 transition-colors">
              Signup <ArrowRight className="inline w-3.5 h-3.5 -mt-0.5" />
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 w-full max-w-[400px]">
          <div className="flex justify-center items-center gap-4 text-[12px] font-semibold text-gray-400 mb-6">
            <Link to="#" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
            <div className="w-1 h-1 rounded-full bg-gray-300" />
            <Link to="#" className="hover:text-gray-600 transition-colors">Terms of Service</Link>
            <div className="w-1 h-1 rounded-full bg-gray-300" />
            <Link to="#" className="hover:text-gray-600 transition-colors">Help Center</Link>
          </div>
          <div className="text-center text-[12px] font-medium text-gray-400">
            Connectly ID • Secure Authentication
          </div>
        </div>
      </div>
    </div>
  );
}
