import { api } from './api';
import { User } from '../../../shared/types';

export class AuthService {
  static async login(identifier: string, password: string): Promise<{ user: User; accessToken: string }> {
    const response = await api.post('/auth/login', { identifier, password });
    const { user, accessToken } = response.data.data;
    localStorage.setItem('bikroybd_token', accessToken);
    return { user, accessToken };
  }

  static async register(data: {
    fullName: string;
    email: string;
    phoneNumber: string;
    password: string;
    preferredLanguage?: 'bn' | 'en';
  }): Promise<{ user: User; accessToken: string }> {
    const response = await api.post('/auth/register', data);
    const { user, accessToken } = response.data.data;
    localStorage.setItem('bikroybd_token', accessToken);
    return { user, accessToken };
  }

  static async getMe(): Promise<User | null> {
    try {
      const response = await api.get('/auth/me');
      return response.data.data as User;
    } catch {
      return null;
    }
  }

  static async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {}
    localStorage.removeItem('bikroybd_token');
  }

  static async updateProfile(data: any): Promise<User> {
    const response = await api.put('/auth/profile', data);
    return response.data.data as User;
  }
}
