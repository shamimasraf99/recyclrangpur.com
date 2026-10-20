import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, LogIn, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';

export const LoginPage: React.FC = () => {
  const { language } = useLanguage();
  const { login, loginAsUser, loginAsModerator } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('tanvir.ahmed@example.com');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const cleanId = identifier.trim();
    if (!cleanId || !password) {
      setError(language === 'bn' ? 'অনুগ্রহ করে সকল তথ্য পূরণ করুন' : 'Please fill in all fields');
      return;
    }
    if (cleanId.length < 3) {
      setError(language === 'bn' ? 'সঠিক ইমেইল বা ফোন নম্বর দিন' : 'Please enter a valid email or phone number');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await login(cleanId, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          err.message ||
          (language === 'bn' ? 'লগইন ব্যর্থ হয়েছে। তথ্য যাচাই করুন।' : 'Login failed. Please check your credentials.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-3xl border border-gray-200 dark:border-slate-700 shadow-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-bold text-2xl flex items-center justify-center mx-auto shadow-md">
            বি
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            {language === 'bn' ? 'একাউন্টে লগইন করুন' : 'Login to Your Account'}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {language === 'bn'
              ? 'বিজ্ঞাপন পরিচালনা ও পছন্দের তালিকা দেখতে লগইন করুন'
              : 'Access your listings, contacts, and saved favorites'}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="login-identifier" className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              {language === 'bn' ? 'ইমেইল অথবা মোবাইল নম্বর' : 'Email or Phone Number'}
            </label>
            <div className="relative">
              <input
                id="login-identifier"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="017XXXXXXXX / user@example.com"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="login-password" className="text-xs font-bold text-gray-700 dark:text-gray-300">
                {language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
              </label>
            </div>
            <div className="relative">
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full font-bold shadow-md"
            isLoading={isLoading}
            disabled={isLoading}
            icon={<LogIn className="w-4 h-4" />}
          >
            {language === 'bn' ? 'লগইন করুন' : 'Login'}
          </Button>
        </form>

        {/* Sandbox Role Preview Helpers */}
        <div className="p-3.5 bg-gray-50 dark:bg-slate-900/60 rounded-xl border border-gray-100 dark:border-slate-800 text-center space-y-2">
          <span className="text-[11px] font-semibold text-gray-500 block">
            {language === 'bn' ? 'স্যান্ডবক্স প্রিভিউ রোল:' : 'Sandbox Preview Roles:'}
          </span>
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              type="button"
              onClick={() => {
                loginAsUser();
                navigate('/dashboard');
              }}
              className="px-3 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-lg font-medium border border-emerald-200 dark:border-emerald-800"
            >
              Regular Seller
            </button>
            <button
              type="button"
              onClick={() => {
                loginAsModerator();
                navigate('/admin');
              }}
              className="px-3 py-1 text-xs bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-lg font-medium border border-blue-200 dark:border-blue-800"
            >
              Moderator Queue
            </button>
          </div>
        </div>

        {/* Register Link */}
        <div className="text-center pt-2 text-xs text-gray-500 dark:text-gray-400">
          {language === 'bn' ? 'কোনো একাউন্ট নেই?' : "Don't have an account?"}{' '}
          <Link to="/register" className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
            {language === 'bn' ? 'নতুন একাউন্ট খুলুন' : 'Register Here'}
          </Link>
        </div>
      </div>
    </div>
  );
};
