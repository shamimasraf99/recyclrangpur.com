import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Package, 
  Eye, 
  CheckCircle, 
  Clock, 
  PlusCircle, 
  Edit, 
  Trash2, 
  CheckSquare, 
  ExternalLink,
  Send,
  FileText,
  RotateCcw
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { FIXTURE_PRODUCTS } from '../fixtures/mockData';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { ProductService } from '../services/productService';
import { Product } from '../../../shared/types';

export const SellerDashboardPage: React.FC = () => {
  const { language, formatPrice } = useLanguage();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'available' | 'pending' | 'draft' | 'sold'>('all');
  const [sellerListings, setSellerListings] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const fetchListings = () => {
    setIsLoading(true);
    ProductService.getSellerListings()
      .then(res => {
        setSellerListings(res.listings || []);
      })
      .catch(() => {
        setSellerListings(FIXTURE_PRODUCTS.filter(p => p.sellerId === (currentUser?.id || 101)));
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchListings();
  }, [currentUser]);

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleMarkAsSold = async (id: number) => {
    try {
      await ProductService.updateStatus(id, 'sold');
      setSellerListings(prev => 
        prev.map(item => item.id === id ? { ...item, availabilityStatus: 'sold' } : item)
      );
      showFeedback(language === 'bn' ? 'বিজ্ঞাপনটি বিক্রি হয়েছে হিসেবে চিহ্নিত করা হয়েছে' : 'Marked as sold');
    } catch {
      setSellerListings(prev => 
        prev.map(item => item.id === id ? { ...item, availabilityStatus: 'sold' } : item)
      );
    }
  };

  const handleMarkAsAvailable = async (id: number) => {
    try {
      await ProductService.updateStatus(id, 'available');
      setSellerListings(prev => 
        prev.map(item => item.id === id ? { ...item, availabilityStatus: 'available' } : item)
      );
      showFeedback(language === 'bn' ? 'বিজ্ঞাপনটি পুনরায় সক্রিয় করা হয়েছে' : 'Ad marked as available');
    } catch {
      setSellerListings(prev => 
        prev.map(item => item.id === id ? { ...item, availabilityStatus: 'available' } : item)
      );
    }
  };

  const handleSubmitDraft = async (id: number) => {
    try {
      await ProductService.submitDraftForApproval(id);
      setSellerListings(prev =>
        prev.map(item => item.id === id ? { ...item, moderationStatus: 'pending' } : item)
      );
      showFeedback(language === 'bn' ? 'বিজ্ঞাপনটি পর্যালোচনার জন্য জমা দেওয়া হয়েছে' : 'Submitted draft for moderation approval');
    } catch (err: any) {
      alert(err.message || 'Submission failed');
    }
  };

  const handleDeleteListing = async (id: number) => {
    if (window.confirm(language === 'bn' ? 'আপনি কি নিশ্চিত যে বিজ্ঞাপনটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this listing?')) {
      try {
        await ProductService.deleteProduct(id);
        setSellerListings(prev => prev.filter(item => item.id !== id));
        showFeedback(language === 'bn' ? 'বিজ্ঞাপনটি মুছে ফেলা হয়েছে' : 'Listing deleted');
      } catch {
        setSellerListings(prev => prev.filter(item => item.id !== id));
      }
    }
  };

  const filteredListings = sellerListings.filter(item => {
    if (activeTab === 'available') return item.availabilityStatus === 'available' && item.moderationStatus === 'approved';
    if (activeTab === 'pending') return item.moderationStatus === 'pending';
    if (activeTab === 'draft') return item.moderationStatus === 'draft';
    if (activeTab === 'sold') return item.availabilityStatus === 'sold';
    return true;
  });

  const totalViews = sellerListings.reduce((sum, item) => sum + (item.viewsCount || 0), 0);
  const activeCount = sellerListings.filter(i => i.availabilityStatus === 'available' && i.moderationStatus === 'approved').length;
  const pendingCount = sellerListings.filter(i => i.moderationStatus === 'pending').length;
  const draftCount = sellerListings.filter(i => i.moderationStatus === 'draft').length;
  const soldCount = sellerListings.filter(i => i.availabilityStatus === 'sold').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header & Post Ad CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {language === 'bn' ? 'বিজ্ঞাপন ড্যাশবোর্ড' : 'Seller Dashboard'}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {language === 'bn' ? 'আপনার পোস্ট করা সকল বিজ্ঞাপন পরিচালনা ও পর্যবেক্ষণ করুন' : 'Manage your posted listings, monitor views, and update availability'}
          </p>
        </div>

        <Link to="/post-ad">
          <Button variant="primary" size="md" icon={<PlusCircle className="w-4 h-4" />}>
            {language === 'bn' ? 'নতুন বিজ্ঞাপন দিন' : 'Post New Ad'}
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-gray-400 block">{language === 'bn' ? 'মোট বিজ্ঞাপন' : 'Total Ads'}</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">{sellerListings.length}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-gray-400 block">{language === 'bn' ? 'সক্রিয় বিজ্ঞাপন' : 'Active Ads'}</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">{activeCount}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-gray-400 block">{language === 'bn' ? 'মোট ভিউ' : 'Total Views'}</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">{totalViews}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-gray-400 block">{language === 'bn' ? 'বিক্রি সম্পন্ন' : 'Sold Items'}</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">{soldCount}</span>
          </div>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {actionFeedback && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 px-4 py-3 rounded-2xl flex items-center justify-between shadow-sm animate-fade-in text-sm font-semibold">
          <span>{actionFeedback}</span>
          <button onClick={() => setActionFeedback(null)} className="text-emerald-600 hover:text-emerald-800 ml-4 font-bold">×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-slate-700 gap-4 sm:gap-6 text-xs sm:text-sm font-semibold overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 transition-colors shrink-0 ${
            activeTab === 'all'
              ? 'border-b-2 border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {language === 'bn' ? 'সকল' : 'All'} ({sellerListings.length})
        </button>

        <button
          onClick={() => setActiveTab('available')}
          className={`pb-3 transition-colors shrink-0 ${
            activeTab === 'available'
              ? 'border-b-2 border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {language === 'bn' ? 'সক্রিয়' : 'Active'} ({activeCount})
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 transition-colors shrink-0 ${
            activeTab === 'pending'
              ? 'border-b-2 border-amber-600 text-amber-600 dark:text-amber-400'
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {language === 'bn' ? 'রিভিউধীন' : 'Pending'} ({pendingCount})
        </button>

        <button
          onClick={() => setActiveTab('draft')}
          className={`pb-3 transition-colors shrink-0 ${
            activeTab === 'draft'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {language === 'bn' ? 'ড্রাফট' : 'Drafts'} ({draftCount})
        </button>

        <button
          onClick={() => setActiveTab('sold')}
          className={`pb-3 transition-colors shrink-0 ${
            activeTab === 'sold'
              ? 'border-b-2 border-gray-600 text-gray-700 dark:text-gray-300'
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {language === 'bn' ? 'বিক্রি হয়েছে' : 'Sold'} ({soldCount})
        </button>
      </div>

      {/* Listings List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm animate-pulse flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-gray-200 dark:bg-slate-700" />
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-40" />
                    <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-24" />
                  </div>
                </div>
                <div className="w-28 h-8 bg-gray-200 dark:bg-slate-700 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filteredListings.length > 0 ? (
          filteredListings.map(item => {
            const primaryImg = (item.images && item.images[0]?.imageUrl) || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300';
            const isSold = item.availabilityStatus === 'sold';
            const isDraft = item.moderationStatus === 'draft';
            const isPending = item.moderationStatus === 'pending';

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={primaryImg}
                    alt={item.title}
                    className="w-20 h-20 rounded-xl object-cover bg-gray-100 dark:bg-slate-900 shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="availability" availability={item.availabilityStatus} />
                      <Badge variant="condition" condition={item.condition} />
                      {isDraft && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 border border-blue-200 dark:border-blue-800">
                          {language === 'bn' ? 'ড্রাফট' : 'Draft'}
                        </span>
                      )}
                      {isPending && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 border border-amber-200 dark:border-amber-800">
                          {language === 'bn' ? 'রিভিউধীন' : 'Under Review'}
                        </span>
                      )}
                    </div>
                    <Link to={`/products/${item.id}`} className="font-bold text-sm text-gray-900 dark:text-white hover:text-emerald-600 line-clamp-1">
                      {item.title}
                    </Link>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                      {formatPrice(item.priceBdt)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                  {/* Draft action: Submit for approval */}
                  {isDraft && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSubmitDraft(item.id)}
                      icon={<Send className="w-3.5 h-3.5" />}
                    >
                      {language === 'bn' ? 'অনুমোদনের জন্য জমা দিন' : 'Submit for Review'}
                    </Button>
                  )}

                  {/* Active ad: Mark as Sold */}
                  {!isSold && !isDraft && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkAsSold(item.id)}
                      icon={<CheckSquare className="w-3.5 h-3.5 text-emerald-600" />}
                    >
                      {language === 'bn' ? 'বিক্রি হয়েছে' : 'Mark Sold'}
                    </Button>
                  )}

                  {/* Sold ad: Mark as Available */}
                  {isSold && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkAsAvailable(item.id)}
                      icon={<RotateCcw className="w-3.5 h-3.5 text-blue-600" />}
                    >
                      {language === 'bn' ? 'পুনরায় সক্রিয়' : 'Reactivate'}
                    </Button>
                  )}

                  {/* Edit Ad */}
                  <Link to={`/post-ad?edit=${item.id}`}>
                    <Button variant="ghost" size="sm" icon={<Edit className="w-3.5 h-3.5" />}>
                      {language === 'bn' ? 'সম্পাদনা' : 'Edit'}
                    </Button>
                  </Link>

                  {/* View public ad */}
                  <Link to={`/products/${item.id}`}>
                    <Button variant="ghost" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                      {language === 'bn' ? 'দেখুন' : 'View'}
                    </Button>
                  </Link>

                  {/* Delete Ad */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteListing(item.id)}
                    className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    {language === 'bn' ? 'মুছুন' : 'Delete'}
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-8">
            <EmptyState
              title={language === 'bn' ? 'এই ট্যাবে কোনো বিজ্ঞাপন নেই' : 'No ads in this tab'}
              description={language === 'bn' ? 'আপনার অব্যবহৃত পণ্যের বিজ্ঞাপন পোস্ট করে বিক্রি শুরু করুন।' : 'Start selling by posting an ad for your unused items.'}
              actionText={language === 'bn' ? 'বিজ্ঞাপন দিন' : 'Post Free Ad'}
              onAction={() => navigate('/post-ad')}
            />
          </div>
        )}
      </div>
    </div>
  );
};
