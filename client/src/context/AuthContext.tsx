import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../../../shared/types';
import { FIXTURE_USERS } from '../fixtures/mockData';
import { AuthService } from '../services/authService';
import { WishlistService } from '../services/wishlistService';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isModerator: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  hasPermission: (permissionCode: string) => boolean;
  wishlistIds: number[];
  login: (identifier: string, pass: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  loginAsUser: () => void;
  loginAsModerator: () => void;
  loginAsAdmin: () => void;
  loginAsSuperAdmin: () => void;
  switchRole: (role: UserRole) => void;
  logout: () => void;
  toggleWishlist: (productId: number) => void;
  updateCurrentUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return FIXTURE_USERS[0];
  });

  const [wishlistIds, setWishlistIds] = useState<number[]>([1, 3]);

  // Initial token check & session expiration listener
  useEffect(() => {
    const token = localStorage.getItem('bikroybd_token');
    if (token) {
      AuthService.getMe()
        .then((user) => {
          if (user) {
            setCurrentUser(user);
          } else {
            localStorage.removeItem('bikroybd_token');
          }
        })
        .catch(() => {});
    }

    WishlistService.getWishlist()
      .then((res) => {
        if (res.items && res.items.length > 0) {
          setWishlistIds(res.items.map((i: any) => i.id));
        }
      })
      .catch(() => {});

    const handleSessionExpired = () => {
      localStorage.removeItem('bikroybd_token');
      setCurrentUser(null);
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, []);

  const login = async (identifier: string, pass: string) => {
    try {
      const res = await AuthService.login(identifier, pass);
      setCurrentUser(res.user);
    } catch (err: any) {
      // If the live backend explicitly rejected the credentials (401/403/422), do NOT log the user in
      if (err.response) {
        throw err;
      }
      // Offline preview fallback: match fixture user by email or phone
      const normalized = identifier.trim().toLowerCase();
      const matched = FIXTURE_USERS.find(
        (u) => u.email.toLowerCase() === normalized || u.phoneNumber === identifier.trim()
      );
      if (!matched || pass.length < 6) {
        throw new Error('ভুল ইমেইল/ফোন অথবা পাসওয়ার্ড / Invalid email/phone or password');
      }
      if (matched.isSuspended) {
        throw new Error('আপনার একাউন্টটি সাময়িকভাবে স্থগিত করা হয়েছে / Account is suspended');
      }
      setCurrentUser(matched);
    }
  };

  const register = async (data: any) => {
    try {
      const res = await AuthService.register(data);
      setCurrentUser(res.user);
    } catch (err: any) {
      if (err.response) {
        throw err;
      }
      // Offline preview fallback: check duplicate email/phone in fixtures
      const exists = FIXTURE_USERS.some(
        (u) =>
          u.email.toLowerCase() === String(data.email || '').trim().toLowerCase() ||
          u.phoneNumber === String(data.phoneNumber || '').trim()
      );
      if (exists) {
        throw new Error('এই ইমেইল বা মোবাইল নম্বর দিয়ে ইতিমধ্যে একাউন্ট রয়েছে / Account already exists');
      }
      const newUser: User = {
        id: Math.floor(Date.now() / 1000),
        uuid: `user-${Date.now()}`,
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        isVerified: false,
        isSuspended: false,
        preferredLanguage: data.preferredLanguage || 'bn',
        roles: ['user'],
        permissions: ['listings:create', 'listings:edit_own', 'listings:delete_own', 'reports:create', 'wishlist:manage'],
        createdAt: new Date().toISOString()
      };
      setCurrentUser(newUser);
    }
  };

  const loginAsUser = () => {
    setCurrentUser(FIXTURE_USERS.find((u) => u.id === 101) || FIXTURE_USERS[0]);
  };

  const loginAsModerator = () => {
    setCurrentUser(FIXTURE_USERS.find((u) => u.id === 103) || FIXTURE_USERS[2]);
  };

  const loginAsAdmin = () => {
    setCurrentUser(FIXTURE_USERS.find((u) => u.id === 104) || FIXTURE_USERS[3]);
  };

  const loginAsSuperAdmin = () => {
    setCurrentUser(FIXTURE_USERS.find((u) => u.id === 999) || FIXTURE_USERS[FIXTURE_USERS.length - 1]);
  };

  const switchRole = (role: UserRole) => {
    if (role === 'guest') {
      localStorage.removeItem('bikroybd_token');
      setCurrentUser(null);
    } else if (role === 'user') {
      loginAsUser();
    } else if (role === 'moderator') {
      loginAsModerator();
    } else if (role === 'admin') {
      loginAsAdmin();
    } else if (role === 'super_admin') {
      loginAsSuperAdmin();
    }
  };

  const logout = () => {
    AuthService.logout().catch(() => {});
    localStorage.removeItem('bikroybd_token');
    setCurrentUser(null);
  };

  const toggleWishlist = (productId: number) => {
    setWishlistIds((prev) => {
      const isAlready = prev.includes(productId);
      if (isAlready) {
        WishlistService.removeFromWishlist(productId).catch(() => {});
        return prev.filter((id) => id !== productId);
      } else {
        WishlistService.addToWishlist(productId).catch(() => {});
        return [...prev, productId];
      }
    });
  };

  const updateCurrentUser = (user: User) => {
    setCurrentUser(user);
  };

  const isAuthenticated = currentUser !== null;
  const isSuperAdmin = Boolean(currentUser?.roles.includes('super_admin'));
  const isAdmin = Boolean(currentUser?.roles.includes('admin') || isSuperAdmin);
  const isModerator = Boolean(currentUser?.roles.includes('moderator') || isAdmin || isSuperAdmin);

  const hasPermission = (permissionCode: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.roles.includes('super_admin')) return true;
    return currentUser.permissions.includes(permissionCode);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isModerator,
        isAdmin,
        isSuperAdmin,
        hasPermission,
        wishlistIds,
        login,
        register,
        loginAsUser,
        loginAsModerator,
        loginAsAdmin,
        loginAsSuperAdmin,
        switchRole,
        logout,
        toggleWishlist,
        updateCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
