import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { FIXTURE_CATEGORIES, FIXTURE_PRODUCTS } from '../fixtures/mockData';
import { ProductCard } from '../components/product/ProductCard';
import { EmptyState } from '../components/common/EmptyState';
import { ProductService } from '../services/productService';
import { Product } from '../../../shared/types';

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();

  const category = FIXTURE_CATEGORIES.find(c => c.slug === slug);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!category) return;
    setIsLoading(true);
    ProductService.getProducts({ category: category.id })
      .then(res => {
        setProducts(res.products || []);
      })
      .catch(() => {
        setProducts(FIXTURE_PRODUCTS.filter(p => p.categoryId === category.id));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [category]);

  const categoryProducts = products;

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <EmptyState
          title={language === 'bn' ? 'ক্যাটাগরি পাওয়া যায়নি' : 'Category Not Found'}
          description={language === 'bn' ? 'আপনার অনুরোধকৃত ক্যাটাগরিটি বিদ্যমান নেই।' : 'The category you requested does not exist.'}
          actionText={language === 'bn' ? 'হোমে ফিরে যান' : 'Back to Home'}
          onAction={() => window.location.href = '/'}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <Link to="/" className="hover:text-emerald-600">হোম</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/products" className="hover:text-emerald-600">ক্যাটাগরি</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-bold text-gray-900 dark:text-white">
          {language === 'bn' ? category.nameBn : category.nameEn}
        </span>
      </nav>

      {/* Category Banner */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-800 rounded-2xl p-6 sm:p-8 text-white shadow-md">
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">
          {language === 'bn' ? category.nameBn : category.nameEn}
        </h1>
        <p className="text-emerald-100 text-xs sm:text-sm max-w-xl">
          {language === 'bn'
            ? `বাংলাদেশের সকল জেলার বিশ্বস্ত বিক্রেতাদের কাছ থেকে ${category.nameBn} সরাসরি কিনুন।`
            : `Browse pre-owned ${category.nameEn} directly from trusted local sellers across Bangladesh.`}
        </p>

        {/* Subcategories Pill List */}
        {category.subcategories && category.subcategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-emerald-600/60">
            {category.subcategories.map(sub => (
              <Link
                key={sub.id}
                to={`/products?category=${category.id}&subcategory=${sub.id}`}
                className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold backdrop-blur-sm transition-all"
              >
                {language === 'bn' ? sub.nameBn : sub.nameEn}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Product Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            {language === 'bn' ? `বিজ্ঞাপন সংখ্যা: ${categoryProducts.length} টি` : `Total items: ${categoryProducts.length}`}
          </span>
        </div>

        {categoryProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {categoryProducts.map(prod => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-8">
            <EmptyState
              title={language === 'bn' ? 'এই ক্যাটাগরিতে কোনো বিজ্ঞাপন নেই' : 'No listings in this category yet'}
              description={language === 'bn' ? 'আপনি প্রথম বিজ্ঞাপন পোস্ট করে বিক্রয় শুরু করতে পারেন!' : 'Be the first to post an ad in this category!'}
              actionText={language === 'bn' ? 'বিজ্ঞাপন দিন' : 'Post Free Ad'}
              onAction={() => window.location.href = '/post-ad'}
            />
          </div>
        )}
      </div>
    </div>
  );
};
