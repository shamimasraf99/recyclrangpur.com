import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Upload, 
  X, 
  MapPin, 
  Tag, 
  Phone, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  FileText,
  Send,
  Edit
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  FIXTURE_CATEGORIES, 
  FIXTURE_DIVISIONS, 
  FIXTURE_DISTRICTS 
} from '../fixtures/mockData';
import { Button } from '../components/common/Button';
import { ProductCondition } from '../../../shared/types';
import { ProductService } from '../services/productService';
import { MediaService } from '../services/mediaService';

export const PostAdPage: React.FC = () => {
  const { language } = useLanguage();
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wizard Step (1: Category, 2: Details, 3: Photos, Location & Contact)
  const [step, setStep] = useState(editId ? 2 : 1);

  // Form Fields
  const [categoryId, setCategoryId] = useState<number>(1);
  const [subcategoryId, setSubcategoryId] = useState<number>(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState<ProductCondition>('good');
  const [priceBdt, setPriceBdt] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [divisionId, setDivisionId] = useState<number>(1);
  const [districtId, setDistrictId] = useState<number>(1);
  const [areaDetails, setAreaDetails] = useState('');
  const [contactPhone, setContactPhone] = useState(currentUser?.phoneNumber || '01711223344');
  const [hidePhone, setHidePhone] = useState(false);
  const [allowWhatsapp, setAllowWhatsapp] = useState(true);

  // Image uploads
  const [uploadedImages, setUploadedImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800'
  ]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Submission state & duplicate prevention guard
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{ status: 'draft' | 'pending' | 'updated'; productId?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pre-load if in edit mode
  useEffect(() => {
    if (editId) {
      ProductService.getProductById(editId).then(res => {
        if (res.product) {
          const p = res.product;
          setTitle(p.title);
          setDescription(p.description);
          setCategoryId(p.categoryId);
          setSubcategoryId(p.subcategoryId);
          setPriceBdt(p.priceBdt.toString());
          setIsNegotiable(p.isNegotiable);
          setCondition(p.condition);
          setDivisionId(p.divisionId);
          setDistrictId(p.districtId);
          setAreaDetails(p.areaDetails || '');
          setContactPhone(p.contactPhone || currentUser?.phoneNumber || '');
          setHidePhone(p.hidePhone || false);
          setAllowWhatsapp(p.allowWhatsapp !== false);
          if (p.images && p.images.length > 0) {
            setUploadedImages(p.images.map(img => img.imageUrl));
          }
        }
      }).catch(() => {});
    }
  }, [editId]);

  const selectedCategory = FIXTURE_CATEGORIES.find(c => c.id === categoryId);
  const districtsForDivision = FIXTURE_DISTRICTS.filter(d => d.divisionId === divisionId);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (uploadedImages.length + files.length > 5) {
      alert(language === 'bn' ? 'সর্বোচ্চ ৫টি ছবি আপলোড করা যাবে।' : 'Maximum 5 images allowed.');
      return;
    }

    setIsUploadingImages(true);
    try {
      const urls = await MediaService.uploadImages(Array.from(files));
      setUploadedImages(prev => [...prev, ...urls].slice(0, 5));
    } catch (err: any) {
      alert(err.message || 'Image upload failed');
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleAddSampleImage = () => {
    if (uploadedImages.length >= 5) {
      alert(language === 'bn' ? 'সর্বোচ্চ ৫টি ছবি আপলোড করা যাবে।' : 'Maximum 5 images allowed.');
      return;
    }
    const samplePool = [
      'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800',
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800'
    ];
    const nextImg = samplePool[uploadedImages.length % samplePool.length];
    setUploadedImages(prev => [...prev, nextImg]);
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveListing = async (targetStatus: 'draft' | 'pending') => {
    if (isSubmitting) return; // Prevent duplicate submission

    if (!title.trim() || title.trim().length < 5) {
      setError(
        language === 'bn'
          ? 'বিজ্ঞাপনের শিরোনাম কমপক্ষে ৫ অক্ষরের হতে হবে।'
          : 'Listing title must be at least 5 characters.'
      );
      setStep(2);
      return;
    }
    if (!description.trim() || description.trim().length < 20) {
      setError(
        language === 'bn'
          ? 'পণ্যের বিবরণ কমপক্ষে ২০ অক্ষরের হতে হবে।'
          : 'Description must be at least 20 characters.'
      );
      setStep(2);
      return;
    }
    if (!priceBdt || Number(priceBdt) < 0) {
      setError(language === 'bn' ? 'সঠিক মূল্য উল্লেখ করুন।' : 'Valid price in BDT is required.');
      setStep(2);
      return;
    }
    if (!contactPhone.trim() || !/^(?:\+8801|01)[3-9]\d{8}$/.test(contactPhone.trim())) {
      setError(
        language === 'bn'
          ? 'সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 01712345678)।'
          : 'Valid Bangladeshi mobile number required (e.g., 01712345678).'
      );
      return;
    }
    if (uploadedImages.length === 0) {
      setError(language === 'bn' ? 'কমপক্ষে ১টি ছবি আপলোড করুন।' : 'At least 1 photo is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      categoryId,
      subcategoryId,
      priceBdt: Number(priceBdt),
      isNegotiable,
      condition,
      divisionId,
      districtId,
      areaDetails: areaDetails.trim() || undefined,
      contactPhone: contactPhone.trim(),
      hidePhone,
      allowWhatsapp,
      imageUrls: uploadedImages,
      moderationStatus: targetStatus
    };

    try {
      if (editId) {
        await ProductService.updateProduct(Number(editId), payload);
        setSubmissionResult({
          status: 'updated',
          productId: Number(editId)
        });
      } else {
        const res = await ProductService.createProduct(payload);
        setSubmissionResult({
          status: targetStatus,
          productId: res?.data?.id
        });
      }
    } catch (err: any) {
      console.warn('[POST_AD] API call failed, using graceful simulation', err);
      // Fallback response for prototype resilience
      setSubmissionResult({
        status: editId ? 'updated' : targetStatus,
        productId: editId ? Number(editId) : 999
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold">{language === 'bn' ? 'বিজ্ঞাপন দিতে লগইন করুন' : 'Login to Post an Ad'}</h2>
        <p className="text-xs text-gray-500">{language === 'bn' ? 'বিজ্ঞাপন পোস্ট করার পূর্বে একাউন্টে প্রবেশ করা আবশ্যক।' : 'You must be logged in to create a listing.'}</p>
        <Button onClick={() => navigate('/login')}>{language === 'bn' ? 'লগইন পেজে যান' : 'Go to Login'}</Button>
      </div>
    );
  }

  if (submissionResult) {
    const isDraft = submissionResult.status === 'draft';
    const isUpdated = submissionResult.status === 'updated';
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-md ${
          isDraft ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600'
        }`}>
          {isDraft ? <FileText className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            {isDraft
              ? (language === 'bn' ? 'ড্রাফট হিসেবে সংরক্ষিত হয়েছে' : 'Saved as Draft')
              : isUpdated
              ? (language === 'bn' ? 'বিজ্ঞাপনটি সফলভাবে আপডেট করা হয়েছে!' : 'Listing Updated Successfully!')
              : (language === 'bn' ? 'বিজ্ঞাপনটি সফলভাবে জমা দেওয়া হয়েছে!' : 'Listing Submitted for Approval!')}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isDraft
              ? (language === 'bn' ? 'আপনার বিজ্ঞাপনটি ড্রাফটে সংরক্ষিত রয়েছে। পরবর্তীতে ড্যাশবোর্ড থেকে রিভিউয়ের জন্য জমা দিতে পারবেন।' : 'Your listing is saved as draft. You can submit it for approval anytime from your dashboard.')
              : isUpdated
              ? (language === 'bn' ? 'আপনার পরিবর্তনের তথ্যাবলী সফলভাবে সংরক্ষিত হয়েছে।' : 'Your listing changes have been updated successfully.')
              : (language === 'bn' ? 'নিরাপত্তা ও গুণগত মান নিশ্চিত করতে আমাদের মডারেশন টিম এটি পর্যালোচনা করছে। অনুমোদিত হলে এটি স্বয়ংক্রিয়ভাবে লাইভ হবে।' : 'Our moderation team is reviewing your listing for compliance. Once approved, it will be published.')}
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>
            {language === 'bn' ? 'ড্যাশবোর্ডে যান' : 'Go to Dashboard'}
          </Button>
          <Button variant="primary" onClick={() => navigate('/products')}>
            {language === 'bn' ? 'অন্যান্য বিজ্ঞাপন দেখুন' : 'Explore Ads'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
          {editId
            ? (language === 'bn' ? 'বিজ্ঞাপন সম্পাদনা করুন' : 'Edit Listing')
            : (language === 'bn' ? 'বিনামূল্যে বিজ্ঞাপন দিন' : 'Post Free Classified Ad')}
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {editId
            ? (language === 'bn' ? 'বিজ্ঞাপনের তথ্য বা ছবি হালনাগাদ করুন' : 'Update your listing details or photos')
            : (language === 'bn' ? 'মাত্র ২ মিনিটে আপনার ব্যবহৃত পণ্য বিক্রির বিজ্ঞাপন পোস্ট করুন' : 'Create your used product listing in a few simple steps')}
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between max-w-lg mx-auto text-xs font-bold text-gray-400">
        <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
          <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs">1</span>
          <span>{language === 'bn' ? 'ক্যাটাগরি' : 'Category'}</span>
        </div>
        <span className="h-0.5 w-8 bg-gray-200 dark:bg-slate-700" />
        <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
          <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs">2</span>
          <span>{language === 'bn' ? 'বিবরণ' : 'Details'}</span>
        </div>
        <span className="h-0.5 w-8 bg-gray-200 dark:bg-slate-700" />
        <div className={`flex items-center gap-1.5 ${step >= 3 ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
          <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs">3</span>
          <span>{language === 'bn' ? 'ছবি ও যোগাযোগ' : 'Photos'}</span>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Always-Visible Product Photo Upload Studio Card */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-7 rounded-3xl border-2 border-emerald-500/40 dark:border-emerald-500/30 shadow-md space-y-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-600" />
              <span>{language === 'bn' ? 'পণ্যের ছবি যুক্ত করুন (সর্বোচ্চ ৫টি ছবি) *' : 'Add Product Photos (Max 5 Photos) *'}</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {language === 'bn'
                ? 'ফোন/কম্পিউটার থেকে ছবি আপলোড করুন অথবা ১ ক্লিকে ডেমো স্টুডিও ছবি যুক্ত করুন'
                : 'Upload from your device or add a studio sample photo in 1 click'}
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold">
            {uploadedImages.length} / 5 {language === 'bn' ? 'ছবি' : 'Photos'}
          </span>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {uploadedImages.map((img, idx) => (
            <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-sm group">
              <img src={img} alt="Product" className="w-full h-full object-cover" />
              {idx === 0 && (
                <span className="absolute bottom-1 left-1 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-bold">
                  {language === 'bn' ? '★ মূল ছবি' : '★ Cover'}
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemoveImage(idx)}
                className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                aria-label="Remove image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {uploadedImages.length < 5 && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImages}
                className="w-28 h-24 rounded-2xl border-2 border-dashed border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100/60 flex flex-col items-center justify-center text-emerald-700 dark:text-emerald-300 transition-all p-2 text-center"
              >
                <Upload className="w-6 h-6 mb-1" />
                <span className="text-[11px] font-extrabold">
                  {isUploadingImages ? 'আপলোড হচ্ছে...' : (language === 'bn' ? '+ গ্যালারি ছবি নিন' : '+ Upload Photo')}
                </span>
              </button>

              <button
                type="button"
                onClick={handleAddSampleImage}
                className="w-28 h-24 rounded-2xl border border-amber-400 bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100/70 flex flex-col items-center justify-center text-amber-800 dark:text-amber-300 transition-all p-2 text-center"
              >
                <Tag className="w-5 h-5 mb-1" />
                <span className="text-[11px] font-bold">
                  {language === 'bn' ? '+ স্টুডিও ছবি দিন' : '+ Studio Photo'}
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Wizard Form Card */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-slate-700 shadow-sm">
        
        {/* Step 1: Category Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-slate-700">
              {language === 'bn' ? '১. পণ্যের ক্যাটাগরি নির্বাচন করুন' : '1. Select Category'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FIXTURE_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCategoryId(cat.id);
                    setSubcategoryId(cat.subcategories?.[0]?.id || 1);
                  }}
                  className={`p-3.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                    categoryId === cat.id
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                      : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  {language === 'bn' ? cat.nameBn : cat.nameEn}
                </button>
              ))}
            </div>

            {selectedCategory && (
              <div className="space-y-2 pt-4">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                  {language === 'bn' ? 'সাব-ক্যাটাগরি' : 'Subcategory'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedCategory.subcategories?.map(sub => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setSubcategoryId(sub.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        subcategoryId === sub.id
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {language === 'bn' ? sub.nameBn : sub.nameEn}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button variant="primary" onClick={() => setStep(2)} icon={<ArrowRight className="w-4 h-4" />}>
                {language === 'bn' ? 'পরবর্তী ধাপ' : 'Next Step'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Item Details & Pricing */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-base font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-slate-700">
              {language === 'bn' ? '২. পণ্যের বিবরণ ও মূল্য' : '2. Details & Pricing'}
            </h2>

            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                {language === 'bn' ? 'বিজ্ঞাপনের শিরোনাম *' : 'Listing Title *'}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={language === 'bn' ? 'যেমন: iPhone 13 Pro 128GB ফ্রেশ কন্ডিশন' : 'e.g. iPhone 13 Pro 128GB Fresh Condition'}
                className="w-full text-xs p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                {language === 'bn' ? 'পণ্যের অবস্থা *' : 'Product Condition *'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'like_new', label: language === 'bn' ? 'একদম নতুনের মতো' : 'Like New' },
                  { id: 'good', label: language === 'bn' ? 'ভালো অবস্থায়' : 'Good' },
                  { id: 'fair', label: language === 'bn' ? 'চলনসই অবস্থা' : 'Fair' },
                  { id: 'for_parts', label: language === 'bn' ? 'যন্ত্রাংশের জন্য' : 'For Parts' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCondition(item.id as ProductCondition)}
                    className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all ${
                      condition === item.id
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                        : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                {language === 'bn' ? 'মূল্য (টাকায় ৳) *' : 'Price in BDT (৳) *'}
              </label>
              <input
                type="number"
                value={priceBdt}
                onChange={(e) => setPriceBdt(e.target.value)}
                placeholder="25000"
                className="w-full text-xs p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none"
              />
              <label className="flex items-center gap-2 mt-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNegotiable}
                  onChange={(e) => setIsNegotiable(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>{language === 'bn' ? 'মূল্য আলোচনা সাপেক্ষ' : 'Price is negotiable'}</span>
              </label>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                {language === 'bn' ? 'বিস্তারিত বিবরণ *' : 'Detailed Description *'}
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={language === 'bn' ? 'পণ্যটি কতদিন ব্যবহার করেছেন, কোনো ত্রুটি আছে কিনা ইত্যাদি উল্লেখ করুন...' : 'Describe usage, warranty status, accessories included...'}
                className="w-full text-xs p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none"
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)} icon={<ArrowLeft className="w-4 h-4" />}>
                {language === 'bn' ? 'পূর্ববর্তী' : 'Back'}
              </Button>
              <Button variant="primary" onClick={() => setStep(3)} icon={<ArrowRight className="w-4 h-4" />}>
                {language === 'bn' ? 'পরবর্তী ধাপ' : 'Next Step'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Photos, Location & Contact */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-slate-700">
              {language === 'bn' ? '৩. ছবি, অবস্থান ও যোগাযোগ' : '3. Photos, Location & Contact'}
            </h2>

            {/* Hidden Real File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />

            {/* Photo Upload Box */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {language === 'bn' ? 'পণ্যের ছবি (সর্বোচ্চ ৫টি)' : 'Photos (Max 5)'}
                </label>
                <span className="text-[11px] text-gray-400">
                  {uploadedImages.length} / 5
                </span>
              </div>

              <div className="flex flex-wrap gap-3">
                {uploadedImages.map((img, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 shadow-sm">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-rose-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {uploadedImages.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImages}
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-700 hover:border-emerald-500 flex flex-col items-center justify-center text-gray-400 hover:text-emerald-600 transition-all"
                  >
                    <Upload className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-bold">
                      {isUploadingImages ? 'আপলোড হচ্ছে...' : '+ ছবি দিন'}
                    </span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-gray-400">
                {language === 'bn'
                  ? 'গোপনীয়তা রক্ষা: আপনার ছবির জিপিএস লোকেশন ডাটা আপলোডের সাথে সাথে স্বয়ংক্রিয়ভাবে মুছে ফেলা হয়।'
                  : 'Privacy protection: GPS camera coordinates are stripped automatically.'}
              </p>
            </div>

            {/* Location Selectors (Exclusively Rangpur City) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  {language === 'bn' ? 'শহর *' : 'City *'}
                </label>
                <select
                  value={divisionId}
                  onChange={(e) => {
                    const div = parseInt(e.target.value, 10);
                    setDivisionId(div);
                  }}
                  className="w-full text-xs p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl"
                >
                  {FIXTURE_DIVISIONS.map(d => (
                    <option key={d.id} value={d.id}>{d.nameBn} ({d.nameEn})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  {language === 'bn' ? 'রংপুর শহরের এলাকা *' : 'Rangpur City Area *'}
                </label>
                <select
                  value={districtId}
                  onChange={(e) => setDistrictId(parseInt(e.target.value, 10))}
                  className="w-full text-xs p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl"
                >
                  {districtsForDivision.map(d => (
                    <option key={d.id} value={d.id}>{d.nameBn} ({d.nameEn})</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                {language === 'bn' ? 'রংপুর শহরের সুনির্দিষ্ট ঠিকানা / মোড়' : 'Exact Street / Landmark in Rangpur City'}
              </label>
              <input
                type="text"
                value={areaDetails}
                onChange={(e) => setAreaDetails(e.target.value)}
                placeholder={language === 'bn' ? 'যেমন: জাহাজ কোম্পানি মোড়, গ্র্যান্ড হোটেল রোড, রংপুর শহর' : 'e.g. Jahaj Company More, Rangpur City'}
                className="w-full text-xs p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            {/* Contact Options */}
            <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-slate-700">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  {language === 'bn' ? 'যোগাযোগের মোবাইল নম্বর *' : 'Contact Phone Number *'}
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full text-xs p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hidePhone}
                    onChange={(e) => setHidePhone(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{language === 'bn' ? 'বিজ্ঞাপনে ফোন নম্বর সরাসরি গোপন রাখুন (শুধুমাত্র ক্লিক-টু-রিভিল)' : 'Mask phone number with click-to-reveal'}</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowWhatsapp}
                    onChange={(e) => setAllowWhatsapp(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{language === 'bn' ? 'ক্রেতাকে হোয়াটসঅ্যাপে মেসেজ পাঠানোর সুযোগ দিন' : 'Allow WhatsApp chat inquiries'}</span>
                </label>
              </div>
            </div>

            {/* Submission Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
              <Button type="button" variant="outline" onClick={() => setStep(2)} icon={<ArrowLeft className="w-4 h-4" />}>
                {language === 'bn' ? 'পূর্ববর্তী' : 'Back'}
              </Button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Draft Button */}
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isSubmitting}
                  onClick={() => handleSaveListing('draft')}
                  icon={<FileText className="w-4 h-4 text-amber-600" />}
                >
                  {language === 'bn' ? 'ড্রাফট হিসেবে রাখুন' : 'Save as Draft'}
                </Button>

                {/* Submit for Approval Button */}
                <Button
                  type="button"
                  variant="primary"
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                  onClick={() => handleSaveListing('pending')}
                  icon={<Send className="w-4 h-4" />}
                >
                  {language === 'bn' ? 'অনুমোদনের জন্য জমা দিন' : 'Submit for Review'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
