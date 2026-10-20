import { apiClient } from './api';
import { 
  Product, 
  User, 
  Category, 
  Banner, 
  AuditLogItem, 
  UserRole 
} from '../../../shared/types';
import { FIXTURE_PRODUCTS, FIXTURE_USERS, FIXTURE_CATEGORIES } from '../fixtures/mockData';

// Local stateful cache for development resilience while prioritizing live API
let localUsers: User[] = [...FIXTURE_USERS];
let localProducts: Product[] = [
  ...FIXTURE_PRODUCTS,
  {
    ...FIXTURE_PRODUCTS[0],
    id: 10,
    uuid: 'prod-pending-galaxy-s23',
    title: 'Samsung Galaxy S23 Ultra 12/256GB Green (Used 5 Months)',
    slug: 'samsung-galaxy-s23-ultra-256gb',
    priceBdt: 92000,
    moderationStatus: 'pending',
    availabilityStatus: 'available',
    isFeatured: false,
    createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString()
  },
  {
    ...FIXTURE_PRODUCTS[1],
    id: 11,
    uuid: 'prod-pending-canon-eos',
    title: 'Canon EOS R50 Mirrorless Camera with 18-45mm Kit Lens',
    slug: 'canon-eos-r50-mirrorless',
    priceBdt: 64500,
    moderationStatus: 'pending',
    availabilityStatus: 'available',
    isFeatured: false,
    createdAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString()
  }
];

let localCategories: Category[] = JSON.parse(JSON.stringify(FIXTURE_CATEGORIES));

export interface AdminReportItem {
  id: number;
  reporterId: number;
  reporterName: string;
  reporterEmail?: string;
  productId?: number | null;
  productTitle?: string | null;
  productPrice?: number | null;
  reportedUserId?: number | null;
  reportedUserName?: string | null;
  reasonCode: string;
  explanation: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  reviewerId?: number | null;
  reviewerName?: string | null;
  resolutionNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

let localReports: AdminReportItem[] = [
  {
    id: 1,
    reporterId: 101,
    reporterName: 'তানভীর আহমেদ',
    reporterEmail: 'tanvir@example.com',
    productId: 6,
    productTitle: 'Nikon D750 Full Frame DSLR Body Only',
    productPrice: 18500,
    reasonCode: 'misleading_description',
    explanation: 'বিজ্ঞাপনে শাটার কাউন্ট উল্লেখ করা হয়নি এবং ছবির সাথে বাস্তবের অমিল রয়েছে বলে সন্দেহ হচ্ছে।',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 6).toISOString()
  },
  {
    id: 2,
    reporterId: 102,
    reporterName: 'রাশেদুল করিম',
    reporterEmail: 'rashed.karim@example.com',
    productId: 1,
    productTitle: 'iPhone 14 Pro Max - 256GB Deep Purple',
    productPrice: 88500,
    reasonCode: 'fraud',
    explanation: 'বিক্রেতা অগ্রিম কুরিয়ার চার্জ দাবি করছেন যা মার্কেটপ্লেস নীতির পরিপন্থী।',
    status: 'investigating',
    reviewerId: 103,
    reviewerName: 'নুসরাত জাহান (মডারেটর)',
    resolutionNotes: 'বিক্রেতার সাথে ফোনে যোগাযোগ করে যাচাই করা হচ্ছে।',
    createdAt: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString()
  },
  {
    id: 3,
    reporterId: 101,
    reporterName: 'তানভীর আহমেদ',
    productId: 4,
    productTitle: 'Sony Bravia 55 Inch 4K UHD Smart Google TV',
    productPrice: 58000,
    reasonCode: 'duplicate_ad',
    explanation: 'একই টিভির বিজ্ঞাপন একাধিকবার পোস্ট করা হয়েছে।',
    status: 'resolved',
    reviewerId: 999,
    reviewerName: 'প্রধান সিস্টেম কন্ট্রোলার (Super Admin)',
    resolutionNotes: 'ডুপ্লিকেট বিজ্ঞাপনটি আর্কাইভ করা হয়েছে এবং বিক্রেতাকে সতর্ক করা হয়েছে।',
    createdAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString()
  }
];

let localBanners: Banner[] = [
  {
    id: 1,
    title: 'ঈদ স্পেশাল ইলেকট্রনিক্স ও গ্যাজেট মেলা - সরাসরি যাচাই করে কিনুন',
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&auto=format&fit=crop&q=80',
    targetUrl: '/category/mobiles-gadgets',
    placement: 'home_hero',
    isActive: true,
    sortOrder: 1,
    createdAt: '2026-10-01T00:00:00Z'
  },
  {
    id: 2,
    title: 'নিরাপদ লেনদেন নির্দেশিকা: পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন',
    imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&auto=format&fit=crop&q=80',
    targetUrl: '/products',
    placement: 'category_top',
    isActive: true,
    sortOrder: 2,
    createdAt: '2026-10-05T00:00:00Z'
  }
];

let localSettings: Record<string, string> = {
  site_name_bn: 'বিক্রয়বিডি (BikroyBD)',
  site_name_en: 'BikroyBD Marketplace',
  support_phone: '01700-000000',
  support_email: 'support@bikroybd.com',
  contact_address_bn: 'বাড়ি ১২, রোড ৫, ধানমন্ডি, ঢাকা-১২০৫, বাংলাদেশ',
  contact_address_en: 'House 12, Road 5, Dhanmondi, Dhaka-1205, Bangladesh',
  currency_symbol: '৳',
  require_ad_approval: 'true',
  max_images_per_ad: '5',
  emergency_notice_bn: 'সতর্কবার্তা: বিকাশ বা নগদে অগ্রীম টাকা পাঠাবেন না। সরাসরি পণ্য দেখে লেনদেন করুন।',
  emergency_notice_en: 'Safety Alert: Never send advance mobile money before inspecting the product in person.',
  emergency_notice_active: 'true'
};

export interface ExtendedAuditLog extends AuditLogItem {
  userName?: string;
  userEmail?: string;
}

let localAuditLogs: ExtendedAuditLog[] = [
  {
    id: 501,
    userId: 999,
    userName: 'প্রধান সিস্টেম কন্ট্রোলার (Super Admin)',
    userRole: 'super_admin',
    action: 'settings:updated',
    entityType: 'settings',
    entityId: 'global',
    ipAddress: '103.112.204.14',
    newValues: { require_ad_approval: 'true', max_images_per_ad: '5' },
    createdAt: new Date(Date.now() - 3600 * 1000 * 1).toISOString()
  },
  {
    id: 500,
    userId: 103,
    userName: 'নুসরাত জাহান (মডারেটর)',
    userRole: 'moderator',
    action: 'product:approved',
    entityType: 'product',
    entityId: '1',
    ipAddress: '103.112.204.22',
    newValues: { moderationStatus: 'approved' },
    createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString()
  },
  {
    id: 499,
    userId: 999,
    userName: 'প্রধান সিস্টেম কন্ট্রোলার (Super Admin)',
    userRole: 'super_admin',
    action: 'user:role_changed',
    entityType: 'user',
    entityId: '103',
    ipAddress: '103.112.204.14',
    oldValues: { role: 'user' },
    newValues: { role: 'moderator' },
    createdAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString()
  }
];

function recordLocalAudit(
  actor: { id?: number; fullName?: string; roles?: string[] } | null,
  action: string,
  entityType: string,
  entityId: string | number,
  newValues?: Record<string, unknown>,
  oldValues?: Record<string, unknown>
) {
  localAuditLogs.unshift({
    id: Date.now(),
    userId: actor?.id || 999,
    userName: actor?.fullName || 'System Staff',
    userRole: actor?.roles?.join(',') || 'admin',
    action,
    entityType,
    entityId: String(entityId),
    ipAddress: '127.0.0.1',
    oldValues: oldValues || null,
    newValues: newValues || null,
    createdAt: new Date().toISOString()
  });
}

export class AdminService {
  /**
   * 1. Dashboard Overview & Real Database Metrics
   */
  static async getStats() {
    try {
      const response = await apiClient.get('/admin/stats');
      return { data: response.data.data, isLive: true };
    } catch {
      const activeListings = localProducts.filter(p => p.moderationStatus === 'approved' && p.availabilityStatus === 'available').length;
      const pendingListings = localProducts.filter(p => p.moderationStatus === 'pending').length;
      const rejectedListings = localProducts.filter(p => p.moderationStatus === 'rejected').length;
      const soldListings = localProducts.filter(p => p.availabilityStatus === 'sold').length;
      const featuredListings = localProducts.filter(p => p.isFeatured).length;

      return {
        isLive: false,
        data: {
          users: {
            total: localUsers.length,
            active: localUsers.filter(u => !u.isSuspended).length,
            suspended: localUsers.filter(u => u.isSuspended).length,
            verified: localUsers.filter(u => u.isVerified).length,
            regular: localUsers.filter(u => u.roles.includes('user')).length,
            moderators: localUsers.filter(u => u.roles.includes('moderator')).length,
            admins: localUsers.filter(u => u.roles.includes('admin')).length,
            superAdmins: localUsers.filter(u => u.roles.includes('super_admin')).length
          },
          listings: {
            total: localProducts.length,
            active: activeListings,
            pending: pendingListings,
            rejected: rejectedListings,
            draft: localProducts.filter(p => p.moderationStatus === 'draft').length,
            sold: soldListings,
            featured: featuredListings
          },
          reports: {
            total: localReports.length,
            pending: localReports.filter(r => r.status === 'pending').length,
            investigating: localReports.filter(r => r.status === 'investigating').length,
            resolved: localReports.filter(r => r.status === 'resolved').length,
            dismissed: localReports.filter(r => r.status === 'dismissed').length
          },
          content: {
            categories: localCategories.filter(c => c.isActive).length,
            subcategories: localCategories.reduce((acc, c) => acc + (c.subcategories?.length || 0), 0),
            activeBanners: localBanners.filter(b => b.isActive).length
          },
          topCategories: localCategories.map(c => ({
            id: c.id,
            nameBn: c.nameBn,
            nameEn: c.nameEn,
            iconName: c.iconName,
            listingCount: localProducts.filter(p => p.categoryId === c.id).length
          }))
        }
      };
    }
  }

  /**
   * 2. User Management (Search, Profile Review, Suspend/Reactivate, Role Changes)
   */
  static async listUsers(params: { page?: number; limit?: number; search?: string; role?: string; status?: string }) {
    try {
      const response = await apiClient.get('/admin/users', { params });
      return {
        users: response.data.data,
        meta: response.data.meta,
        isLive: true
      };
    } catch {
      let filtered = [...localUsers];
      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(u =>
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phoneNumber.includes(q)
        );
      }
      if (params.role && params.role !== 'all') {
        filtered = filtered.filter(u => u.roles.includes(params.role as UserRole));
      }
      if (params.status === 'suspended') {
        filtered = filtered.filter(u => u.isSuspended);
      } else if (params.status === 'active') {
        filtered = filtered.filter(u => !u.isSuspended);
      }

      const page = params.page || 1;
      const limit = params.limit || 20;
      const totalItems = filtered.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / limit));

      return {
        users: filtered.slice((page - 1) * limit, page * limit),
        meta: { page, limit, totalItems, totalPages },
        isLive: false
      };
    }
  }

  static async getUserDetails(userId: number) {
    try {
      const response = await apiClient.get(`/admin/users/${userId}`);
      return response.data.data;
    } catch {
      const u = localUsers.find(user => user.id === userId);
      if (!u) throw new Error('User not found');
      const userListings = localProducts.filter(p => p.sellerId === userId);
      return {
        ...u,
        stats: {
          totalListings: userListings.length,
          activeListings: userListings.filter(p => p.moderationStatus === 'approved' && p.availabilityStatus === 'available').length,
          soldListings: userListings.filter(p => p.availabilityStatus === 'sold').length,
          reportsReceived: localReports.filter(r => r.reportedUserId === userId).length
        }
      };
    }
  }

  static async suspendUser(
    userId: number,
    isSuspended: boolean,
    reason?: string,
    actor?: { id: number; fullName: string; roles: string[] } | null
  ) {
    if (actor && actor.id === userId && isSuspended) {
      throw new Error('আপনি নিজের একাউন্ট স্থগিত করতে পারবেন না / Cannot suspend your own account');
    }
    try {
      const response = await apiClient.patch(`/admin/users/${userId}/suspend`, { isSuspended, reason });
      return response.data;
    } catch {
      localUsers = localUsers.map(u =>
        u.id === userId ? { ...u, isSuspended, suspendedReason: isSuspended ? (reason || 'Policy violation') : null } : u
      );
      recordLocalAudit(actor || null, 'user:suspend_toggled', 'user', userId, { isSuspended, reason });
      return { success: true };
    }
  }

  static async updateUserRole(
    userId: number,
    role: UserRole,
    actor?: { id: number; fullName: string; roles: string[] } | null
  ) {
    if (!actor || !actor.roles.includes('super_admin')) {
      throw new Error('শুধুমাত্র সুপার অ্যাডমিন রোল পরিবর্তন করতে পারেন / Only Super Admin can change roles');
    }
    if (actor.id === userId) {
      throw new Error('আপনি নিজের রোল পরিবর্তন করতে পারবেন না / Cannot modify your own administrative role');
    }
    try {
      const response = await apiClient.patch(`/admin/users/${userId}/role`, { role });
      return response.data;
    } catch {
      const target = localUsers.find(u => u.id === userId);
      const oldRoles = target?.roles || [];
      localUsers = localUsers.map(u => {
        if (u.id === userId) {
          const perms =
            role === 'super_admin'
              ? ['listings:moderate', 'reports:review', 'users:view_all', 'users:suspend', 'categories:manage', 'banners:manage', 'settings:view', 'settings:update', 'audit_logs:view', 'admins:manage_roles']
              : role === 'admin'
              ? ['listings:moderate', 'reports:review', 'users:view_all', 'users:suspend', 'categories:manage', 'banners:manage', 'settings:view', 'audit_logs:view']
              : role === 'moderator'
              ? ['listings:moderate', 'listings:view:pending', 'reports:review']
              : ['listings:create', 'listings:edit:own'];
          return { ...u, roles: [role], permissions: perms };
        }
        return u;
      });
      recordLocalAudit(actor, 'user:role_changed', 'user', userId, { role }, { oldRoles });
      return { success: true };
    }
  }

  /**
   * 3. Listings & Moderation Management
   */
  static async listListings(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    categoryId?: number;
    isFeatured?: boolean;
  }) {
    try {
      const response = await apiClient.get('/admin/listings', { params });
      return {
        items: response.data.data,
        meta: response.data.meta,
        isLive: true
      };
    } catch {
      let filtered = [...localProducts];
      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(p =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.contactPhone.includes(q)
        );
      }
      if (params.status && params.status !== 'all') {
        if (['pending', 'approved', 'rejected', 'draft'].includes(params.status)) {
          filtered = filtered.filter(p => p.moderationStatus === params.status);
        } else if (['sold', 'available', 'archived'].includes(params.status)) {
          filtered = filtered.filter(p => p.availabilityStatus === params.status);
        }
      }
      if (params.categoryId) {
        filtered = filtered.filter(p => p.categoryId === params.categoryId);
      }
      if (params.isFeatured !== undefined) {
        filtered = filtered.filter(p => p.isFeatured === params.isFeatured);
      }

      const page = params.page || 1;
      const limit = params.limit || 20;
      const totalItems = filtered.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / limit));

      return {
        items: filtered.slice((page - 1) * limit, page * limit),
        meta: { page, limit, totalItems, totalPages },
        isLive: false
      };
    }
  }

  static async approveListing(productId: number, actor?: { id: number; fullName: string; roles: string[] } | null) {
    try {
      const response = await apiClient.post(`/moderation/${productId}/approve`);
      return response.data;
    } catch {
      localProducts = localProducts.map(p =>
        p.id === productId ? { ...p, moderationStatus: 'approved', rejectReason: null } : p
      );
      recordLocalAudit(actor || null, 'product:approved', 'product', productId, { moderationStatus: 'approved' });
      return { success: true };
    }
  }

  static async rejectListing(
    productId: number,
    rejectReason: string,
    actor?: { id: number; fullName: string; roles: string[] } | null
  ) {
    if (!rejectReason.trim()) {
      throw new Error('প্রত্যাখ্যানের কারণ উল্লেখ করা আবশ্যক / Rejection reason is required');
    }
    try {
      const response = await apiClient.post(`/moderation/${productId}/reject`, { rejectReason });
      return response.data;
    } catch {
      localProducts = localProducts.map(p =>
        p.id === productId ? { ...p, moderationStatus: 'rejected', rejectReason } : p
      );
      recordLocalAudit(actor || null, 'product:rejected', 'product', productId, { moderationStatus: 'rejected', rejectReason });
      return { success: true };
    }
  }

  static async toggleFeatured(
    productId: number,
    isFeatured: boolean,
    actor?: { id: number; fullName: string; roles: string[] } | null
  ) {
    try {
      const response = await apiClient.patch(`/admin/listings/${productId}/featured`, { isFeatured });
      return response.data;
    } catch {
      localProducts = localProducts.map(p =>
        p.id === productId ? { ...p, isFeatured } : p
      );
      recordLocalAudit(actor || null, 'product:featured_toggled', 'product', productId, { isFeatured });
      return { success: true };
    }
  }

  static async removeListing(
    productId: number,
    reason?: string,
    actor?: { id: number; fullName: string; roles: string[] } | null
  ) {
    try {
      const response = await apiClient.delete(`/admin/listings/${productId}`, { data: { reason } });
      return response.data;
    } catch {
      localProducts = localProducts.map(p =>
        p.id === productId ? { ...p, availabilityStatus: 'archived', moderationStatus: 'rejected', rejectReason: reason || 'Removed by admin' } : p
      );
      recordLocalAudit(actor || null, 'product:removed', 'product', productId, { availabilityStatus: 'archived', reason });
      return { success: true };
    }
  }

  /**
   * 4. Category & Subcategory CRUD
   */
  static async getCategories() {
    try {
      const response = await apiClient.get('/categories?all=true');
      return response.data.data as Category[];
    } catch {
      return localCategories;
    }
  }

  static async createCategory(
    data: { nameBn: string; nameEn: string; slug: string; iconName: string; sortOrder?: number },
    actor?: { id: number; fullName: string; roles: string[] } | null
  ) {
    try {
      const response = await apiClient.post('/categories', data);
      return response.data;
    } catch {
      const newCat: Category = {
        id: Date.now(),
        nameBn: data.nameBn,
        nameEn: data.nameEn,
        slug: data.slug,
        iconName: data.iconName || 'Tag',
        sortOrder: data.sortOrder || localCategories.length + 1,
        isActive: true,
        subcategories: []
      };
      localCategories = [...localCategories, newCat];
      recordLocalAudit(actor || null, 'category:created', 'category', newCat.id, data);
      return { success: true, data: newCat };
    }
  }

  static async updateCategory(
    id: number,
    data: Partial<Category>,
    actor?: { id: number; fullName: string; roles: string[] } | null
  ) {
    try {
      const response = await apiClient.put(`/categories/${id}`, data);
      return response.data;
    } catch {
      localCategories = localCategories.map(c => (c.id === id ? { ...c, ...data } : c));
      recordLocalAudit(actor || null, 'category:updated', 'category', id, data as Record<string, unknown>);
      return { success: true };
    }
  }

  static async deleteCategory(id: number, actor?: { id: number; fullName: string; roles: string[] } | null) {
    try {
      const response = await apiClient.delete(`/categories/${id}`);
      return response.data;
    } catch {
      localCategories = localCategories.filter(c => c.id !== id);
      recordLocalAudit(actor || null, 'category:deleted', 'category', id);
      return { success: true };
    }
  }

  static async createSubcategory(
    categoryId: number,
    data: { nameBn: string; nameEn: string; slug: string; sortOrder?: number },
    actor?: { id: number; fullName: string; roles: string[] } | null
  ) {
    try {
      const response = await apiClient.post(`/categories/${categoryId}/subcategories`, data);
      return response.data;
    } catch {
      const subId = Date.now();
      localCategories = localCategories.map(c => {
        if (c.id === categoryId) {
          const subs = c.subcategories || [];
          return {
            ...c,
            subcategories: [
              ...subs,
              {
                id: subId,
                categoryId,
                nameBn: data.nameBn,
                nameEn: data.nameEn,
                slug: data.slug,
                sortOrder: data.sortOrder || subs.length + 1,
                isActive: true
              }
            ]
          };
        }
        return c;
      });
      recordLocalAudit(actor || null, 'subcategory:created', 'subcategory', subId, { categoryId, ...data });
      return { success: true };
    }
  }

  static async deleteSubcategory(
    subId: number,
    actor?: { id: number; fullName: string; roles: string[] } | null
  ) {
    try {
      const response = await apiClient.delete(`/categories/subcategories/${subId}`);
      return response.data;
    } catch {
      localCategories = localCategories.map(c => ({
        ...c,
        subcategories: (c.subcategories || []).filter(s => s.id !== subId)
      }));
      recordLocalAudit(actor || null, 'subcategory:deleted', 'subcategory', subId);
      return { success: true };
    }
  }

  /**
   * 5. Abuse Report Queue & Resolution
   */
  static async getReports(status?: string) {
    try {
      const response = await apiClient.get('/moderation/reports', { params: { status } });
      return response.data.data as AdminReportItem[];
    } catch {
      if (status && status !== 'all') {
        return localReports.filter(r => r.status === status);
      }
      return localReports;
    }
  }

  static async investigateReport(
    reportId: number,
    notes?: string,
    actor?: { id: number; fullName: string; roles: string[] } | null
  ) {
    try {
      const response = await apiClient.post(`/moderation/reports/${reportId}/investigate`, { notes });
      return response.data;
    } catch {
      localReports = localReports.map(r =>
        r.id === reportId
          ? {
              ...r,
              status: 'investigating',
              reviewerId: actor?.id || 103,
              reviewerName: actor?.fullName || 'Moderator',
              resolutionNotes: notes || r.resolutionNotes,
              updatedAt: new Date().toISOString()
            }
          : r
      );
      recordLocalAudit(actor || null, 'report:investigating', 'report', reportId, { status: 'investigating', notes });
      return { success: true };
    }
  }

  static async resolveReport(
    reportId: number,
    resolutionNotes: string,
    actor?: { id: number; fullName: string; roles: string[] } | null
  ) {
    if (!resolutionNotes.trim()) {
      throw new Error('মীমাংসার নোট প্রদান করা আবশ্যক / Resolution notes required');
    }
    try {
      const response = await apiClient.post(`/moderation/reports/${reportId}/resolve`, { resolutionNotes });
      return response.data;
    } catch {
      localReports = localReports.map(r =>
        r.id === reportId
          ? {
              ...r,
              status: 'resolved',
              reviewerId: actor?.id || 103,
              reviewerName: actor?.fullName || 'Moderator',
              resolutionNotes,
              updatedAt: new Date().toISOString()
            }
          : r
      );
      recordLocalAudit(actor || null, 'report:resolved', 'report', reportId, { status: 'resolved', resolutionNotes });
      return { success: true };
    }
  }

  static async dismissReport(
    reportId: number,
    resolutionNotes: string,
    actor?: { id: number; fullName: string; roles: string[] } | null
  ) {
    try {
      const response = await apiClient.post(`/moderation/reports/${reportId}/dismiss`, { resolutionNotes });
      return response.data;
    } catch {
      localReports = localReports.map(r =>
        r.id === reportId
          ? {
              ...r,
              status: 'dismissed',
              reviewerId: actor?.id || 103,
              reviewerName: actor?.fullName || 'Moderator',
              resolutionNotes: resolutionNotes || 'Dismissed after review',
              updatedAt: new Date().toISOString()
            }
          : r
      );
      recordLocalAudit(actor || null, 'report:dismissed', 'report', reportId, { status: 'dismissed', resolutionNotes });
      return { success: true };
    }
  }

  /**
   * 6. Banner Management
   */
  static async getBanners() {
    try {
      const response = await apiClient.get('/admin/banners');
      return response.data.data as Banner[];
    } catch {
      return localBanners;
    }
  }

  static async createBanner(
    data: { title: string; imageUrl: string; targetUrl?: string; placement: Banner['placement']; sortOrder?: number },
    actor?: { id: number; fullName: string; roles: string[] } | null
  ) {
    try {
      const response = await apiClient.post('/admin/banners', data);
      return response.data;
    } catch {
      const newBanner: Banner = {
        id: Date.now(),
        title: data.title,
        imageUrl: data.imageUrl,
        targetUrl: data.targetUrl || '/products',
        placement: data.placement || 'home_hero',
        isActive: true,
        sortOrder: data.sortOrder || localBanners.length + 1,
        createdAt: new Date().toISOString()
      };
      localBanners = [...localBanners, newBanner];
      recordLocalAudit(actor || null, 'banner:created', 'banner', newBanner.id, data as Record<string, unknown>);
      return { success: true, data: newBanner };
    }
  }

  static async updateBanner(
    id: number,
    data: Partial<Banner>,
    actor?: { id: number; fullName: string; roles: string[] } | null
  ) {
    try {
      const response = await apiClient.put(`/admin/banners/${id}`, data);
      return response.data;
    } catch {
      localBanners = localBanners.map(b => (b.id === id ? { ...b, ...data } : b));
      recordLocalAudit(actor || null, 'banner:updated', 'banner', id, data as Record<string, unknown>);
      return { success: true };
    }
  }

  static async deleteBanner(id: number, actor?: { id: number; fullName: string; roles: string[] } | null) {
    try {
      const response = await apiClient.delete(`/admin/banners/${id}`);
      return response.data;
    } catch {
      localBanners = localBanners.filter(b => b.id !== id);
      recordLocalAudit(actor || null, 'banner:deleted', 'banner', id);
      return { success: true };
    }
  }

  /**
   * 7. System Settings & Contact Info (Update Restricted to Super Admin)
   */
  static async getSettings() {
    try {
      const response = await apiClient.get('/admin/settings');
      return response.data.data as Record<string, string>;
    } catch {
      return { ...localSettings };
    }
  }

  static async updateSettings(
    settings: Record<string, string>,
    actor?: { id: number; fullName: string; roles: string[] } | null
  ) {
    if (!actor || !actor.roles.includes('super_admin')) {
      throw new Error('শুধুমাত্র সুপার অ্যাডমিন সিস্টেম সেটিংস পরিবর্তন করতে পারেন / Only Super Admin can modify system settings');
    }
    try {
      const response = await apiClient.put('/admin/settings', { settings });
      return response.data;
    } catch {
      const oldValues = { ...localSettings };
      localSettings = { ...localSettings, ...settings };
      recordLocalAudit(actor, 'settings:updated', 'settings', 'global', settings, oldValues);
      return { success: true };
    }
  }

  /**
   * 8. Audit Logs
   */
  static async getAuditLogs(params: { page?: number; limit?: number; action?: string; entityType?: string }) {
    try {
      const response = await apiClient.get('/admin/audit-logs', { params });
      return {
        logs: response.data.data as ExtendedAuditLog[],
        meta: response.data.meta
      };
    } catch {
      let filtered = [...localAuditLogs];
      if (params.action && params.action !== 'all') {
        filtered = filtered.filter(l => l.action === params.action);
      }
      if (params.entityType && params.entityType !== 'all') {
        filtered = filtered.filter(l => l.entityType === params.entityType);
      }
      const page = params.page || 1;
      const limit = params.limit || 20;
      return {
        logs: filtered.slice((page - 1) * limit, page * limit),
        meta: {
          page,
          limit,
          totalItems: filtered.length,
          totalPages: Math.max(1, Math.ceil(filtered.length / limit))
        }
      };
    }
  }
}
