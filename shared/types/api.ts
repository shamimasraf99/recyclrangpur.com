/**
 * API Request & Response Contracts
 * Bangladesh Used Products Marketplace (BikroyBD)
 */
import { Product, ProductCondition, ModerationStatus, AvailabilityStatus, User, UserRole } from './index';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: PaginationMeta;
  error?: ApiError;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Array<{ field: string; message: string }>;
}

export interface ProductFilterQuery {
  page?: number;
  limit?: number;
  q?: string;
  category?: string | number;
  subcategory?: string | number;
  division?: string | number;
  district?: string | number;
  upazila?: string | number;
  condition?: ProductCondition;
  minPrice?: number;
  maxPrice?: number;
  isNegotiable?: boolean;
  sort?: 'newest' | 'price_low_high' | 'price_high_low' | 'most_viewed';
}

export interface CreateProductDto {
  title: string;
  description: string;
  categoryId: number;
  subcategoryId: number;
  priceBdt: number;
  isNegotiable: boolean;
  condition: ProductCondition;
  divisionId: number;
  districtId: number;
  upazilaId?: number | null;
  areaDetails?: string;
  contactPhone: string;
  hidePhone?: boolean;
  allowWhatsapp?: boolean;
  imageUrls: string[];
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  availabilityStatus?: AvailabilityStatus;
}

export interface ModerationDecisionDto {
  action: 'approve' | 'reject';
  rejectReason?: string;
}

export interface RegisterDto {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  preferredLanguage?: 'bn' | 'en';
}

export interface LoginDto {
  identifier: string; // email or phone
  password: string;
}

export interface AuthSessionResponse {
  user: User;
  accessToken: string;
  expiresInSeconds: number;
}

export interface CreateReportDto {
  productId?: number;
  reportedUserId?: number;
  reasonCode: string;
  explanation: string;
}

export interface AdminStatsResponse {
  totalUsers: number;
  totalActiveListings: number;
  totalPendingModeration: number;
  totalReportsPending: number;
  totalListingsSold: number;
}
