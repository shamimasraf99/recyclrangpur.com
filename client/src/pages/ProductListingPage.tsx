import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Filter,
  X,
  ArrowUpDown,
  Search,
  SlidersHorizontal,
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import {
  FIXTURE_CATEGORIES,
  FIXTURE_DIVISIONS,
  FIXTURE_DISTRICTS
} from '../fixtures/mockData';
import { ProductCard } from '../components/product/ProductCard';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { ProductCondition } from '../../../shared/types';
import { ProductService } from '../services/productService';

export const ProductListingPage: React.FC = () => {
  const { language, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // URL Query Parameters
  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') ? parseInt(searchParams.get('category')!, 10) : null;
  const divisionParam = searchParams.get('division') ? parseInt(searchParams.get('division')!, 10) : null;
  const districtParam = searchParams.get('district') ? parseInt(searchParams.get('district')!, 10) : null;
  const conditionParam = searchParams.get('condition') as ProductCondition | null;
  const minPriceParam = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!, 10) : '';
  const maxPriceParam = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!, 10) : '';
  const negotiableParam = searchParams.get('isNegotiable') === 'true';
  const sortParam = searchParams.get('sort') || 'newest';

  // Local Filter States for inputs
  const [searchInput, setSearchInput] = useState(queryParam);
  const [minPriceInput, setMinPriceInput] = useState(minPriceParam.toString());
  const [maxPriceInput, setMaxPriceInput] = useState(maxPriceParam.toString());

  // API State
  const [products, setProducts] = useState<any[]>([]);
  const [meta, setMeta] = useState<{ page: number; limit: number; totalItems: number; totalPages: number }>({
    page: 1,
    limit: 24,
    totalItems: 0,
    totalPages: 1
  });
  const [isLoading, setIsLoading] = useState(true);

  const currentPage = searchParams.get('page') ? Math.max(1, parseInt(searchParams.get('page')!, 10) || 1) : 1;

  // Fetch products on parameter changes
  React.useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const filterObj: any = {
      page: currentPage,
      limit: 24,
      q: queryParam || undefined,
      category: categoryParam || undefined,
      division: divisionParam || undefined,
      district: districtParam || undefined,
      condition: conditionParam || undefined,
      minPrice: minPriceParam ? Number(minPriceParam) : undefined,
      maxPrice: maxPriceParam ? Number(maxPriceParam) : undefined,
      isNegotiable: negotiableParam ? true : undefined,
      sort: sortParam as any
    };

    ProductService.getProducts(filterObj)
      .then((res) => {
        if (!isMounted) return;
        setProducts(res.products);
        setMeta(res.meta);
      })
      .catch(() => {
        if (!isMounted) return;
        setProducts([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    currentPage,
    queryParam,
    categoryParam,
    divisionParam,
    districtParam,
    conditionParam,
    minPriceParam,
    maxPriceParam,
    negotiableParam,
    sortParam
  ]);

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value === null || value === '') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    if (key === 'division') {
      next.delete('district');
    }
    // Reset to page 1 on filter changes
    if (key !== 'page') {
      next.delete('page');
    }
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setMinPriceInput('');
    setMaxPriceInput('');
    setSearchParams(new URLSearchParams());
  };

  const filteredProducts = products;
  const totalCount = meta.totalItems || filteredProducts.length;

  const activeFiltersCount = [
    queryParam,
    categoryParam,
    divisionParam,
    districtParam,
    conditionParam,
    minPriceParam,
    maxPriceParam,
    negotiableParam ? 'true' : null
  ].filter(Boolean).length;

  const availableDistricts = divisionParam
    ? FIXTURE_DISTRICTS.filter((d) => d.divisionId === divisionParam)
    : FIXTURE_DISTRICTS;

  const renderFilterControls = () => (
    <div className="space-y-6">
      {/* Categories Filter */}
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
          {language === 'bn' ? 'ক্যাটাগরি' : 'Category'}
        </label>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => updateParam('category', null)}
            className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
              !categoryParam
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold'
                : 'hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {language === 'bn' ? 'সকল ক্যাটাগরি' : 'All Categories'}
          </button>
          {FIXTURE_CATEGORIES.map((cat) => (
            <button
              type="button"
              key={cat.id}
              onClick={() => updateParam('category', cat.id.toString())}
              className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                categoryParam === cat.id
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold'
                  : 'hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {language === 'bn' ? cat.nameBn : cat.nameEn}
            </button>
          ))}
        </div>
      </div>

      {/* City Scope */}
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
          {language === 'bn' ? 'শহর' : 'City'}
        </label>
        <div className="w-full text-xs p-2.5 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-500/30 rounded-xl">
          {language === 'bn' ? '📍 রংপুর মেট্রোপলিটন শহর' : '📍 Rangpur Metropolitan City'}
        </div>
      </div>

      {/* Rangpur City Area Filter */}
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
          {language === 'bn' ? 'রংপুর শহরের এলাকা' : 'Rangpur City Area'}
        </label>
        <select
          aria-label={language === 'bn' ? 'রংপুর শহরের এলাকা নির্বাচন করুন' : 'Select Rangpur City Area'}
          value={districtParam?.toString() || ''}
          onChange={(e) => updateParam('district', e.target.value || null)}
          className="w-full text-xs p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none"
        >
          <option value="">{language === 'bn' ? 'রংপুর শহর (সব এলাকা)' : 'All Rangpur City Areas'}</option>
          {availableDistricts.map((dist) => (
            <option key={dist.id} value={dist.id}>
              {language === 'bn' ? dist.nameBn : dist.nameEn}
            </option>
          ))}
        </select>
      </div>

      {/* Condition Filter */}
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
          {language === 'bn' ? 'পণ্যের অবস্থা' : 'Condition'}
        </label>
        <div className="space-y-1.5">
          {(['like_new', 'good', 'fair', 'for_parts'] as ProductCondition[]).map((cond) => (
            <label
              key={cond}
              className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer select-none"
            >
              <input
                type="radio"
                name="condition_filter"
                checked={conditionParam === cond}
                onChange={() => updateParam('condition', cond)}
                className="text-emerald-600 focus:ring-emerald-500 rounded"
              />
              <span>{t(`condition.${cond}`)}</span>
            </label>
          ))}
          {conditionParam && (
            <button
              type="button"
              onClick={() => updateParam('condition', null)}
              className="text-[11px] text-gray-400 hover:text-rose-500 mt-1 block"
            >
              {language === 'bn' ? 'শর্ত মুছুন' : 'Clear condition'}
            </button>
          )}
        </div>
      </div>

      {/* Price Filter (BDT) */}
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
          {language === 'bn' ? 'মূল্য সীমা (৳ BDT)' : 'Price Range (BDT)'}
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min="0"
            aria-label="Minimum price BDT"
            placeholder={language === 'bn' ? 'সর্বনিম্ন' : 'Min'}
            value={minPriceInput}
            onChange={(e) => setMinPriceInput(e.target.value)}
            onBlur={() => updateParam('minPrice', minPriceInput || null)}
            className="w-full text-xs p-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg"
          />
          <input
            type="number"
            min="0"
            aria-label="Maximum price BDT"
            placeholder={language === 'bn' ? 'সর্বোচ্চ' : 'Max'}
            value={maxPriceInput}
            onChange={(e) => setMaxPriceInput(e.target.value)}
            onBlur={() => updateParam('maxPrice', maxPriceInput || null)}
            className="w-full text-xs p-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg"
          />
        </div>
      </div>

      {/* Negotiable Price Toggle */}
      <div className="pt-2">
        <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={negotiableParam}
            onChange={(e) => updateParam('isNegotiable', e.target.checked ? 'true' : null)}
            className="text-emerald-600 focus:ring-emerald-500 rounded"
          />
          <span>{language === 'bn' ? 'শুধুমাত্র আলোচনা সাপেক্ষ পণ্য' : 'Negotiable price only'}</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header & Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {language === 'bn' ? 'সকল পণ্য অনুসন্ধান' : 'Browse All Products'}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {language === 'bn'
                ? `মোট ${totalCount} টি বিজ্ঞাপন পাওয়া গেছে`
                : `Found ${totalCount} verified listings`}
            </p>
          </div>

          {/* Quick Keyword Search Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateParam('q', searchInput.trim() || null);
            }}
            className="flex items-center gap-2 max-w-md w-full"
          >
            <div className="relative flex-1">
              <input
                type="text"
                aria-label={language === 'bn' ? 'কীওয়ার্ড দিয়ে খুঁজুন' : 'Search by keyword'}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={language === 'bn' ? 'কীওয়ার্ড দিয়ে খুঁজুন...' : 'Search by keyword...'}
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
            <Button type="submit" size="sm" variant="primary">
              {language === 'bn' ? 'খুঁজুন' : 'Search'}
            </Button>
          </form>
        </div>

        {/* Filter Chips Bar */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-slate-700/60">
            <span className="text-xs font-semibold text-gray-400">
              {language === 'bn' ? 'সক্রিয় ফিল্টার:' : 'Active Filters:'}
            </span>

            {queryParam && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200">
                "{queryParam}"
                <button
                  type="button"
                  aria-label="Clear keyword filter"
                  onClick={() => {
                    setSearchInput('');
                    updateParam('q', null);
                  }}
                >
                  <X className="w-3 h-3 hover:text-rose-600" />
                </button>
              </span>
            )}

            {categoryParam && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                {FIXTURE_CATEGORIES.find((c) => c.id === categoryParam)?.nameBn || 'Category'}
                <button
                  type="button"
                  aria-label="Clear category filter"
                  onClick={() => updateParam('category', null)}
                >
                  <X className="w-3 h-3 hover:text-rose-600" />
                </button>
              </span>
            )}

            {divisionParam && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300">
                {FIXTURE_DIVISIONS.find((d) => d.id === divisionParam)?.nameBn || 'Division'}
                <button
                  type="button"
                  aria-label="Clear division filter"
                  onClick={() => updateParam('division', null)}
                >
                  <X className="w-3 h-3 hover:text-rose-600" />
                </button>
              </span>
            )}

            {districtParam && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300">
                {FIXTURE_DISTRICTS.find((d) => d.id === districtParam)?.nameBn || 'District'}
                <button
                  type="button"
                  aria-label="Clear district filter"
                  onClick={() => updateParam('district', null)}
                >
                  <X className="w-3 h-3 hover:text-rose-600" />
                </button>
              </span>
            )}

            {conditionParam && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                {t(`condition.${conditionParam}`)}
                <button
                  type="button"
                  aria-label="Clear condition filter"
                  onClick={() => updateParam('condition', null)}
                >
                  <X className="w-3 h-3 hover:text-rose-600" />
                </button>
              </span>
            )}

            {(minPriceParam || maxPriceParam) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300">
                ৳{minPriceParam || 0} - ৳{maxPriceParam || '∞'}
                <button
                  type="button"
                  aria-label="Clear price filter"
                  onClick={() => {
                    setMinPriceInput('');
                    setMaxPriceInput('');
                    const next = new URLSearchParams(searchParams);
                    next.delete('minPrice');
                    next.delete('maxPrice');
                    next.delete('page');
                    setSearchParams(next);
                  }}
                >
                  <X className="w-3 h-3 hover:text-rose-600" />
                </button>
              </span>
            )}

            {negotiableParam && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300">
                {language === 'bn' ? 'আলোচনা সাপেক্ষ' : 'Negotiable'}
                <button
                  type="button"
                  aria-label="Clear negotiable filter"
                  onClick={() => updateParam('isNegotiable', null)}
                >
                  <X className="w-3 h-3 hover:text-rose-600" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline flex items-center gap-1 ml-auto"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{language === 'bn' ? 'সব মুছুন' : 'Clear All'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Grid & Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm space-y-6 sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-700">
              <span className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                <span>{language === 'bn' ? 'ফিল্টারসমূহ' : 'Filters'}</span>
              </span>
              {activeFiltersCount > 0 && (
                <button type="button" onClick={clearAllFilters} className="text-xs text-emerald-600 hover:underline">
                  {language === 'bn' ? 'রিসেট' : 'Reset'}
                </button>
              )}
            </div>

            {renderFilterControls()}
          </div>
        </aside>

        {/* Product Grid Area */}
        <main className="lg:col-span-3 space-y-4">
          {/* Mobile/Tablet Filter Toggle & Sort Dropdown */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              aria-label="Open filters drawer"
              className="lg:hidden flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-gray-100 dark:bg-slate-700 rounded-lg"
            >
              <Filter className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'bn' ? 'ফিল্টার' : 'Filter'}</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Sorting */}
            <div className="flex items-center gap-2 ml-auto text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-500 hidden sm:inline">{language === 'bn' ? 'বাছাই:' : 'Sort:'}</span>
              <select
                aria-label="Sort products"
                value={sortParam}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="text-xs bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-1.5 focus:outline-none font-medium"
              >
                <option value="newest">{t('sortOptions.newest')}</option>
                <option value="price_low_high">{t('sortOptions.price_low_high')}</option>
                <option value="price_high_low">{t('sortOptions.price_high_low')}</option>
                <option value="most_viewed">{t('sortOptions.most_viewed')}</option>
              </select>
            </div>
          </div>

          {/* Listings Grid with Loading Skeleton & Pagination */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(6)].map((_, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm animate-pulse"
                >
                  <div className="h-44 bg-gray-200 dark:bg-slate-700" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
                    <div className="pt-2 flex justify-between items-center">
                      <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-1/3" />
                      <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {filteredProducts.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>

              {/* Pagination Controls */}
              {meta.totalPages > 1 && (
                <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-slate-800">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {language === 'bn'
                      ? `পৃষ্ঠা ${meta.page} / ${meta.totalPages} (মোট ${meta.totalItems} টি)`
                      : `Page ${meta.page} of ${meta.totalPages} (${meta.totalItems} total)`}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={meta.page <= 1}
                      onClick={() => updateParam('page', (meta.page - 1).toString())}
                      icon={<ChevronLeft className="w-4 h-4" />}
                    >
                      {language === 'bn' ? 'পূর্ববর্তী' : 'Previous'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={meta.page >= meta.totalPages}
                      onClick={() => updateParam('page', (meta.page + 1).toString())}
                      icon={<ChevronRight className="w-4 h-4" />}
                    >
                      {language === 'bn' ? 'পরবর্তী' : 'Next'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-8">
              <EmptyState
                title={language === 'bn' ? 'কোনো বিজ্ঞাপন পাওয়া যায়নি' : 'No listings match your criteria'}
                description={
                  language === 'bn'
                    ? 'অনুগ্রহ করে ভিন্ন কোনো শব্দ দিয়ে খুঁজুন বা ফিল্টার পরিবর্তন করুন।'
                    : 'Try adjusting your filters or search keywords.'
                }
                actionText={language === 'bn' ? 'ফিল্টার রিসেট করুন' : 'Reset Filters'}
                onAction={clearAllFilters}
              />
            </div>
          )}
        </main>
      </div>

      {/* Mobile & Tablet Filter Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto lg:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="relative min-h-screen max-w-md ml-auto bg-white dark:bg-slate-900 p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-slate-800">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                {language === 'bn' ? 'ফিল্টারসমূহ' : 'Filters'}
              </h3>
              <button
                type="button"
                aria-label="Close filters drawer"
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {renderFilterControls()}

            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-slate-800">
              <Button
                className="flex-1"
                variant="outline"
                size="lg"
                onClick={clearAllFilters}
              >
                {language === 'bn' ? 'রিসেট' : 'Reset'}
              </Button>
              <Button
                className="flex-1"
                variant="primary"
                size="lg"
                onClick={() => setIsMobileFilterOpen(false)}
              >
                {language === 'bn' ? 'প্রয়োগ করুন' : 'Apply Filters'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
