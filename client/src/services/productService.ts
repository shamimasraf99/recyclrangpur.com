import { api } from './api';
import { Product, ProductCondition, AvailabilityStatus } from '../../../shared/types';
import { FIXTURE_PRODUCTS } from '../fixtures/mockData';

export interface ProductFilters {
  page?: number;
  limit?: number;
  q?: string;
  category?: string | number;
  subcategory?: string | number;
  division?: string | number;
  district?: string | number;
  condition?: ProductCondition;
  minPrice?: number;
  maxPrice?: number;
  isNegotiable?: boolean;
  sort?: 'newest' | 'price_low_high' | 'price_high_low' | 'most_viewed';
}

export class ProductService {
  /**
   * Search public active listings
   */
  static async getProducts(filters: ProductFilters = {}) {
    try {
      const response = await api.get('/products', { params: filters });
      return {
        products: response.data.data as Product[],
        meta: response.data.meta,
        isLive: true
      };
    } catch (err) {
      console.warn('[API] Backend offline or unreachable, serving development fixtures');
      // Fallback to local development fixtures
      let list = FIXTURE_PRODUCTS.filter(p => p.availabilityStatus === 'available');
      if (filters.q) {
        const q = filters.q.toLowerCase();
        list = list.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
      }
      if (filters.category) {
        list = list.filter(p => p.categoryId === Number(filters.category));
      }
      if (filters.division) {
        list = list.filter(p => p.divisionId === Number(filters.division));
      }
      if (filters.condition) {
        list = list.filter(p => p.condition === filters.condition);
      }
      return {
        products: list,
        meta: { page: 1, limit: 24, totalItems: list.length, totalPages: 1 },
        isLive: false
      };
    }
  }

  /**
   * Get single product detail
   */
  static async getProductById(id: string | number) {
    try {
      const response = await api.get(`/products/${id}`);
      return { product: response.data.data as Product, isLive: true };
    } catch (err) {
      const fallback = FIXTURE_PRODUCTS.find(p => p.id === Number(id));
      return { product: fallback || null, isLive: false };
    }
  }

  /**
   * Create new product listing (draft or pending)
   */
  static async createProduct(data: {
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
    hidePhone: boolean;
    allowWhatsapp: boolean;
    imageUrls: string[];
    moderationStatus?: 'draft' | 'pending';
  }) {
    const response = await api.post('/products', data);
    return response.data;
  }

  /**
   * Update existing product listing
   */
  static async updateProduct(id: number, data: any) {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  }

  /**
   * Update availability status (e.g. mark sold or reserved)
   */
  static async updateStatus(id: number, availabilityStatus: AvailabilityStatus) {
    const response = await api.patch(`/products/${id}/status`, { availabilityStatus });
    return response.data;
  }

  /**
   * Soft delete listing
   */
  static async deleteProduct(id: number) {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  }

  /**
   * Get seller's own listings
   */
  static async getSellerListings() {
    try {
      const response = await api.get('/seller/listings');
      return { listings: response.data.data, isLive: true };
    } catch (err) {
      return { listings: FIXTURE_PRODUCTS.slice(0, 3), isLive: false };
    }
  }

  /**
   * Submit draft ad for approval
   */
  static async submitDraftForApproval(id: number) {
    const response = await api.post(`/seller/products/${id}/submit`);
    return response.data;
  }

  /**
   * Telemetry: track seller contact action
   */
  static async trackContact(productId: number, sellerId: number, channel: 'phone_reveal' | 'whatsapp_click') {
    try {
      await api.post('/seller/contacts/track', { productId, sellerId, channel });
    } catch {
      // Non-blocking telemetry
    }
  }

  /**
   * Get public seller profile
   */
  static async getPublicSellerProfile(sellerId: number) {
    try {
      const response = await api.get(`/seller/${sellerId}`);
      return { data: response.data.data, isLive: true };
    } catch (err) {
      return {
        data: {
          seller: { id: sellerId, fullName: 'Seller', isVerified: true, createdAt: '2025-11-10T10:00:00Z' },
          listings: FIXTURE_PRODUCTS.filter(p => p.sellerId === sellerId)
        },
        isLive: false
      };
    }
  }
}
