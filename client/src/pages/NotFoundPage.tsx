import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle, Home, Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  const { language } = useLanguage();
  const location = useLocation();

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 p-8 text-center shadow-lg space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-extrabold tracking-widest uppercase text-emerald-600 dark:text-emerald-400">
            Error 404
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            {language === 'bn' ? 'পাতাটি খুঁজে পাওয়া যায়নি' : 'Page Not Found'}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {language === 'bn'
              ? `আপনি যে ঠিকানাটি খুঁজছেন (${location.pathname}) তা সরানো হয়েছে বা বিদ্যমান নেই।`
              : `The requested route (${location.pathname}) does not exist or may have been moved.`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to="/" className="w-full sm:w-auto">
            <Button variant="primary" size="md" className="w-full" icon={<Home className="w-4 h-4" />}>
              {language === 'bn' ? 'হোম পেজে ফিরুন' : 'Back to Home'}
            </Button>
          </Link>
          <Link to="/products" className="w-full sm:w-auto">
            <Button variant="outline" size="md" className="w-full" icon={<Search className="w-4 h-4" />}>
              {language === 'bn' ? 'সকল বিজ্ঞাপন দেখুন' : 'Browse Listings'}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
