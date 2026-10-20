/**
 * Shared Domain Types and Enums
 * Bangladesh Used Products Marketplace (BikroyBD)
 */

export type UserRole = 'guest' | 'user' | 'moderator' | 'admin' | 'super_admin';

export type ProductCondition = 'like_new' | 'good' | 'fair' | 'for_parts';

export type ModerationStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export type AvailabilityStatus = 'available' | 'reserved' | 'sold' | 'archived';

export type Language = 'bn' | 'en';

export type ContactChannel = 'phone_reveal' | 'whatsapp_click' | 'message';

export type ReportStatus = 'pending' | 'investigating' | 'resolved' | 'dismissed';

export interface User {
  id: number;
  uuid: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  avatarUrl?: string | null;
  bio?: string | null;
  isVerified: boolean;
  isSuspended: boolean;
  suspendedReason?: string | null;
  divisionId?: number | null;
  districtId?: number | null;
  upazilaId?: number | null;
  preferredLanguage: Language;
  roles: UserRole[];
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Division {
  id: number;
  nameBn: string;
  nameEn: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
}

export interface District {
  id: number;
  divisionId: number;
  nameBn: string;
  nameEn: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Upazila {
  id: number;
  districtId: number;
  nameBn: string;
  nameEn: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Category {
  id: number;
  nameBn: string;
  nameEn: string;
  slug: string;
  iconName: string;
  descriptionBn?: string | null;
  descriptionEn?: string | null;
  sortOrder: number;
  isActive: boolean;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: number;
  categoryId: number;
  nameBn: string;
  nameEn: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ProductImage {
  id: number;
  productId: number;
  imageUrl: string;
  thumbnailUrl: string;
  publicId?: string | null;
  sortOrder: number;
  isPrimary: boolean;
  width?: number | null;
  height?: number | null;
}

export interface Product {
  id: number;
  uuid: string;
  sellerId: number;
  seller?: {
    id: number;
    fullName: string;
    phoneNumber?: string;
    isVerified: boolean;
    avatarUrl?: string | null;
    createdAt: string;
  };
  title: string;
  slug: string;
  description: string;
  categoryId: number;
  category?: Category;
  subcategoryId: number;
  subcategory?: Subcategory;
  priceBdt: number;
  isNegotiable: boolean;
  condition: ProductCondition;
  divisionId: number;
  division?: Division;
  districtId: number;
  district?: District;
  upazilaId?: number | null;
  upazila?: Upazila | null;
  areaDetails?: string | null;
  contactPhone: string;
  hidePhone: boolean;
  allowWhatsapp: boolean;
  moderationStatus: ModerationStatus;
  rejectReason?: string | null;
  availabilityStatus: AvailabilityStatus;
  viewsCount: number;
  isFeatured: boolean;
  images: ProductImage[];
  isWishlisted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: number;
  reporterId: number;
  productId?: number | null;
  reportedUserId?: number | null;
  reasonCode: string;
  explanation: string;
  status: ReportStatus;
  reviewerId?: number | null;
  resolutionNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: number;
  userId: number;
  type: string;
  titleBn: string;
  titleEn: string;
  bodyBn: string;
  bodyEn: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: number;
  userId?: number | null;
  userRole?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress: string;
  userAgent?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  createdAt: string;
}

export type BannerPlacement = 'home_hero' | 'category_top' | 'sidebar';

export interface Banner {
  id: number;
  title: string;
  imageUrl: string;
  targetUrl?: string | null;
  placement: BannerPlacement;
  isActive: boolean;
  startAt?: string | null;
  endAt?: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface SiteSettings {
  siteNameBn: string;
  siteNameEn: string;
  supportPhone: string;
  supportEmail: string;
  currencySymbol: string;
  requireAdApproval: boolean;
  maxImagesPerAd: number;
  emergencyNoticeBn?: string;
  emergencyNoticeEn?: string;
  emergencyNoticeActive: boolean;
}

