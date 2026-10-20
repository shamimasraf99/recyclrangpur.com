import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, LogIn, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';

export const AdminLoginPage: React.FC = () => {
  const { language } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();

  // Never pre-fill or expose administrative credentials in the client
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError(
        language === 'bn'
          ? 'অনুগ্রহ করে অনুমোদিত স্টাফ ইমেইল এবং পাসওয়ার্ড প্রদান করুন'
          : 'Please enter your authorized staff email and password'
      );
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/admin');
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          (language === 'bn'
            ? 'প্রমাণীকরণ ব্যর্থ হয়েছে। শুধুমাত্র অনুমোদিত স্টাফ একাউন্ট গ্রহণযোগ্য।'
            : 'Authentication failed. Authorized staff credentials required.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-slate-900 text-white p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-bold text-2xl flex items-center justify-center mx-auto shadow-md">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold">
            {language === 'bn' ? 'বিক্রয়বিডি স্টাফ পোর্টাল' : 'BikroyBD Staff Portal'}
          </h1>
          <p className="text-xs text-slate-400">
            {language === 'bn'
              ? 'শুধুমাত্র অনুমোদিত মডারেটর এবং অ্যাডমিনিস্ট্রেটরদের জন্য সংরক্ষিত'
              : 'Restricted authentication for platform moderators and administrators'}
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              {language === 'bn' ? 'স্টাফ ইমেইল' : 'Staff Email'}
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@bikroybd.com"
                autoComplete="off"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              {language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="new-password"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
            isLoading={isLoading}
            icon={<LogIn className="w-4 h-4" />}
          >
            {language === 'bn' ? 'স্টাফ প্যানেলে প্রবেশ করুন' : 'Authenticate Staff Session'}
          </Button>
        </form>
      </div>
    </div>
  );
};
