import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Ban,
  History,
  Search,
  Star,
  Trash2,
  Plus,
  Edit3,
  Eye,
  FolderPlus,
  Image as ImageIcon,
  Save,
  ShieldCheck,
  Lock,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Check,
  X
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { AdminLayout, AdminTabId } from './AdminLayout';
import { AdminService, AdminReportItem, ExtendedAuditLog } from '../../services/adminService';
import { Product, User, Category, Banner, UserRole } from '../../../../shared/types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const AdminDashboardPage: React.FC = () => {
  const { language, formatPrice } = useLanguage();
  const { currentUser, isAdmin, isSuperAdmin, hasPermission } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTabId>(() =>
    isAdmin || isSuperAdmin ? 'overview' : 'moderation'
  );

  // Global notification banners
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // 1. Overview Stats State
  const [stats, setStats] = useState<any>(null);
  const [isLiveBackend, setIsLiveBackend] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // 2. Moderation & Listings State
  const [listings, setListings] = useState<Product[]>([]);
  const [listingsMeta, setListingsMeta] = useState({ page: 1, totalItems: 0, totalPages: 1 });
  const [listingSearch, setListingSearch] = useState('');
  const [listingStatusFilter, setListingStatusFilter] = useState('all');
  const [isLoadingListings, setIsLoadingListings] = useState(false);

  // Reject Modal State
  const [rejectTarget, setRejectTarget] = useState<Product | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');

  // Remove Listing Confirmation Modal State
  const [removeTarget, setRemoveTarget] = useState<Product | null>(null);
  const [removeReasonInput, setRemoveReasonInput] = useState('');

  // 3. Users State
  const [usersList, setUsersList] = useState<User[]>([]);
  const [usersMeta, setUsersMeta] = useState({ page: 1, totalItems: 0, totalPages: 1 });
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [selectedUserProfile, setSelectedUserProfile] = useState<any | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<User | null>(null);
  const [suspendReasonInput, setSuspendReasonInput] = useState('');

  // 4. Categories State
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatNameBn, setNewCatNameBn] = useState('');
  const [newCatNameEn, setNewCatNameEn] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Smartphone');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [subcatParentId, setSubcatParentId] = useState<number | null>(null);
  const [newSubNameBn, setNewSubNameBn] = useState('');
  const [newSubNameEn, setNewSubNameEn] = useState('');
  const [newSubSlug, setNewSubSlug] = useState('');

  // 5. Reports State
  const [reports, setReports] = useState<AdminReportItem[]>([]);
  const [reportStatusFilter, setReportStatusFilter] = useState('all');
  const [resolveTarget, setResolveTarget] = useState<AdminReportItem | null>(null);
  const [resolutionNotesInput, setResolutionNotesInput] = useState('');

  // 6. Banners State
  const [banners, setBanners] = useState<Banner[]>([]);
  const [newBannerTitle, setNewBannerTitle] = useState('');
  const [newBannerImage, setNewBannerImage] = useState('');
  const [newBannerTarget, setNewBannerTarget] = useState('/products');
  const [newBannerPlacement, setNewBannerPlacement] = useState<Banner['placement']>('home_hero');

  // 7. Settings State
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // 8. Audit Logs State
  const [auditLogs, setAuditLogs] = useState<ExtendedAuditLog[]>([]);
  const [auditEntityTypeFilter, setAuditEntityTypeFilter] = useState('all');
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);

  const actorInfo = currentUser
    ? { id: currentUser.id, fullName: currentUser.fullName, roles: currentUser.roles }
    : null;

  const loadAllData = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const [statsRes, listingsRes, usersRes, catsRes, reportsRes, bannersRes, settingsRes, auditRes] =
        await Promise.all([
          AdminService.getStats(),
          AdminService.listListings({
            page: listingsMeta.page,
            search: listingSearch || undefined,
            status: activeTab === 'moderation' ? 'pending' : listingStatusFilter
          }),
          AdminService.listUsers({
            page: usersMeta.page,
            search: userSearch || undefined,
            role: userRoleFilter,
            status: userStatusFilter
          }),
          AdminService.getCategories(),
          AdminService.getReports(reportStatusFilter),
          AdminService.getBanners(),
          AdminService.getSettings(),
          AdminService.getAuditLogs({
            page: auditPage,
            entityType: auditEntityTypeFilter !== 'all' ? auditEntityTypeFilter : undefined
          })
        ]);

      setStats(statsRes.data);
      setIsLiveBackend(statsRes.isLive);
      setListings(listingsRes.items);
      if (listingsRes.meta) setListingsMeta(listingsRes.meta);
      setUsersList(usersRes.users);
      if (usersRes.meta) setUsersMeta(usersRes.meta);
      setCategories(catsRes);
      setReports(reportsRes);
      setBanners(bannersRes);
      setSettings(settingsRes);
      setAuditLogs(auditRes.logs);
      if (auditRes.meta) setAuditTotalPages(auditRes.meta.totalPages || 1);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load administrative data');
    } finally {
      setIsLoadingStats(false);
    }
  }, [
    activeTab,
    listingsMeta.page,
    listingSearch,
    listingStatusFilter,
    usersMeta.page,
    userSearch,
    userRoleFilter,
    userStatusFilter,
    reportStatusFilter,
    auditPage,
    auditEntityTypeFilter
  ]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handlers: Moderation & Listings
  const handleApproveListing = async (id: number) => {
    try {
      await AdminService.approveListing(id, actorInfo);
      showToast('success', language === 'bn' ? `বিজ্ঞাপন #${id} অনুমোদিত হয়েছে` : `Listing #${id} approved`);
      loadAllData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleConfirmRejectListing = async () => {
    if (!rejectTarget) return;
    if (!rejectReasonInput.trim()) {
      showToast('error', language === 'bn' ? 'প্রত্যাখ্যানের কারণ লিখুন' : 'Please provide a rejection reason');
      return;
    }
    try {
      await AdminService.rejectListing(rejectTarget.id, rejectReasonInput.trim(), actorInfo);
      showToast('success', language === 'bn' ? `বিজ্ঞাপন #${rejectTarget.id} প্রত্যাখ্যান করা হয়েছে` : `Listing #${rejectTarget.id} rejected`);
      setRejectTarget(null);
      setRejectReasonInput('');
      loadAllData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleToggleFeatured = async (item: Product) => {
    try {
      const nextFeatured = !item.isFeatured;
      await AdminService.toggleFeatured(item.id, nextFeatured, actorInfo);
      showToast(
        'success',
        nextFeatured
          ? language === 'bn' ? 'বিজ্ঞাপনটি ফিচার্ড করা হয়েছে' : 'Marked as Featured'
          : language === 'bn' ? 'ফিচার্ড স্ট্যাটাস সরানো হয়েছে' : 'Removed from Featured'
      );
      loadAllData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleConfirmRemoveListing = async () => {
    if (!removeTarget) return;
    try {
      await AdminService.removeListing(removeTarget.id, removeReasonInput.trim() || 'Policy violation', actorInfo);
      showToast('success', language === 'bn' ? `বিজ্ঞাপন #${removeTarget.id} সরিয়ে নেওয়া হয়েছে` : `Listing #${removeTarget.id} removed`);
      setRemoveTarget(null);
      setRemoveReasonInput('');
      loadAllData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Handlers: User Management
  const handleInspectUser = async (userId: number) => {
    try {
      const detail = await AdminService.getUserDetails(userId);
      setSelectedUserProfile(detail);
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleConfirmSuspendToggle = async () => {
    if (!suspendTarget) return;
    const nextSuspended = !suspendTarget.isSuspended;
    try {
      await AdminService.suspendUser(suspendTarget.id, nextSuspended, suspendReasonInput.trim(), actorInfo);
      showToast(
        'success',
        nextSuspended
          ? language === 'bn' ? 'ব্যবহারকারী স্থগিত করা হয়েছে' : 'User account suspended'
          : language === 'bn' ? 'ব্যবহারকারী পুনরায় সক্রিয় করা হয়েছে' : 'User account reactivated'
      );
      setSuspendTarget(null);
      setSuspendReasonInput('');
      loadAllData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleChangeUserRole = async (userId: number, newRole: UserRole) => {
    try {
      await AdminService.updateUserRole(userId, newRole, actorInfo);
      showToast('success', language === 'bn' ? `ব্যবহারকারীর রোল '${newRole}' এ পরিবর্তিত হয়েছে` : `User role updated to '${newRole}'`);
      loadAllData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Handlers: Categories CRUD
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatNameBn.trim() || !newCatNameEn.trim() || !newCatSlug.trim()) {
      showToast('error', language === 'bn' ? 'সকল ক্যাটাগরি তথ্য পূরণ করুন' : 'Please fill all category fields');
      return;
    }
    try {
      await AdminService.createCategory(
        {
          nameBn: newCatNameBn.trim(),
          nameEn: newCatNameEn.trim(),
          slug: newCatSlug.trim().toLowerCase(),
          iconName: newCatIcon.trim() || 'Tag'
        },
        actorInfo
      );
      setNewCatNameBn('');
      setNewCatNameEn('');
      setNewCatSlug('');
      showToast('success', language === 'bn' ? 'নতুন ক্যাটাগরি যুক্ত হয়েছে' : 'Category created');
      loadAllData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleSaveCategoryEdit = async () => {
    if (!editingCategory) return;
    try {
      await AdminService.updateCategory(editingCategory.id, editingCategory, actorInfo);
      setEditingCategory(null);
      showToast('success', language === 'bn' ? 'ক্যাটাগরি আপডেট হয়েছে' : 'Category updated');
      loadAllData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await AdminService.deleteCategory(id, actorInfo);
      showToast('success', language === 'bn' ? 'ক্যাটাগরি মুছে ফেলা হয়েছে' : 'Category deleted');
      loadAllData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleCreateSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subcatParentId || !newSubNameBn.trim() || !newSubNameEn.trim() || !newSubSlug.trim()) return;
    try {
      await AdminService.createSubcategory(
        subcatParentId,
        {
          nameBn: newSubNameBn.trim(),
          nameEn: newSubNameEn.trim(),
          slug: newSubSlug.trim().toLowerCase()
        },
        actorInfo
      );
      setSubcatParentId(null);
      setNewSubNameBn('');
      setNewSubNameEn('');
      setNewSubSlug('');
      showToast('success', language === 'bn' ? 'সাবক্যাটাগরি যুক্ত হয়েছে' : 'Subcategory added');
      loadAllData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleDeleteSubcategory = async (subId: number) => {
    try {
      await AdminService.deleteSubcategory(subId, actorInfo);
      showToast('success', language === 'bn' ? 'সাবক্যাটাগরি মুছে ফেলা হয়েছে' : 'Subcategory removed');
      loadAllData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Handlers: Reports Queue
  const handleMarkReportInvestigating = async (reportId: number) => {
    try {
      await AdminService.investigateReport(reportId, 'Under active moderator investigation', actorInfo);
      showToast('success', language === 'bn' ? 'রিপোর্টটি তদন্তাধীনে নেওয়া হয়েছে' : 'Report marked as investigating');
      loadAllData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleConfirmResolveReport = async () => {
    if (!resolveTarget) return;
    if (!resolutionNotesInput.trim()) {
      showToast('error', language === 'bn' ? 'মীমাংসার নোট লিখুন' : 'Please enter resolution notes');
      return;
    }
    try {
      await AdminService.resolveReport(resolveTarget.id, resolutionNotesInput.trim(), actorInfo);
      showToast('success', language === 'bn' ? 'রিপোর্ট নিষ্পত্তি সম্পন্ন হয়েছে' : 'Report resolved');
      setResolveTarget(null);
      setResolutionNotesInput('');
      loadAllData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleDismissReport = async (reportId: number) => {
    try {
      await AdminService.dismissReport(reportId, 'No violation found upon inspection', actorInfo);
      showToast('success', language === 'bn' ? 'রিপোর্ট খারিজ করা হয়েছে' : 'Report dismissed');
      loadAllData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Handlers: Banners
  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBannerTitle.trim() || !newBannerImage.trim()) {
      showToast('error', language === 'bn' ? 'ব্যানার শিরোনাম ও ছবির লিঙ্ক আবশ্যক' : 'Banner title and image URL required');
      return;
    }
    try {
      await AdminService.createBanner(
        {
          title: newBannerTitle.trim(),
          imageUrl: newBannerImage.trim(),
          targetUrl: newBannerTarget.trim() || '/products',
          placement: newBannerPlacement
        },
        actorInfo
      );
      setNewBannerTitle('');
      setNewBannerImage('');
      showToast('success', language === 'bn' ? 'নতুন ব্যানার সংরক্ষিত হয়েছে' : 'Promotional banner added');
      loadAllData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleToggleBannerActive = async (banner: Banner) => {
    try {
      await AdminService.updateBanner(banner.id, { isActive: !banner.isActive }, actorInfo);
      showToast('success', language === 'bn' ? 'ব্যানার স্ট্যাটাস পরিবর্তিত হয়েছে' : 'Banner status updated');
      loadAllData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleDeleteBanner = async (id: number) => {
    try {
      await AdminService.deleteBanner(id, actorInfo);
      showToast('success', language === 'bn' ? 'ব্যানার মুছে ফেলা হয়েছে' : 'Banner deleted');
      loadAllData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Handlers: System Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await AdminService.updateSettings(settings, actorInfo);
      showToast('success', language === 'bn' ? 'সিস্টেম সেটিংস সফলভাবে সংরক্ষিত হয়েছে' : 'System settings saved');
      loadAllData();
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const pendingModCount = stats?.listings?.pending ?? listings.filter(l => l.moderationStatus === 'pending').length;
  const pendingRepCount = stats?.reports?.pending ?? reports.filter(r => r.status === 'pending').length;

  return (
    <AdminLayout
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      pendingModerationCount={pendingModCount}
      pendingReportsCount={pendingRepCount}
      isLiveBackend={isLiveBackend}
    >
      {/* Toast Alert */}
      {feedback && (
        <div
          className={`mb-6 p-4 rounded-2xl border flex items-center justify-between shadow-md ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/70 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs font-bold">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-sm font-bold px-2">
            ×
          </button>
        </div>
      )}

      {/* =====================================================================
          TAB 1: OVERVIEW DASHBOARD & REAL DATABASE METRICS
         ===================================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h1 className="text-xl font-extrabold">
                {language === 'bn' ? 'মার্কেটপ্লেস ওভারভিউ ও রিয়েল-টাইম পরিসংখ্যান' : 'Marketplace Overview & Live Statistics'}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'bn'
                  ? 'ডাটাবেস থেকে সংগৃহীত ব্যবহারকারী, বিজ্ঞাপন, মডারেশন এবং রিপোর্ট মেট্রিক্স'
                  : 'Database-backed metrics across users, listings, moderation queue, and trust reports'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadAllData}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoadingStats ? 'animate-spin' : ''}`} />}
            >
              {language === 'bn' ? 'রিফ্রেশ' : 'Refresh Metrics'}
            </Button>
          </div>

          {/* Primary KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">
                  {language === 'bn' ? 'মোট ব্যবহারকারী' : 'Total Users'}
                </span>
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black">{stats?.users?.total || 0}</div>
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <span className="text-emerald-600 font-bold">{stats?.users?.active || 0} Active</span>
                <span>•</span>
                <span className="text-rose-500 font-bold">{stats?.users?.suspended || 0} Suspended</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">
                  {language === 'bn' ? 'সক্রিয় বিজ্ঞাপন' : 'Active Listings'}
                </span>
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black">{stats?.listings?.active || 0}</div>
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <span className="text-amber-600 font-bold">{stats?.listings?.featured || 0} Featured</span>
                <span>•</span>
                <span>{stats?.listings?.sold || 0} Sold</span>
              </div>
            </div>

            <div
              onClick={() => setActiveTab('moderation')}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-sm space-y-2 cursor-pointer hover:border-amber-400 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-600">
                  {language === 'bn' ? 'মডারেশন অপেক্ষমান' : 'Pending Moderation'}
                </span>
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-amber-600">{stats?.listings?.pending || 0}</div>
              <div className="text-[11px] text-slate-500">
                {language === 'bn' ? 'রিভিউ করতে ক্লিক করুন →' : 'Click to review queue →'}
              </div>
            </div>

            <div
              onClick={() => setActiveTab('reports')}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-sm space-y-2 cursor-pointer hover:border-rose-400 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-600">
                  {language === 'bn' ? 'অভিযোগ ও রিপোর্ট' : 'Abuse Reports'}
                </span>
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-rose-600">{stats?.reports?.pending || 0}</div>
              <div className="text-[11px] text-slate-500">
                {stats?.reports?.investigating || 0} Investigating • {stats?.reports?.resolved || 0} Resolved
              </div>
            </div>
          </div>

          {/* Breakdown Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Distribution */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm">
                  {language === 'bn' ? 'ক্যাটাগরি অনুযায়ী বিজ্ঞাপন সংখ্যা' : 'Listings by Category'}
                </h3>
                <button
                  onClick={() => setActiveTab('categories')}
                  className="text-xs text-emerald-600 font-bold hover:underline"
                >
                  {language === 'bn' ? 'সব ক্যাটাগরি' : 'Manage CRUD'}
                </button>
              </div>
              <div className="space-y-3">
                {(stats?.topCategories || []).map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <span className="font-semibold">{language === 'bn' ? c.nameBn : c.nameEn}</span>
                    <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {c.listingCount} Ads
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Staff & Role Governance Summary */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-bold text-sm">
                {language === 'bn' ? 'রোল এবং সিস্টেম গভর্ন্যান্স' : 'Role & System Governance'}
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-400 block">Regular Users</span>
                  <span className="text-lg font-extrabold">{stats?.users?.regular || 0}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-400 block">Moderators</span>
                  <span className="text-lg font-extrabold text-amber-600">{stats?.users?.moderators || 0}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-400 block">Platform Admins</span>
                  <span className="text-lg font-extrabold text-blue-600">{stats?.users?.admins || 0}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-400 block">Super Admins</span>
                  <span className="text-lg font-extrabold text-emerald-600">{stats?.users?.superAdmins || 0}</span>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-900 dark:text-emerald-200">
                <strong>RBAC Security Active:</strong> Self-privilege escalation is blocked. Critical role assignments and global settings require <code>super_admin</code> authorization.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: MODERATION QUEUE (APPROVE & REJECT WITH REASON)
         ===================================================================== */}
      {activeTab === 'moderation' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold">
                {language === 'bn' ? 'বিজ্ঞাপন মডারেশন কিউ' : 'Pending Listing Moderation Queue'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'bn'
                  ? 'বিক্রেতাদের জমাকৃত বিজ্ঞাপন যাচাই করে অনুমোদন অথবা সুনির্দিষ্ট কারণসহ প্রত্যাখ্যান করুন'
                  : 'Inspect submitted seller listings and approve or reject with mandatory reason'}
              </p>
            </div>
            <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs font-extrabold">
              {listings.filter(l => l.moderationStatus === 'pending').length} Pending Ads
            </span>
          </div>

          <div className="space-y-4">
            {listings.filter(l => l.moderationStatus === 'pending').length > 0 ? (
              listings
                .filter(l => l.moderationStatus === 'pending')
                .map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={item.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200'}
                        alt=""
                        className="w-24 h-24 rounded-xl object-cover bg-slate-100 shrink-0"
                      />
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800">
                            Pending Review
                          </span>
                          <Badge variant="condition" condition={item.condition} />
                          <span className="text-xs text-slate-400">ID: #{item.id}</span>
                        </div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">{item.title}</h3>
                        <p className="text-xs text-slate-500 line-clamp-2 max-w-2xl">{item.description}</p>
                        <div className="text-xs font-bold text-emerald-600 flex flex-wrap items-center gap-2">
                          <span>{formatPrice(item.priceBdt)}</span>
                          <span>•</span>
                          <span>Phone: {item.contactPhone}</span>
                          <span>•</span>
                          <span>Seller ID: #{item.sellerId}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleApproveListing(item.id)}
                        icon={<CheckCircle2 className="w-4 h-4" />}
                      >
                        {language === 'bn' ? 'অনুমোদন করুন' : 'Approve'}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setRejectTarget(item);
                          setRejectReasonInput('');
                        }}
                        icon={<XCircle className="w-4 h-4" />}
                      >
                        {language === 'bn' ? 'প্রত্যাখ্যান' : 'Reject'}
                      </Button>
                    </div>
                  </div>
                ))
            ) : (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h3 className="font-bold text-sm">
                  {language === 'bn' ? 'মডারেশন কিউ সম্পূর্ণ পরিষ্কার!' : 'Moderation Queue Clear!'}
                </h3>
                <p className="text-xs text-slate-400">
                  {language === 'bn' ? 'বর্তমানে কোনো বিজ্ঞাপন রিভিউয়ের জন্য অপেক্ষমান নেই।' : 'No pending listings require review at this time.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: ALL LISTINGS MANAGEMENT (FEATURED & REMOVAL)
         ===================================================================== */}
      {activeTab === 'listings' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={listingSearch}
                onChange={(e) => setListingSearch(e.target.value)}
                placeholder={language === 'bn' ? 'শিরোনাম বা ফোন নম্বর দিয়ে খুঁজুন...' : 'Search by title or seller phone...'}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {['all', 'approved', 'pending', 'rejected', 'sold', 'archived'].map((st) => (
                <button
                  key={st}
                  onClick={() => setListingStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
                    listingStatusFilter === st
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800 font-bold">
                  <tr>
                    <th className="p-4">বিজ্ঞাপন / Listing</th>
                    <th className="p-4">মূল্য / Price</th>
                    <th className="p-4">মডারেশন / Status</th>
                    <th className="p-4">ফিচার্ড / Featured</th>
                    <th className="p-4 text-right">পদক্ষেপ / Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {listings.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=120'}
                            alt=""
                            className="w-11 h-11 rounded-lg object-cover shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white line-clamp-1">{item.title}</div>
                            <div className="text-[11px] text-slate-400">
                              ID #{item.id} • Seller #{item.sellerId} • {item.contactPhone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-extrabold text-emerald-600">{formatPrice(item.priceBdt)}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            item.moderationStatus === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.moderationStatus === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.moderationStatus}
                        </span>
                        <span className="ml-1.5 px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {item.availabilityStatus}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleFeatured(item)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                            item.isFeatured
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-amber-600'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${item.isFeatured ? 'fill-amber-500 text-amber-500' : ''}`} />
                          <span>{item.isFeatured ? 'Featured' : 'Standard'}</span>
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {item.moderationStatus !== 'approved' && (
                            <button
                              onClick={() => handleApproveListing(item.id)}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setRemoveTarget(item);
                              setRemoveReasonInput('');
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                            title="Remove / Take Down"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: ABUSE REPORT QUEUE (INVESTIGATE, RESOLVE, DISMISS)
         ===================================================================== */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold">
                {language === 'bn' ? 'অভিযোগ ও রিপোর্ট তদন্ত কিউ' : 'Abuse Report Investigation Queue'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'bn'
                  ? 'ব্যবহারকারীদের দাখিলকৃত রিপোর্ট তদন্ত করুন এবং সমাধানের নোট লিপিবদ্ধ করুন'
                  : 'Investigate user-submitted reports and record resolution notes'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {['all', 'pending', 'investigating', 'resolved', 'dismissed'].map((st) => (
                <button
                  key={st}
                  onClick={() => setReportStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize ${
                    reportStatusFilter === st
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        rep.status === 'pending'
                          ? 'bg-rose-100 text-rose-800'
                          : rep.status === 'investigating'
                          ? 'bg-blue-100 text-blue-800'
                          : rep.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {rep.status}
                    </span>
                    <span className="text-xs font-extrabold uppercase text-rose-600">[{rep.reasonCode}]</span>
                    <span className="text-xs text-slate-400">Report #{rep.id}</span>
                  </div>
                  <span className="text-xs text-slate-400">{new Date(rep.createdAt).toLocaleString()}</span>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-bold">
                    {rep.productTitle ? `Target Ad: ${rep.productTitle} (#${rep.productId})` : `Target User ID: #${rep.reportedUserId}`}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/70 p-3 rounded-xl">
                    "{rep.explanation}" — <span className="font-semibold">Reported by {rep.reporterName}</span>
                  </p>
                </div>

                {rep.resolutionNotes && (
                  <div className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900">
                    <strong>Resolution Note ({rep.reviewerName || 'Staff'}):</strong> {rep.resolutionNotes}
                  </div>
                )}

                {rep.status !== 'resolved' && rep.status !== 'dismissed' && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {rep.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkReportInvestigating(rep.id)}
                      >
                        {language === 'bn' ? 'তদন্ত শুরু করুন' : 'Mark Investigating'}
                      </Button>
                    )}
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setResolveTarget(rep);
                        setResolutionNotesInput(rep.resolutionNotes || '');
                      }}
                    >
                      {language === 'bn' ? 'মীমাংসা ও নোট যোগ করুন' : 'Resolve with Notes'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDismissReport(rep.id)}
                    >
                      {language === 'bn' ? 'খারিজ করুন' : 'Dismiss'}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 5: USER MANAGEMENT (SEARCH, PROFILE REVIEW, SUSPEND, ROLES)
         ===================================================================== */}
      {activeTab === 'users' && hasPermission('users:view_all') && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder={language === 'bn' ? 'নাম, ইমেইল বা ফোন নম্বর খুঁজুন...' : 'Search name, email, or phone...'}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {['all', 'user', 'moderator', 'admin', 'super_admin'].map((r) => (
                <button
                  key={r}
                  onClick={() => setUserRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize ${
                    userRoleFilter === r
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {r.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800 font-bold">
                  <tr>
                    <th className="p-4">ব্যবহারকারী / User</th>
                    <th className="p-4">যোগাযোগ / Contact</th>
                    <th className="p-4">রোল / Role (Super Admin Only)</th>
                    <th className="p-4">স্ট্যাটাস / Status</th>
                    <th className="p-4 text-right">পদক্ষেপ / Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {usersList.map((u) => {
                    const isSelf = currentUser?.id === u.id;
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-4 flex items-center gap-3">
                          <img
                            src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover"
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{u.fullName}</span>
                              {isSelf && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400">ID: #{u.id}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium">{u.phoneNumber}</div>
                          <div className="text-[11px] text-slate-400">{u.email}</div>
                        </td>
                        <td className="p-4">
                          {isSuperAdmin && !isSelf ? (
                            <select
                              value={u.roles[0] || 'user'}
                              onChange={(e) => handleChangeUserRole(u.id, e.target.value as UserRole)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-xs text-emerald-700 dark:text-emerald-400"
                            >
                              <option value="user">user</option>
                              <option value="moderator">moderator</option>
                              <option value="admin">admin</option>
                              <option value="super_admin">super_admin</option>
                            </select>
                          ) : (
                            <span
                              title={isSelf ? 'Cannot modify your own role' : 'Requires Super Admin privilege'}
                              className="inline-flex items-center gap-1 font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg"
                            >
                              <span>{u.roles.join(', ')}</span>
                              <Lock className="w-3 h-3 text-slate-400" />
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          {u.isSuspended ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              Suspended
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleInspectUser(u.id)}
                              icon={<Eye className="w-3.5 h-3.5" />}
                            >
                              {language === 'bn' ? 'প্রোফাইল' : 'Inspect'}
                            </Button>
                            {!isSelf && (
                              <Button
                                variant={u.isSuspended ? 'primary' : 'danger'}
                                size="sm"
                                onClick={() => {
                                  setSuspendTarget(u);
                                  setSuspendReasonInput(u.suspendedReason || '');
                                }}
                                icon={<Ban className="w-3.5 h-3.5" />}
                              >
                                {u.isSuspended
                                  ? language === 'bn' ? 'সক্রিয় করুন' : 'Reactivate'
                                  : language === 'bn' ? 'স্থগিত করুন' : 'Suspend'}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 6: CATEGORY & SUBCATEGORY CRUD
         ===================================================================== */}
      {activeTab === 'categories' && hasPermission('categories:manage') && (
        <div className="space-y-6">
          {/* Create Root Category Form */}
          <form
            onSubmit={handleCreateCategory}
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm"
          >
            <h3 className="font-extrabold text-sm flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-emerald-600" />
              <span>{language === 'bn' ? 'নতুন মূল ক্যাটাগরি তৈরি করুন' : 'Create New Root Category'}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="বাংলা নাম (যেমন: কৃষি পণ্য)"
                value={newCatNameBn}
                onChange={(e) => setNewCatNameBn(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
              <input
                type="text"
                placeholder="English Name (e.g. Agro)"
                value={newCatNameEn}
                onChange={(e) => setNewCatNameEn(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
              <input
                type="text"
                placeholder="Slug (e.g. agro-items)"
                value={newCatSlug}
                onChange={(e) => setNewCatSlug(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Icon (Smartphone)"
                  value={newCatIcon}
                  onChange={(e) => setNewCatIcon(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
                <Button type="submit" variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
                  Add
                </Button>
              </div>
            </div>
          </form>

          {/* Categories & Subcategories Tree */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <div className="font-extrabold text-sm">
                      {cat.nameBn} / {cat.nameEn}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      slug: <code>{cat.slug}</code> • icon: {cat.iconName}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSubcatParentId(subcatParentId === cat.id ? null : cat.id)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 text-xs font-bold"
                    >
                      + Subcategory
                    </button>
                    <button
                      onClick={() => setEditingCategory(cat)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Add Subcategory Inline Form */}
                {subcatParentId === cat.id && (
                  <form onSubmit={handleCreateSubcategory} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 space-y-2">
                    <div className="text-[11px] font-bold text-emerald-600">
                      Add Subcategory under {cat.nameEn}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="বাংলা নাম"
                        value={newSubNameBn}
                        onChange={(e) => setNewSubNameBn(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border text-xs bg-white dark:bg-slate-900"
                      />
                      <input
                        type="text"
                        placeholder="English"
                        value={newSubNameEn}
                        onChange={(e) => setNewSubNameEn(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border text-xs bg-white dark:bg-slate-900"
                      />
                      <input
                        type="text"
                        placeholder="slug"
                        value={newSubSlug}
                        onChange={(e) => setNewSubSlug(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border text-xs bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="submit" variant="primary" size="sm">
                        Save Subcategory
                      </Button>
                    </div>
                  </form>
                )}

                {/* Subcategory List */}
                <div className="flex flex-wrap gap-2">
                  {(cat.subcategories || []).map((sub) => (
                    <div
                      key={sub.id}
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs"
                    >
                      <span>{language === 'bn' ? sub.nameBn : sub.nameEn}</span>
                      <button
                        onClick={() => handleDeleteSubcategory(sub.id)}
                        className="text-slate-400 hover:text-rose-500 font-bold"
                        title="Delete Subcategory"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 7: BANNER MANAGEMENT
         ===================================================================== */}
      {activeTab === 'banners' && hasPermission('banners:manage') && (
        <div className="space-y-6">
          <form
            onSubmit={handleCreateBanner}
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm"
          >
            <h3 className="font-extrabold text-sm flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-600" />
              <span>{language === 'bn' ? 'নতুন প্রমোশনাল ব্যানার যুক্ত করুন' : 'Create Promotional Banner'}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Banner Title"
                value={newBannerTitle}
                onChange={(e) => setNewBannerTitle(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
              <input
                type="url"
                placeholder="Image URL (https://...)"
                value={newBannerImage}
                onChange={(e) => setNewBannerImage(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
              <input
                type="text"
                placeholder="Target Path (/products)"
                value={newBannerTarget}
                onChange={(e) => setNewBannerTarget(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
              <div className="flex gap-2">
                <select
                  value={newBannerPlacement}
                  onChange={(e) => setNewBannerPlacement(e.target.value as Banner['placement'])}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                >
                  <option value="home_hero">home_hero</option>
                  <option value="category_top">category_top</option>
                  <option value="sidebar">sidebar</option>
                </select>
                <Button type="submit" variant="primary" size="sm">
                  Create
                </Button>
              </div>
            </div>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {banners.map((b) => (
              <div
                key={b.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col"
              >
                <img src={b.imageUrl} alt={b.title} className="w-full h-36 object-cover bg-slate-100" />
                <div className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-sm">{b.title}</div>
                    <div className="text-[11px] text-slate-400">
                      Placement: <code>{b.placement}</code> • Target: {b.targetUrl}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleBannerActive(b)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        b.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {b.isActive ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => handleDeleteBanner(b.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 8: SITE SETTINGS & CONTACT INFORMATION (SUPER ADMIN RESTRICTED)
         ===================================================================== */}
      {activeTab === 'settings' && hasPermission('settings:view') && (
        <form
          onSubmit={handleSaveSettings}
          className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-extrabold">
                {language === 'bn' ? 'সাইট সেটিংস ও যোগাযোগের তথ্য' : 'Site Settings & Contact Configuration'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'bn'
                  ? 'মার্কেটপ্লেসের নাম, সাপোর্ট ইমেইল, ফোন নম্বর এবং মডারেশন পলিসি কনফিগার করুন'
                  : 'Configure marketplace branding, support contact details, and moderation rules'}
              </p>
            </div>
            {!isSuperAdmin && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 text-amber-800 text-xs font-bold">
                <Lock className="w-3.5 h-3.5" />
                <span>Read-Only (Super Admin Required to Save)</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-600 dark:text-slate-300">Marketplace Name (Bengali)</label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={settings.site_name_bn || ''}
                onChange={(e) => setSettings({ ...settings, site_name_bn: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 disabled:opacity-60"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-600 dark:text-slate-300">Marketplace Name (English)</label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={settings.site_name_en || ''}
                onChange={(e) => setSettings({ ...settings, site_name_en: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 disabled:opacity-60"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-600 dark:text-slate-300">Support Phone Number</label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={settings.support_phone || ''}
                onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 disabled:opacity-60"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-600 dark:text-slate-300">Support Email Address</label>
              <input
                type="email"
                disabled={!isSuperAdmin}
                value={settings.support_email || ''}
                onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 disabled:opacity-60"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-600 dark:text-slate-300">Require Pre-Moderation Approval</label>
              <select
                disabled={!isSuperAdmin}
                value={settings.require_ad_approval || 'true'}
                onChange={(e) => setSettings({ ...settings, require_ad_approval: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 disabled:opacity-60"
              >
                <option value="true">Enabled (All new ads enter moderation queue)</option>
                <option value="false">Disabled (Auto-approve listings)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-600 dark:text-slate-300">Max Images Per Listing</label>
              <input
                type="number"
                min={1}
                max={10}
                disabled={!isSuperAdmin}
                value={settings.max_images_per_ad || '5'}
                onChange={(e) => setSettings({ ...settings, max_images_per_ad: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 disabled:opacity-60"
              />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="font-bold text-slate-600 dark:text-slate-300">Safety Notice Banner (Bengali)</label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={settings.emergency_notice_bn || ''}
                onChange={(e) => setSettings({ ...settings, emergency_notice_bn: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 disabled:opacity-60"
              />
            </div>
          </div>

          {isSuperAdmin && (
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                isLoading={isSavingSettings}
                icon={<Save className="w-4 h-4" />}
              >
                {language === 'bn' ? 'সিস্টেম সেটিংস সংরক্ষণ করুন' : 'Save System Configuration'}
              </Button>
            </div>
          )}
        </form>
      )}

      {/* =====================================================================
          TAB 9: IMMUTABLE SECURITY AUDIT LOGS
         ===================================================================== */}
      {activeTab === 'audit' && hasPermission('audit_logs:view') && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-600" />
                <span>{language === 'bn' ? 'প্রশাসনিক অডিট লগ' : 'Administrative Security Audit Trail'}</span>
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'bn'
                  ? 'প্রতিটি সংবেদনশীল অ্যাকশন কে এবং কখন সম্পাদন করেছেন তার অপরিবর্তনীয় রেকর্ড'
                  : 'Immutable chronological record of who performed each sensitive action and when'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {['all', 'product', 'user', 'report', 'category', 'banner', 'settings'].map((et) => (
                <button
                  key={et}
                  onClick={() => setAuditEntityTypeFilter(et)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize ${
                    auditEntityTypeFilter === et
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {et}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-mono">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                        {log.action}
                      </span>
                      <span className="text-slate-500">
                        Target: <strong>{log.entityType} #{log.entityId}</strong>
                      </span>
                      <span className="text-slate-400">• Actor: {log.userName || `User #${log.userId}`} ({log.userRole})</span>
                    </div>
                    {log.newValues && (
                      <div className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 rounded">
                        Payload: {JSON.stringify(log.newValues)}
                      </div>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 shrink-0">
                    <div>{new Date(log.createdAt).toLocaleString()}</div>
                    <div>IP: {log.ipAddress}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODALS FOR CONFIRMATIONS, REASONS, AND PROFILE INSPECTION
         ===================================================================== */}

      {/* 1. Reject Listing Modal with Mandatory Reason */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-extrabold text-base text-rose-600">
              {language === 'bn' ? 'বিজ্ঞাপন প্রত্যাখ্যানের কারণ উল্লেখ করুন' : 'Reject Listing with Reason'}
            </h3>
            <p className="text-xs text-slate-500">
              Ad: <strong>{rejectTarget.title}</strong>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                'অস্পষ্ট বা অসত্য ছবি / Blurry or fake photos',
                'ভুল ক্যাটাগরি বা অস্বাভাবিক মূল্য / Invalid category or price',
                'নিষিদ্ধ বা নকল পণ্য / Prohibited or counterfeit item',
                'ডুপ্লিকেট বিজ্ঞাপন / Duplicate listing'
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRejectReasonInput(preset)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              value={rejectReasonInput}
              onChange={(e) => setRejectReasonInput(e.target.value)}
              placeholder={language === 'bn' ? 'বিক্রেতার জন্য সুনির্দিষ্ট কারণ লিখুন...' : 'Enter rejection reason for seller notification...'}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setRejectTarget(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirmRejectListing}>
                Confirm Reject
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Remove / Take-Down Listing Modal */}
      {removeTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-extrabold text-base text-rose-600">
              {language === 'bn' ? 'বিজ্ঞাপন অপসারণ নিশ্চিত করুন' : 'Confirm Administrative Take-Down'}
            </h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to remove <strong>{removeTarget.title}</strong>? This action is recorded in the audit log.
            </p>
            <input
              type="text"
              value={removeReasonInput}
              onChange={(e) => setRemoveReasonInput(e.target.value)}
              placeholder="Removal audit reason..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setRemoveTarget(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirmRemoveListing}>
                Remove Listing
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Suspend / Reactivate User Modal */}
      {suspendTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-extrabold text-base">
              {suspendTarget.isSuspended ? 'Reactivate User Account' : 'Suspend User Account'}
            </h3>
            <p className="text-xs text-slate-500">
              Target User: <strong>{suspendTarget.fullName}</strong> ({suspendTarget.email})
            </p>
            {!suspendTarget.isSuspended && (
              <textarea
                rows={3}
                value={suspendReasonInput}
                onChange={(e) => setSuspendReasonInput(e.target.value)}
                placeholder="Reason for suspension (recorded in security audit trail)..."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSuspendTarget(null)}>
                Cancel
              </Button>
              <Button
                variant={suspendTarget.isSuspended ? 'primary' : 'danger'}
                size="sm"
                onClick={handleConfirmSuspendToggle}
              >
                {suspendTarget.isSuspended ? 'Confirm Reactivate' : 'Confirm Suspend'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 4. User Profile Inspection Modal */}
      {selectedUserProfile && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-lg w-full rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={selectedUserProfile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-extrabold text-base">{selectedUserProfile.fullName}</h3>
                  <p className="text-xs text-slate-400">
                    {selectedUserProfile.email} • {selectedUserProfile.phoneNumber}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedUserProfile(null)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-400 block">Total Ads</span>
                <span className="text-base font-extrabold">{selectedUserProfile.stats?.totalListings || 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-400 block">Active</span>
                <span className="text-base font-extrabold text-emerald-600">{selectedUserProfile.stats?.activeListings || 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-400 block">Sold</span>
                <span className="text-base font-extrabold text-blue-600">{selectedUserProfile.stats?.soldListings || 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-400 block">Reports</span>
                <span className="text-base font-extrabold text-rose-600">{selectedUserProfile.stats?.reportsReceived || 0}</span>
              </div>
            </div>

            <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
              <div><strong>Roles:</strong> {selectedUserProfile.roles?.join(', ')}</div>
              <div><strong>Bio:</strong> {selectedUserProfile.bio || 'No bio provided'}</div>
              <div><strong>Account Status:</strong> {selectedUserProfile.isSuspended ? `Suspended (${selectedUserProfile.suspendedReason})` : 'Active & Verified'}</div>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedUserProfile(null)}>
                Close Profile Review
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Resolve Report Modal */}
      {resolveTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-extrabold text-base text-emerald-600">
              {language === 'bn' ? 'রিপোর্ট নিষ্পত্তি ও নোট সংরক্ষণ' : 'Resolve Report with Investigation Notes'}
            </h3>
            <p className="text-xs text-slate-500">
              Report #{resolveTarget.id} ({resolveTarget.reasonCode})
            </p>
            <textarea
              rows={3}
              value={resolutionNotesInput}
              onChange={(e) => setResolutionNotesInput(e.target.value)}
              placeholder="Document investigation findings and action taken..."
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setResolveTarget(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirmResolveReport}>
                Mark Resolved
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-extrabold text-base">Edit Category #{editingCategory.id}</h3>
            <div className="space-y-3 text-xs">
              <input
                type="text"
                value={editingCategory.nameBn}
                onChange={(e) => setEditingCategory({ ...editingCategory, nameBn: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                placeholder="Bengali Name"
              />
              <input
                type="text"
                value={editingCategory.nameEn}
                onChange={(e) => setEditingCategory({ ...editingCategory, nameEn: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                placeholder="English Name"
              />
              <input
                type="text"
                value={editingCategory.slug}
                onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                placeholder="Slug"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditingCategory(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveCategoryEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
