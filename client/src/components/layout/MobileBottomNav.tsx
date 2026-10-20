import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, PlusCircle, Heart, User } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

export const MobileBottomNav: React.FC = () => {
  const { t } = useLanguage();
  const { isAuthenticated, wishlistIds } = useAuth();

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-gray-200 dark:border-slate-800 px-2 py-1 safe-bottom">
      <div className="flex items-center justify-around">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center py-1 px-3 text-[11px] font-medium transition-colors ${
              isActive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
            }`
          }
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span>হোম</span>
        </NavLink>

        <NavLink
          to="/products"
          className={({ isActive }) =>
            `flex flex-col items-center py-1 px-3 text-[11px] font-medium transition-colors ${
              isActive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
            }`
          }
        >
          <Search className="w-5 h-5 mb-0.5" />
          <span>খুঁজুন</span>
        </NavLink>

        {/* Highlighted Center Post Ad Button */}
        <NavLink
          to="/post-ad"
          className="flex flex-col items-center -mt-5"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform">
            <PlusCircle className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            বিজ্ঞাপন
          </span>
        </NavLink>

        <NavLink
          to="/wishlist"
          className={({ isActive }) =>
            `relative flex flex-col items-center py-1 px-3 text-[11px] font-medium transition-colors ${
              isActive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
            }`
          }
        >
          <Heart className="w-5 h-5 mb-0.5" />
          <span>পছন্দ</span>
          {wishlistIds.length > 0 && (
            <span className="absolute top-0 right-2 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">
              {wishlistIds.length}
            </span>
          )}
        </NavLink>

        <NavLink
          to={isAuthenticated ? '/dashboard' : '/login'}
          className={({ isActive }) =>
            `flex flex-col items-center py-1 px-3 text-[11px] font-medium transition-colors ${
              isActive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
            }`
          }
        >
          <User className="w-5 h-5 mb-0.5" />
          <span>{isAuthenticated ? 'প্রোফাইল' : 'লগইন'}</span>
        </NavLink>
      </div>
    </nav>
  );
};
