import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { Footer } from './components/layout/Footer';
import { LocationSelectorModal } from './components/location/LocationSelectorModal';

// User Pages (Exclusively User Marketplace — Admin is served on separate admin.* domain)
import { HomePage } from './pages/HomePage';
import { ProductListingPage } from './pages/ProductListingPage';
import { CategoryPage } from './pages/CategoryPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ProfilePage } from './pages/auth/ProfilePage';
import { SellerDashboardPage } from './pages/SellerDashboardPage';
import { PostAdPage } from './pages/PostAdPage';
import { WishlistPage } from './pages/WishlistPage';
import { PublicSellerProfilePage } from './pages/PublicSellerProfilePage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { NotFoundPage } from './pages/NotFoundPage';

const AppContent: React.FC = () => {
  const { language } = useLanguage();

  // Admin panel is hosted strictly on a separate domain (e.g. admin.recyclrangpur.com)
  const isDedicatedAdminDomain =
    typeof window !== 'undefined' && window.location.hostname.startsWith('admin.');

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [selectedLocationLabel, setSelectedLocationLabel] = useState<string>(
    language === 'bn' ? 'রংপুর শহর (সব এলাকা)' : 'Rangpur City (All Areas)'
  );
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | undefined>(undefined);

  // If accessed via the separate admin domain (admin.recyclrangpur.com), render only the Admin Portal
  if (isDedicatedAdminDomain) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 transition-colors">
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<AdminDashboardPage />} />
            <Route path="/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="*" element={<AdminDashboardPage />} />
          </Routes>
        </main>
      </div>
    );
  }

  // Default User App: Exclusively for Rangpur City buyers & sellers (No Admin Panel routes or links)
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 transition-colors">
      <Navbar
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
        selectedLocationName={selectedLocationLabel}
      />

      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                onOpenLocationModal={() => setIsLocationModalOpen(true)}
                selectedLocationLabel={selectedLocationLabel}
              />
            }
          />
          <Route path="/products" element={<ProductListingPage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/dashboard" element={<SellerDashboardPage />} />
          <Route path="/post-ad" element={<PostAdPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/seller/:id" element={<PublicSellerProfilePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />
      <MobileBottomNav />

      {/* Rangpur City Area Selector Modal */}
      <LocationSelectorModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        selectedDistrictId={selectedDistrictId}
        onSelectLocation={(loc) => {
          setSelectedLocationLabel(loc.label);
          setSelectedDistrictId(loc.district?.id);
        }}
      />
    </div>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
