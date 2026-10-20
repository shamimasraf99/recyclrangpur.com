import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, UserPlus, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';

export const RegisterPage: React.FC = () => {
  const { language } = useLanguage();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const cleanName = fullName.trim();
    const cleanPhone = phoneNumber.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanPhone || !cleanEmail || !password) {
      setError(language === 'bn' ? 'অনুগ্রহ করে সকল ঘর পূরণ করুন' : 'Please fill in all required fields');
      return;
    }
    if (cleanName.length < 2) {
      setError(language === 'bn' ? 'নাম কমপক্ষে ২ অক্ষরের হতে হবে' : 'Name must be at least 2 characters');
      return;
    }
    if (!/^(?:\+8801|01)[3-9]\d{8}$/.test(cleanPhone)) {
      setError(
        language === 'bn'
          ? 'সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)'
          : 'Valid 11-digit Bangladesh phone required (e.g. 017XXXXXXXX)'
      );
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError(language === 'bn' ? 'সঠিক ইমেইল ঠিকানা প্রদান করুন' : 'Please enter a valid email address');
      return;
    }
    if (password.length < 8) {
      setError(language === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে' : 'Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await register({
        fullName: cleanName,
        phoneNumber: cleanPhone,
        email: cleanEmail,
        password,
        preferredLanguage: language
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          err.message ||
          (language === 'bn' ? 'রেজিস্ট্রেশন ব্যর্থ হয়েছে।' : 'Registration failed.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-3xl border border-gray-200 dark:border-slate-700 shadow-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-bold text-2xl flex items-center justify-center mx-auto shadow-md">
            বি
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            {language === 'bn' ? 'নতুন একাউন্ট তৈরি করুন' : 'Create an Account'}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {language === 'bn'
              ? 'ব্যবহৃত পণ্য বিনামূল্যে বিক্রি করতে ও বিক্রেতাদের সাথে যুক্ত হতে যোগ দিন'
              : 'Join to sell used products and contact local sellers'}
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
            <label htmlFor="reg-fullname" className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              {language === 'bn' ? 'আপনার পুরো নাম' : 'Full Name'}
            </label>
            <div className="relative">
              <input
                id="reg-fullname"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={language === 'bn' ? 'যেমন: তানভীর আহমেদ' : 'e.g. Tanvir Ahmed'}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label htmlFor="reg-phone" className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              {language === 'bn' ? 'মোবাইল নম্বর (১১ ডিজিট)' : 'Mobile Number'}
            </label>
            <div className="relative">
              <input
                id="reg-phone"
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label htmlFor="reg-email" className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              {language === 'bn' ? 'ইমেইল ঠিকানা' : 'Email Address'}
            </label>
            <div className="relative">
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label htmlFor="reg-password" className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              {language === 'bn' ? 'পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)' : 'Password (min 8 characters)'}
            </label>
            <div className="relative">
              <input
                id="reg-password"
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

          <div className="pt-1">
            <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>
                {language === 'bn'
                  ? 'আমি ব্যবহারের সকল নিয়ম ও শর্তাবলীতে সম্মত'
                  : 'I agree to the Terms of Service & Privacy Policy'}
              </span>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full font-bold shadow-md"
            isLoading={isLoading}
            disabled={!agreeTerms || isLoading}
            icon={<UserPlus className="w-4 h-4" />}
          >
            {language === 'bn' ? 'একাউন্ট খুলুন' : 'Create Account'}
          </Button>
        </form>

        <div className="text-center pt-2 text-xs text-gray-500 dark:text-gray-400">
          {language === 'bn' ? 'ইতিমধ্যে একাউন্ট আছে?' : 'Already have an account?'}{' '}
          <Link to="/login" className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
            {language === 'bn' ? 'লগইন করুন' : 'Login Here'}
          </Link>
        </div>
      </div>
    </div>
  );
};
