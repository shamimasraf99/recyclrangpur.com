import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, MapPin, Calendar, Phone, MessageSquare, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { FIXTURE_USERS, FIXTURE_PRODUCTS } from '../fixtures/mockData';
import { ProductCard } from '../components/product/ProductCard';
import { EmptyState } from '../components/common/EmptyState';
import { ProductService } from '../services/productService';
import { User, Product } from '../../../shared/types';

export const PublicSellerProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();

  const [seller, setSeller] = useState<any>(null);
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const sellerId = parseInt(id || '0', 10);
    ProductService.getPublicSellerProfile(sellerId)
      .then(res => {
        if (res.data) {
          setSeller(res.data.seller);
          setSellerProducts(res.data.listings || []);
        }
      })
      .catch(() => {
        const fallbackSeller = FIXTURE_USERS.find(u => u.id === sellerId) || FIXTURE_USERS[0];
        setSeller(fallbackSeller);
        setSellerProducts(FIXTURE_PRODUCTS.filter(p => p.sellerId === fallbackSeller.id && p.availabilityStatus === 'available'));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading || !seller) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-24" />
        <div className="h-44 bg-gray-200 dark:bg-slate-700 rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-64 bg-gray-200 dark:bg-slate-700 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Back button */}
      <Link to="/products" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-emerald-600 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{language === 'bn' ? 'বিজ্ঞাপনে ফিরে যান' : 'Back to Listings'}</span>
      </Link>

      {/* Seller Header Card */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
        <img
          src={seller.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
          alt={seller.fullName}
          className="w-24 h-24 rounded-full object-cover ring-4 ring-emerald-500/20 shrink-0"
        />

        <div className="space-y-2 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center md:justify-start">
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
              {seller.fullName}
            </h1>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 self-center">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'যাচাইকৃত বিক্রেতা' : 'Verified Seller'}</span>
            </span>
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-300 max-w-xl">
            {seller.bio || (language === 'bn' ? 'নিয়মিত ব্যবহৃত ও ফ্রেশ পণ্য বিক্রয়কারী।' : 'Regular seller of quality pre-owned goods.')}
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-gray-400 pt-2">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>ঢাকা, বাংলাদেশ</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'সদস্য: নভেম্বর ২০২৫ থেকে' : 'Member since Nov 2025'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Seller's Listings */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          {language === 'bn' ? `${seller.fullName}-এর বিজ্ঞাপনসমূহ` : `Active Listings by ${seller.fullName}`}
          <span className="text-xs text-gray-400 font-normal ml-2">({sellerProducts.length})</span>
        </h2>

        {sellerProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {sellerProducts.map(prod => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 p-8 text-center">
            <EmptyState
              title={language === 'bn' ? 'এই বিক্রেতার কোনো সক্রিয় বিজ্ঞাপন নেই' : 'No active ads from this seller'}
              description={language === 'bn' ? 'বিক্রেতার সকল পণ্য ইতিমধ্যে বিক্রি হয়ে থাকতে পারে।' : 'All items from this seller may have been sold.'}
            />
          </div>
        )}
      </div>
    </div>
  );
};
