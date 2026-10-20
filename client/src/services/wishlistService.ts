import { api } from './api';

export class WishlistService {
  static async getWishlist() {
    try {
      const response = await api.get('/wishlist');
      return { items: response.data.data, isLive: true };
    } catch {
      return { items: [], isLive: false };
    }
  }

  static async addToWishlist(productId: number) {
    try {
      await api.post(`/wishlist/${productId}`);
    } catch {
      // Graceful local handling
    }
  }

  static async removeFromWishlist(productId: number) {
    try {
      await api.delete(`/wishlist/${productId}`);
    } catch {
      // Graceful local handling
    }
  }
}
