import React from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  Heart,
  User as UserIcon,
  MapPin,
  Moon,
  Sun,
  Globe,
  LogOut
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';

interface NavbarProps {
  onOpenLocationModal: () => void;
  selectedLocationName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenLocationModal, selectedLocationName }) => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { currentUser, isAuthenticated, logout, wishlistIds } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 transition-colors">
      {/* Rangpur City Exclusive Notice Banner (No Admin / RBAC Controls in User App) */}
      <div className="bg-emerald-900 text-emerald-100 text-xs py-1.5 px-4 flex flex-wrap justify-between items-center gap-2">
        <span>
          {language === 'bn'
            ? '📍 শুধুমাত্র রংপুর মেট্রোপলিটন শহরের ক্রেতা ও বিক্রেতাদের জন্য — পণ্য সামনাসামনি দেখে লেনদেন করুন'
            : '📍 Exclusively for Rangpur City buyers & sellers — Inspect products in person before paying'}
        </span>
        <span className="hidden sm:inline text-[11px] text-amber-300 font-semibold">
          {language === 'bn'
            ? 'জাহাজ কোম্পানি • ধাপ • শাপলা চত্বর • লালবাগ • কাচারী বাজার • মডার্ন মোড়'
            : 'Jahaj Company • Dhap • Shapla Chattar • Lalbag • Kachari Bazar'}
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Rangpur City Area Selector */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 border border-amber-400/50 flex items-center justify-center text-amber-300 font-extrabold text-xl shadow-md group-hover:scale-105 transition-transform">
                R
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-1">
                  Recycl<span className="text-emerald-600 dark:text-emerald-400">Rangpur</span>
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 -mt-1 block font-medium">
                  রিসাইকেল রংপুর শহর • কেনাবেচা
                </span>
              </div>
            </Link>

            {/* Rangpur City Area Selector Trigger */}
            <button
              type="button"
              onClick={onOpenLocationModal}
              aria-label={language === 'bn' ? 'রংপুর শহরের এলাকা নির্বাচন করুন' : 'Select Rangpur City area'}
              className="hidden md:flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-full transition-colors border border-gray-200 dark:border-slate-700"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate max-w-[160px]">
                {selectedLocationName || (language === 'bn' ? 'রংপুর শহর (সব এলাকা)' : 'Rangpur City (All Areas)')}
              </span>
            </button>
          </div>

          {/* Action Links & Controls (Strictly User Options Only) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <button
              type="button"
              onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 transition-colors"
              title="Change Language"
              aria-label="Toggle language between Bengali and English"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'bn' ? 'English' : 'বাংলা'}</span>
            </button>

            {/* Theme Switcher */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Wishlist Link */}
            <Link
              to="/wishlist"
              className="relative p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistIds.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {wishlistIds.length}
                </span>
              )}
            </Link>

            {/* User Account Menu / Login (No Admin Link) */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <img
                    src={
                      currentUser?.avatarUrl ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                    }
                    alt={currentUser?.fullName || 'User avatar'}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/30"
                  />
                  <span className="hidden lg:inline text-xs font-medium text-gray-800 dark:text-gray-200">
                    {currentUser?.fullName}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link to="/login">
                <Button variant="secondary" size="sm" icon={<UserIcon className="w-4 h-4" />}>
                  {t('common.login')}
                </Button>
              </Link>
            )}

            {/* Post Ad Button */}
            <Link to="/post-ad" className="hidden sm:block">
              <Button variant="primary" size="sm" icon={<PlusCircle className="w-4 h-4" />}>
                {t('common.postAd')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
