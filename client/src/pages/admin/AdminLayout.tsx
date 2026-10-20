import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldCheck,
  Package,
  Users,
  FolderTree,
  Flag,
  Image as ImageIcon,
  Settings,
  History,
  Menu,
  X,
  ExternalLink,
  LogOut,
  ShieldAlert,
  Globe,
  Lock,
  UserCheck
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../../../shared/types';

export type AdminTabId =
  | 'overview'
  | 'moderation'
  | 'listings'
  | 'users'
  | 'categories'
  | 'reports'
  | 'banners'
  | 'settings'
  | 'audit';

interface AdminLayoutProps {
  activeTab: AdminTabId;
  onSelectTab: (tab: AdminTabId) => void;
  pendingModerationCount: number;
  pendingReportsCount: number;
  isLiveBackend: boolean;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeTab,
  onSelectTab,
  pendingModerationCount,
  pendingReportsCount,
  isLiveBackend,
  children
}) => {
  const { language, toggleLanguage } = useLanguage();
  const {
    currentUser,
    isModerator,
    isAdmin,
    isSuperAdmin,
    hasPermission,
    switchRole,
    logout
  } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems: {
    id: AdminTabId;
    labelBn: string;
    labelEn: string;
    icon: React.ReactNode;
    allowed: boolean;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'overview',
      labelBn: 'ওভারভিউ ও পরিসংখ্যান',
      labelEn: 'Overview & Stats',
      icon: <LayoutDashboard className="w-4 h-4" />,
      allowed: isAdmin || isSuperAdmin
    },
    {
      id: 'moderation',
      labelBn: 'মডারেশন কিউ',
      labelEn: 'Moderation Queue',
      icon: <ShieldCheck className="w-4 h-4" />,
      allowed: hasPermission('listings:moderate'),
      badge: pendingModerationCount,
      badgeColor: 'bg-amber-500 text-white'
    },
    {
      id: 'listings',
      labelBn: 'সকল বিজ্ঞাপন নিয়ন্ত্রণ',
      labelEn: 'Listings Control',
      icon: <Package className="w-4 h-4" />,
      allowed: hasPermission('listings:moderate')
    },
    {
      id: 'reports',
      labelBn: 'অভিযোগ ও রিপোর্ট কিউ',
      labelEn: 'Report Queue',
      icon: <Flag className="w-4 h-4" />,
      allowed: hasPermission('reports:review'),
      badge: pendingReportsCount,
      badgeColor: 'bg-rose-500 text-white'
    },
    {
      id: 'users',
      labelBn: 'ব্যবহারকারী ব্যবস্থাপনা',
      labelEn: 'User Management',
      icon: <Users className="w-4 h-4" />,
      allowed: hasPermission('users:view_all')
    },
    {
      id: 'categories',
      labelBn: 'ক্যাটাগরি ও সাবক্যাটাগরি',
      labelEn: 'Categories CRUD',
      icon: <FolderTree className="w-4 h-4" />,
      allowed: hasPermission('categories:manage')
    },
    {
      id: 'banners',
      labelBn: 'ব্যানার ব্যবস্থাপনা',
      labelEn: 'Banner Management',
      icon: <ImageIcon className="w-4 h-4" />,
      allowed: hasPermission('banners:manage')
    },
    {
      id: 'settings',
      labelBn: 'সাইট সেটিংস ও যোগাযোগ',
      labelEn: 'Site Settings',
      icon: <Settings className="w-4 h-4" />,
      allowed: hasPermission('settings:view')
    },
    {
      id: 'audit',
      labelBn: 'নিরাপত্তা অডিট লগ',
      labelEn: 'Audit Trail',
      icon: <History className="w-4 h-4" />,
      allowed: hasPermission('audit_logs:view')
    }
  ];

  const currentRole: UserRole = !currentUser
    ? 'guest'
    : currentUser.roles.includes('super_admin')
    ? 'super_admin'
    : currentUser.roles.includes('admin')
    ? 'admin'
    : currentUser.roles.includes('moderator')
    ? 'moderator'
    : 'user';

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top RBAC Role Verification Bar */}
      <div className="bg-slate-900 text-slate-200 border-b border-slate-800 px-4 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold text-slate-300">
              {language === 'bn' ? 'রোল এবং পারমিশন টেস্ট সুইচার:' : 'RBAC Verification Switcher:'}
            </span>
            <div className="flex flex-wrap items-center gap-1">
              {(['guest', 'user', 'moderator', 'admin', 'super_admin'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    switchRole(r);
                    if (r === 'moderator' && !['moderation', 'listings', 'reports'].includes(activeTab)) {
                      onSelectTab('moderation');
                    } else if ((r === 'admin' || r === 'super_admin') && !isModerator) {
                      onSelectTab('overview');
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    currentRole === r
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {r === 'guest' && (language === 'bn' ? 'অতিথি (Guest)' : 'Guest')}
                  {r === 'user' && (language === 'bn' ? 'সাধারণ ইউজার (User)' : 'Regular User')}
                  {r === 'moderator' && (language === 'bn' ? 'মডারেটর (Mod)' : 'Moderator')}
                  {r === 'admin' && (language === 'bn' ? 'অ্যাডমিন (Admin)' : 'Admin')}
                  {r === 'super_admin' && (language === 'bn' ? 'সুপার অ্যাডমিন (Super)' : 'Super Admin')}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {isLiveBackend ? 'MySQL Live Connected' : 'RBAC Enforced Engine'}
            </span>
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'English' : 'বাংলা'}</span>
            </button>
            <Link
              to="/"
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 font-bold"
            >
              <span>{language === 'bn' ? 'মার্কেটপ্লেসে ফিরুন' : 'Storefront'}</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Access Guard for Guest or Regular User */}
      {!isModerator ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/50 shadow-xl p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-9 h-9" />
            </div>
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                HTTP 403 Forbidden — Access Denied
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {language === 'bn' ? 'প্রশাসনিক প্যানেলে প্রবেশাধিকার সংরক্ষিত' : 'Administrative Access Restricted'}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {language === 'bn'
                  ? `আপনার বর্তমান ভূমিকা (${currentRole.toUpperCase()}) দিয়ে অ্যাডমিন প্যানেলে প্রবেশ করার অনুমতি নেই। শুধুমাত্র অনুমোদিত মডারেটর, অ্যাডমিন এবং সুপার অ্যাডমিনগণ এই রিসোর্সটি ব্যবহার করতে পারবেন।`
                  : `Your active session role (${currentRole.toUpperCase()}) does not hold administrative privileges. Only authenticated Moderators, Admins, and Super Admins are permitted.`}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2">
              <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>{language === 'bn' ? 'রোল যাচাইকরণ নির্দেশিকা:' : 'Role Testing Instructions:'}</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400">
                {language === 'bn'
                  ? 'উপরের কালো বার থেকে "মডারেটর", "অ্যাডমিন", অথবা "সুপার অ্যাডমিন" সিলেক্ট করে প্রতিটি রোলের পারমিশন পরীক্ষা করুন।'
                  : 'Select "Moderator", "Admin", or "Super Admin" from the top verification switcher bar to inspect role-specific capabilities.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  switchRole('moderator');
                  onSelectTab('moderation');
                }}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-colors"
              >
                {language === 'bn' ? 'মডারেটর হিসেবে দেখুন' : 'Test as Moderator'}
              </button>
              <button
                onClick={() => {
                  switchRole('admin');
                  onSelectTab('overview');
                }}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors"
              >
                {language === 'bn' ? 'অ্যাডমিন হিসেবে দেখুন' : 'Test as Admin'}
              </button>
              <button
                onClick={() => {
                  switchRole('super_admin');
                  onSelectTab('overview');
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
              >
                {language === 'bn' ? 'সুপার অ্যাডমিন হিসেবে দেখুন' : 'Test as Super Admin'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Dedicated Admin Sidebar (Desktop) */}
          <aside className="hidden lg:flex lg:flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
                  ক
                </div>
                <div>
                  <span className="font-extrabold text-base tracking-tight block leading-none">
                    {language === 'bn' ? 'বিক্রয়বিডি অ্যাডমিন' : 'BikroyBD Admin'}
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                    {currentRole.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                if (!item.allowed) {
                  return (
                    <div
                      key={item.id}
                      title={language === 'bn' ? 'আপনার রোলের জন্য অনুমোদিত নয়' : 'Not permitted for your role'}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-400 dark:text-slate-600 cursor-not-allowed select-none"
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span>{language === 'bn' ? item.labelBn : item.labelEn}</span>
                      </div>
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                  );
                }

                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{language === 'bn' ? item.labelBn : item.labelEn}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isActive ? 'bg-white text-emerald-700' : item.badgeColor
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Current Staff Profile Footer */}
            {currentUser && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-500/30"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate">{currentUser.fullName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'লগআউট করুন' : 'Sign Out'}</span>
                </button>
              </div>
            )}
          </aside>

          {/* Mobile Drawer & Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Mobile Admin Header */}
            <header className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <span className="font-extrabold text-sm">
                  {language === 'bn' ? 'বিক্রয়বিডি অ্যাডমিন প্যানেল' : 'BikroyBD Admin Panel'}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {currentRole}
              </span>
            </header>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
              <div className="fixed inset-0 z-50 lg:hidden flex">
                <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
                <div className="relative w-72 max-w-full bg-white dark:bg-slate-900 h-full flex flex-col z-10 shadow-2xl">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="font-extrabold text-sm">Admin Menu</span>
                    <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                      if (!item.allowed) return null;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onSelectTab(item.id);
                            setSidebarOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold ${
                            isActive
                              ? 'bg-emerald-600 text-white'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {item.icon}
                            <span>{language === 'bn' ? item.labelBn : item.labelEn}</span>
                          </div>
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-white">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </div>
            )}

            {/* Main Panel Content */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <div className="max-w-6xl mx-auto">{children}</div>
            </main>
          </div>
        </div>
      )}
    </div>
  );
};
