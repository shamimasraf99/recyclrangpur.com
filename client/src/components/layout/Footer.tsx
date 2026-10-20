import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, PhoneCall, HeartHandshake, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { FIXTURE_DISTRICTS, FIXTURE_CATEGORIES } from '../../fixtures/mockData';

export const Footer: React.FC = () => {
  const { language } = useLanguage();

  return (
    <footer className="bg-gray-100 dark:bg-slate-950 text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-slate-800 pt-12 pb-24 sm:pb-12 text-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Trust & Safety Highlights for Rangpur City Direct Contact Model */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-10 border-b border-gray-200 dark:border-slate-800">
          <div className="flex items-start gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200/80 dark:border-slate-800">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-0.5">
                {language === 'bn' ? 'রংপুর শহরে সরাসরি দেখে কিনুন' : 'Inspect in Person in Rangpur City'}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {language === 'bn'
                  ? 'জাহাজ কোম্পানি মোড়, ধাপ বা শাপলা চত্বরে সামনাসামনি পণ্য যাচাই করে লেনদেন করুন।'
                  : 'Meet in safe public spots in Rangpur City and verify item condition before paying.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200/80 dark:border-slate-800">
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-0.5">
                {language === 'bn' ? 'কোনো অগ্রিম পেমেন্ট নয়' : 'Never Send Advance Money'}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {language === 'bn'
                  ? 'বিকাশ, নগদ বা রকেটে অগ্রিম কোনো টাকা বা কুরিয়ার ফি পাঠাবেন না।'
                  : 'Never transfer delivery fees or advances via bKash/Nagad before handover.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200/80 dark:border-slate-800">
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 shrink-0">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-0.5">
                {language === 'bn' ? 'সরাসরি যোগাযোগ' : 'Direct Seller Contact'}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {language === 'bn'
                  ? 'রংপুর শহরের বিক্রেতার সাথে ফোন বা হোয়াটসঅ্যাপে সরাসরি কথা বলুন।'
                  : 'Call or WhatsApp verified Rangpur City sellers directly without fees.'}
              </p>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-10">
          <div>
            <h5 className="font-bold text-gray-900 dark:text-white text-sm mb-4">
              {language === 'bn' ? 'রংপুর শহরের এলাকাসমূহ' : 'Rangpur City Areas'}
            </h5>
            <ul className="space-y-2 text-xs">
              {FIXTURE_DISTRICTS.slice(0, 7).map(area => (
                <li key={area.id}>
                  <Link to={`/products?district=${area.id}`} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                    {language === 'bn' ? area.nameBn : area.nameEn}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-gray-900 dark:text-white text-sm mb-4">
              {language === 'bn' ? 'শীর্ষ ক্যাটাগরি' : 'Top Categories'}
            </h5>
            <ul className="space-y-2 text-xs">
              {FIXTURE_CATEGORIES.slice(0, 6).map(cat => (
                <li key={cat.id}>
                  <Link to={`/category/${cat.slug}`} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                    {language === 'bn' ? cat.nameBn : cat.nameEn}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-gray-900 dark:text-white text-sm mb-4">
              {language === 'bn' ? 'সহায়তা ও নীতি' : 'Help & Policies'}
            </h5>
            <ul className="space-y-2 text-xs">
              <li><span className="hover:text-emerald-600 cursor-pointer">{language === 'bn' ? 'নিরাপদ কেনাবেচার নির্দেশিকা' : 'Safe Trading Guide'}</span></li>
              <li><span className="hover:text-emerald-600 cursor-pointer">{language === 'bn' ? 'ব্যবহারের শর্তাবলী' : 'Terms & Conditions'}</span></li>
              <li><span className="hover:text-emerald-600 cursor-pointer">{language === 'bn' ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}</span></li>
              <li><span className="hover:text-emerald-600 cursor-pointer">{language === 'bn' ? 'নিষিদ্ধ পণ্যের তালিকা' : 'Prohibited Items'}</span></li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-gray-900 dark:text-white text-sm mb-4">
              Recycl <span className="text-emerald-600">Rangpur</span>
            </h5>
            <p className="text-xs leading-relaxed mb-4 text-gray-500 dark:text-gray-400">
              {language === 'bn'
                ? 'শুধুমাত্র রংপুর মেট্রোপলিটন শহরের ক্রেতা ও বিক্রেতাদের সরাসরি যুক্ত করার আধুনিক রিসাইকেল ও ব্যবহৃত পণ্য কেনাবেচা মার্কেটপ্লেস।'
                : 'The dedicated local classifieds platform connecting buyers and sellers exclusively across Rangpur Metropolitan City.'}
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <HeartHandshake className="w-4 h-4" />
              <span>Recycl Rangpur • Exclusively for Rangpur City</span>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 border-t border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© 2026 Recycl Rangpur (রিসাইকেল রংপুর শহর). সর্বস্বত্ব সংরক্ষিত / All rights reserved.</p>
          <p className="text-gray-400">Location: Rangpur City Only | Currency: ৳ BDT</p>
        </div>
      </div>
    </footer>
  );
};
