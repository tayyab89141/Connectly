import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react';
import { Logo } from '../components/Logo';

export default function Signup() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username: username,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-[440px] flex flex-col items-center text-center">
          <Logo className="h-10 mb-8" />
          <div className="w-full glass-card rounded-3xl p-10">
            <h2 className="text-[28px] font-bold tracking-tight text-[#181820] mb-4">Check your email</h2>
            <p className="text-[15px] text-gray-500 mb-8 leading-relaxed">
              We've sent a confirmation link to <span className="font-semibold text-[#181820]">{email}</span>. Please click the link to activate your account.
            </p>
            <Link to="/login" className="btn-primary">
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-[440px] flex flex-col items-center">
        {/* Logo and Header */}
        <Logo className="h-10 mb-6" />
        <h2 className="text-[28px] font-bold tracking-tight text-[#181820] mb-2">Create your account</h2>
        <p className="text-[15px] text-gray-500 text-center mb-8 max-w-[320px]">
          Join your curated social circle and start connecting.
        </p>

        {/* Form Container */}
        <div className="w-full">
          <form className="space-y-4" onSubmit={handleSignup}>
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-[#181820] ml-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-field pl-11"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-[#181820] ml-1">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-400 font-medium">@</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input-field pl-11"
                    placeholder="johndoe"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-[#181820] ml-1">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
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
              <label className="block text-[13px] font-semibold text-[#181820] ml-1">Password</label>
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

            <div className="space-y-1.5 pb-2">
              <label className="block text-[13px] font-semibold text-[#181820] ml-1">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field pl-11"
                  placeholder="••••••••••••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                {!loading && <ArrowRight className="w-4 h-4 ml-1" />}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center text-[14px]">
            <span className="text-gray-500">Already have an account?</span>{' '}
            <Link to="/login" className="font-bold text-brand-600 hover:text-brand-700 transition-colors">
              Sign In <ArrowRight className="inline w-3.5 h-3.5 -mt-0.5" />
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
