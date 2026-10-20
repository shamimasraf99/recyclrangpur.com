import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { FIXTURE_PRODUCTS } from '../fixtures/mockData';
import { ProductCard } from '../components/product/ProductCard';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';
import { WishlistService } from '../services/wishlistService';
import { Product } from '../../../shared/types';

export const WishlistPage: React.FC = () => {
  const { language } = useLanguage();
  const { wishlistIds, toggleWishlist } = useAuth();
  const [items, setItems] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    WishlistService.getWishlist()
      .then(res => {
        if (res.items && res.items.length > 0) {
          setItems(res.items);
        } else {
          setItems(FIXTURE_PRODUCTS.filter(p => wishlistIds.includes(p.id)));
        }
      })
      .catch(() => {
        setItems(FIXTURE_PRODUCTS.filter(p => wishlistIds.includes(p.id)));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [wishlistIds]);

  const savedProducts = items.filter(p => wishlistIds.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500 fill-current" />
            <span>{language === 'bn' ? 'পছন্দের বিজ্ঞাপনের তালিকা' : 'My Saved Wishlist'}</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {language === 'bn'
              ? `মোট ${savedProducts.length} টি পণ্য সংরক্ষণ করা আছে`
              : `${savedProducts.length} items saved for later inquiry`}
          </p>
        </div>

        {savedProducts.length > 0 && (
          <Link to="/products">
            <Button variant="outline" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
              {language === 'bn' ? 'আরও পণ্য দেখুন' : 'Browse More'}
            </Button>
          </Link>
        )}
      </div>

      {/* Grid */}
      {savedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {savedProducts.map(prod => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 p-12 shadow-sm">
          <EmptyState
            title={language === 'bn' ? 'পছন্দের তালিকা খালি' : 'Your wishlist is empty'}
            description={language === 'bn' ? 'যেকোনো পণ্যের ওপর হার্ট আইকনে ক্লিক করে পরবর্তীতে দেখার জন্য সংরক্ষণ করুন।' : 'Click the heart icon on any ad to bookmark it for later.'}
            actionText={language === 'bn' ? 'পণ্য ব্রাউজ করুন' : 'Browse Products'}
            onAction={() => window.location.href = '/products'}
            icon={<Heart className="w-8 h-8 text-rose-400" />}
          />
        </div>
      )}
    </div>
  );
};
