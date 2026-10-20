import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Eye,
  ShieldCheck,
  Heart,
  Share2,
  Flag,
  Phone,
  MessageSquare,
  ChevronRight,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { FIXTURE_PRODUCTS } from '../fixtures/mockData';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { SellerContactModal } from '../components/product/SellerContactModal';
import { ReportListingModal } from '../components/product/ReportListingModal';
import { ProductService } from '../services/productService';
import { Product } from '../../../shared/types';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { language, formatPrice } = useLanguage();
  const { currentUser, isModerator, wishlistIds, toggleWishlist } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [isRestricted, setIsRestricted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setIsRestricted(false);
    if (!id) return;

    ProductService.getProductById(id)
      .then((res) => {
        if (!isMounted) return;
        const p = res.product;
        if (!p) {
          setProduct(null);
          return;
        }
        const isOwner = Boolean(currentUser && currentUser.id === p.sellerId);
        const isPubliclyVisible =
          p.moderationStatus === 'approved' && p.availabilityStatus !== 'archived';

        if (!isPubliclyVisible && !isOwner && !isModerator) {
          setIsRestricted(true);
          setProduct(null);
          return;
        }
        setProduct(p);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        if (err?.response?.status === 403) {
          setIsRestricted(true);
          setProduct(null);
          return;
        }
        const fallback = FIXTURE_PRODUCTS.find((p) => p.id === parseInt(id || '0', 10));
        if (fallback) {
          const isOwner = Boolean(currentUser && currentUser.id === fallback.sellerId);
          const isPubliclyVisible =
            fallback.moderationStatus === 'approved' && fallback.availabilityStatus !== 'archived';
          if (!isPubliclyVisible && !isOwner && !isModerator) {
            setIsRestricted(true);
            setProduct(null);
            return;
          }
        }
        setProduct(fallback || null);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, currentUser, isModerator]);

  const handleOpenContactModal = (channel: 'phone_reveal' | 'whatsapp_click') => {
    if (product) {
      ProductService.trackContact(product.id, product.sellerId, channel);
    }
    setIsContactModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="aspect-[16/10] bg-gray-200 dark:bg-slate-700 rounded-2xl" />
            <div className="h-32 bg-gray-200 dark:bg-slate-700 rounded-2xl" />
          </div>
          <div className="space-y-6">
            <div className="h-64 bg-gray-200 dark:bg-slate-700 rounded-2xl" />
            <div className="h-40 bg-gray-200 dark:bg-slate-700 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isRestricted) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <EmptyState
          title={
            language === 'bn'
              ? 'এই বিজ্ঞাপনটি সর্বসাধারণের জন্য উন্মুক্ত নয়'
              : 'Listing Restricted or Pending Review'
          }
          description={
            language === 'bn'
              ? 'বিজ্ঞাপনটি বর্তমানে ড্রাফট বা মডারেশন পর্যালোচনায় রয়েছে। শুধুমাত্র বিজ্ঞাপনদাতা এবং অনুমোদিত মডারেটর এটি দেখতে পারবেন।'
              : 'This listing is currently in draft, pending moderation, or rejected status and is visible only to its owner and moderators.'
          }
          actionText={language === 'bn' ? 'সকল অনুমোদিত পণ্য দেখুন' : 'Browse Approved Listings'}
          onAction={() => navigate('/products')}
        />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <EmptyState
          title={language === 'bn' ? 'বিজ্ঞাপনটি পাওয়া যায়নি' : 'Listing Not Found'}
          description={
            language === 'bn'
              ? 'বিজ্ঞাপনটি মুছে ফেলা হতে পারে বা মেয়াদ শেষ হয়ে গেছে।'
              : 'This listing may have been removed or sold.'
          }
          actionText={language === 'bn' ? 'সকল পণ্য দেখুন' : 'Browse All Listings'}
          onAction={() => navigate('/products')}
        />
      </div>
    );
  }

  const isOwner = Boolean(currentUser && currentUser.id === product.sellerId);
  const isPhoneHidden = Boolean(product.hidePhone && !isOwner && !isModerator);
  const isWishlisted = wishlistIds.includes(product.id);
  const images =
    product.images && product.images.length > 0
      ? product.images
      : [
          {
            id: 99,
            productId: product.id,
            imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
            thumbnailUrl: '',
            sortOrder: 1,
            isPrimary: true
          }
        ];

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Owner / Staff Moderation Status Banner if unapproved */}
      {product.moderationStatus !== 'approved' && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-4"
        >
          <span>
            {language === 'bn'
              ? `স্ট্যাটাস: ${product.moderationStatus.toUpperCase()} — এই বিজ্ঞাপনটি এখনো পাবলিক তালিকায় প্রকাশিত হয়নি (শুধুমাত্র আপনি এবং স্টাফ দেখতে পাচ্ছেন)।`
              : `Status: ${product.moderationStatus.toUpperCase()} — Visible only to the seller and moderation staff.`}
          </span>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <Link to="/" className="hover:text-emerald-600">
          {language === 'bn' ? 'হোম' : 'Home'}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to={`/category/${product.category?.slug}`} className="hover:text-emerald-600">
          {language === 'bn' ? product.category?.nameBn : product.category?.nameEn}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-bold text-gray-900 dark:text-white truncate max-w-xs">{product.title}</span>
      </nav>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Image Gallery & Description */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Photo Gallery */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 shadow-sm p-4 space-y-4">
            {/* Active Display Image */}
            <div className="relative aspect-[16/10] sm:aspect-[16/9] bg-gray-100 dark:bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
              <img
                src={images[activeImageIndex]?.imageUrl}
                alt={product.title}
                className="w-full h-full object-contain"
              />
              <div className="absolute top-3 left-3">
                <Badge variant="condition" condition={product.condition} />
              </div>
            </div>

            {/* Thumbnail Row */}
            {images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    type="button"
                    aria-label={`View image ${idx + 1}`}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                      activeImageIndex === idx
                        ? 'border-emerald-600 ring-2 ring-emerald-500/20'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.imageUrl} alt={`${product.title} thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details & Description */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                {language === 'bn' ? 'পণ্যের বিবরণ' : 'Product Description'}
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {/* Specifications Key-Values */}
            <div className="pt-6 border-t border-gray-100 dark:border-slate-700">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                {language === 'bn' ? 'মৌলিক তথ্যাবলী' : 'Key Specifications'}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="bg-gray-50 dark:bg-slate-900/60 p-3 rounded-xl border border-gray-100 dark:border-slate-700">
                  <span className="text-gray-500 block mb-1">{language === 'bn' ? 'পণ্যের অবস্থা' : 'Condition'}</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    <Badge variant="condition" condition={product.condition} />
                  </span>
                </div>

                <div className="bg-gray-50 dark:bg-slate-900/60 p-3 rounded-xl border border-gray-100 dark:border-slate-700">
                  <span className="text-gray-500 block mb-1">{language === 'bn' ? 'অবস্থান' : 'Location'}</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {product.district?.nameBn}, {product.division?.nameBn}
                  </span>
                </div>

                <div className="bg-gray-50 dark:bg-slate-900/60 p-3 rounded-xl border border-gray-100 dark:border-slate-700">
                  <span className="text-gray-500 block mb-1">{language === 'bn' ? 'দরদাম' : 'Negotiable'}</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {product.isNegotiable
                      ? language === 'bn'
                        ? 'আলোচনা সাপেক্ষ'
                        : 'Yes'
                      : language === 'bn'
                        ? 'ফিক্সড প্রাইস'
                        : 'Fixed'}
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Inspection Safety Reminder */}
            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-start gap-3 text-xs text-emerald-900 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">
                  {language === 'bn' ? 'সরাসরি দেখে কেনার নিশ্চয়তা' : 'Direct Buyer-Seller Model'}
                </span>
                <span>
                  {language === 'bn'
                    ? 'BikroyBD-তে কোনো অনলাইন পেমেন্ট গেটওয়ে নেই। বিক্রেতার সাথে দেখা করে পণ্য যাচাই করুন এবং সন্তুষ্ট হলে সরাসরি টাকা দিন।'
                    : 'BikroyBD does not handle payments. Verify the used product in person before finalizing your purchase.'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing, Contact & Seller Profile */}
        <div className="space-y-6">
          {/* Price & Primary Action Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6 space-y-6">
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {formatPrice(product.priceBdt)}
                </span>
                {product.isNegotiable && (
                  <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-full">
                    {language === 'bn' ? 'আলোচনা সাপেক্ষ' : 'Negotiable'}
                  </span>
                )}
              </div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">{product.title}</h1>

              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span>{product.areaDetails || product.district?.nameBn}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-gray-400" />
                  <span>{product.viewsCount} ভিউ</span>
                </div>
              </div>
            </div>

            {/* Direct Contact Buttons */}
            <div className="space-y-3">
              {isPhoneHidden ? (
                <div className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gray-100 dark:bg-slate-900 text-gray-500 dark:text-gray-400 text-xs font-semibold border border-gray-200 dark:border-slate-700">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>
                    {language === 'bn'
                      ? 'বিক্রেতা ফোন নম্বর গোপন রেখেছেন'
                      : 'Phone Number Hidden by Seller'}
                  </span>
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full text-base font-bold shadow-md"
                  onClick={() => handleOpenContactModal('phone_reveal')}
                  icon={<Phone className="w-5 h-5" />}
                >
                  {language === 'bn' ? 'বিক্রেতার নম্বর দেখুন' : 'Show Seller Phone'}
                </Button>
              )}

              {product.allowWhatsapp && !isPhoneHidden && (
                <button
                  type="button"
                  onClick={() => handleOpenContactModal('whatsapp_click')}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm shadow-sm transition-all active:scale-[0.98]"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{language === 'bn' ? 'হোয়াটসঅ্যাপে যোগাযোগ' : 'Chat on WhatsApp'}</span>
                </button>
              )}
            </div>

            {/* Secondary Actions (Wishlist, Share, Report) */}
            <div className="flex items-center justify-around pt-3 border-t border-gray-100 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                className={`flex items-center gap-1.5 p-2 rounded-lg font-medium transition-colors ${
                  isWishlisted
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-rose-600'
                }`}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                <span>{isWishlisted ? 'সংরক্ষিত' : 'সংরক্ষণ করুন'}</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-1.5 p-2 rounded-lg font-medium text-gray-600 dark:text-gray-400 hover:text-emerald-600 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>{copiedShare ? 'কপি হয়েছে!' : 'শেয়ার'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className="flex items-center gap-1.5 p-2 rounded-lg font-medium text-gray-400 hover:text-rose-600 transition-colors"
              >
                <Flag className="w-4 h-4" />
                <span>রিপোর্ট</span>
              </button>
            </div>
          </div>

          {/* Seller Profile Summary Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {language === 'bn' ? 'বিক্রেতার তথ্য' : 'Seller Information'}
            </h3>

            <div className="flex items-center gap-3">
              <img
                src={
                  product.seller?.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                }
                alt={product.seller?.fullName || 'Seller avatar'}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500/20"
              />
              <div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white">{product.seller?.fullName}</h4>
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'যাচাইকৃত ব্যবহারকারী' : 'Verified Member'}</span>
                </div>
              </div>
            </div>

            <Link
              to={`/seller/${product.sellerId}`}
              className="block w-full text-center py-2 px-3 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 transition-colors"
            >
              {language === 'bn' ? 'বিক্রেতার সকল বিজ্ঞাপন দেখুন' : 'View All Ads from Seller'}
            </Link>
          </div>
        </div>
      </div>

      {/* Seller Contact Modal */}
      {!isPhoneHidden && (
        <SellerContactModal
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
          sellerName={product.seller?.fullName || 'Seller'}
          phoneNumber={product.contactPhone || ''}
          allowWhatsapp={product.allowWhatsapp}
          productTitle={product.title}
        />
      )}

      {/* Abuse Reporting Modal */}
      <ReportListingModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        productId={product.id}
        productTitle={product.title}
      />
    </div>
  );
};
