import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Smartphone, 
  Laptop, 
  Bike, 
  Tv, 
  Armchair, 
  Shirt, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  Tag
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { FIXTURE_CATEGORIES, FIXTURE_PRODUCTS, FIXTURE_DIVISIONS } from '../fixtures/mockData';
import { ProductCard } from '../components/product/ProductCard';
import { Button } from '../components/common/Button';

interface HomePageProps {
  onOpenLocationModal: () => void;
  selectedLocationLabel: string;
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenLocationModal, selectedLocationLabel }) => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/products');
    }
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Smartphone': return <Smartphone className="w-6 h-6" />;
      case 'Laptop': return <Laptop className="w-6 h-6" />;
      case 'Bike': return <Bike className="w-6 h-6" />;
      case 'Tv': return <Tv className="w-6 h-6" />;
      case 'Armchair': return <Armchair className="w-6 h-6" />;
      case 'Shirt': return <Shirt className="w-6 h-6" />;
      default: return <Tag className="w-6 h-6" />;
    }
  };

  const featuredListings = FIXTURE_PRODUCTS.filter(p => p.isFeatured);
  const latestListings = FIXTURE_PRODUCTS;

  return (
    <div className="space-y-12 pb-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 text-white py-14 sm:py-20 px-4 rounded-b-3xl sm:rounded-b-[2.5rem] shadow-xl">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400 text-slate-950 text-xs font-extrabold shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-emerald-900" />
            <span>{language === 'bn' ? 'Recycl Rangpur • শুধুমাত্র রংপুর মেট্রোপলিটন শহরের রিসাইকেল ও কেনাবেচা অ্যাপ' : 'Recycl Rangpur • Exclusively for Rangpur City Residents'}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            {language === 'bn' ? (
              <>
                Recycl Rangpur — রংপুর শহরে পুরাতন পণ্য দিন, <br className="hidden sm:inline" />
                <span className="text-amber-300">নতুন মূল্য পান সরাসরি!</span>
              </>
            ) : (
              <>
                Recycl Rangpur — Buy & Sell in Rangpur City <br className="hidden sm:inline" />
                <span className="text-amber-300">Pre-Owned Goods with Photos</span>
              </>
            )}
          </h1>

          <p className="text-sm sm:text-base text-emerald-100/90 max-w-2xl mx-auto">
            {language === 'bn'
              ? 'জাহাজ কোম্পানি মোড়, ধাপ, শাপলা চত্বর, লালবাগ, কাচারী বাজার ও মডার্ন মোড় সহ পুরো রংপুর শহরে পণ্যের ছবি যুক্ত করে বিনামূল্যে বিজ্ঞাপন দিন।'
              : 'Upload product photos and trade pre-owned phones, laptops, bikes, and furniture exclusively across Rangpur City neighborhoods.'}
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto mt-6">
            <div className="flex flex-col sm:flex-row items-center bg-white dark:bg-slate-900 rounded-2xl p-2 shadow-2xl border border-white/20 gap-2">
              
              {/* Location Pill Button */}
              <button
                type="button"
                onClick={onOpenLocationModal}
                className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 rounded-xl transition-colors shrink-0"
              >
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span className="truncate max-w-[140px]">{selectedLocationLabel}</span>
              </button>

              {/* Input */}
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === 'bn' ? 'রংপুর শহরে খুঁজুন: iPhone, ল্যাপটপ, বাইক...' : 'Search in Rangpur City: iPhone, Laptop, Bike...'}
                  className="w-full px-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 bg-transparent focus:outline-none"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full sm:w-auto shrink-0 rounded-xl"
                icon={<Search className="w-4 h-4" />}
              >
                {language === 'bn' ? 'খুঁজুন' : 'Search'}
              </Button>
            </div>
          </form>

          {/* Quick Rangpur City Area Badges */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-emerald-100">
            <span className="font-semibold text-amber-300">{language === 'bn' ? 'রংপুর শহরের এলাকা:' : 'Rangpur City Areas:'}</span>
            <Link to="/products?district=1" className="hover:underline hover:text-white transition-colors">
              {language === 'bn' ? 'জাহাজ কোম্পানি মোড়' : 'Jahaj Company'}
            </Link>
            <span>•</span>
            <Link to="/products?district=2" className="hover:underline hover:text-white transition-colors">
              {language === 'bn' ? 'ধাপ ও মেডিকেল মোড়' : 'Dhap'}
            </Link>
            <span>•</span>
            <Link to="/products?district=3" className="hover:underline hover:text-white transition-colors">
              {language === 'bn' ? 'শাপলা চত্বর' : 'Shapla Chattar'}
            </Link>
            <span>•</span>
            <Link to="/products?district=4" className="hover:underline hover:text-white transition-colors">
              {language === 'bn' ? 'লালবাগ ও পার্কের মোড়' : 'Lalbag & Park More'}
            </Link>
            <span>•</span>
            <Link to="/products?district=5" className="hover:underline hover:text-white transition-colors">
              {language === 'bn' ? 'কাচারী বাজার' : 'Kachari Bazar'}
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {language === 'bn' ? 'ক্যাটাগরি অনুযায়ী খুঁজুন' : 'Browse by Category'}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {language === 'bn' ? 'আপনার প্রয়োজনীয় পণ্যের ধরন বেছে নিন' : 'Select a category to explore verified listings'}
            </p>
          </div>
          <Link to="/products" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
            <span>{language === 'bn' ? 'সবগুলো দেখুন' : 'View All'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {FIXTURE_CATEGORIES.map(cat => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className="group flex flex-col items-center p-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200/80 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition-all text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                {getCategoryIcon(cat.iconName)}
              </div>
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 line-clamp-2">
                {language === 'bn' ? cat.nameBn : cat.nameEn}
              </span>
              <span className="text-[10px] text-gray-400 mt-1">
                {cat.subcategories?.length || 0} {language === 'bn' ? 'সাব-ক্যাটাগরি' : 'subcategories'}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Listings Section */}
      {featuredListings.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500 text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {language === 'bn' ? 'ফিচার্ড বিজ্ঞাপন' : 'Featured Ads'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {language === 'bn' ? 'যাচাইকৃত বিক্রেতাদের শীর্ষ প্রস্তাব' : 'Top verified listings highlighted today'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredListings.map(prod => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      )}

      {/* Latest Ads Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {language === 'bn' ? 'সাম্প্রতিক বিজ্ঞাপন' : 'Latest Listings'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {language === 'bn' ? 'সরাসরি অনুমোদিত তাজা ব্যবহৃত পণ্যের কালেকশন' : 'Freshly approved used items available right now'}
              </p>
            </div>
          </div>
          <Link to="/products">
            <Button variant="outline" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
              {language === 'bn' ? 'সব পণ্য দেখুন' : 'Explore All'}
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {latestListings.map(prod => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </section>

      {/* Post Ad CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl sm:text-3xl font-extrabold">
              {language === 'bn' ? 'আপনার কি কোনো অব্যবহৃত পণ্য রয়েছে?' : 'Have items you no longer use?'}
            </h3>
            <p className="text-emerald-100 text-xs sm:text-sm max-w-xl">
              {language === 'bn'
                ? 'বিনা খরচে বিজ্ঞাপন পোস্ট করুন এবং আপনার এলাকার হাজারো আগ্রহী ক্রেতার সাথে সরাসরি যোগাযোগ করুন।'
                : 'Post free ads in 2 minutes and connect with thousands of local buyers directly.'}
            </p>
          </div>
          <Link to="/post-ad" className="shrink-0">
            <button className="px-6 py-3.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all">
              {language === 'bn' ? 'বিনামূল্যে বিজ্ঞাপন দিন' : 'Post Free Ad Now'}
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
};
