import React, { useState } from 'react';
import { Phone, MessageSquare, Copy, Check, ShieldCheck, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useLanguage } from '../../context/LanguageContext';

interface SellerContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerName: string;
  phoneNumber: string;
  allowWhatsapp: boolean;
  productTitle: string;
}

export const SellerContactModal: React.FC<SellerContactModalProps> = ({
  isOpen,
  onClose,
  sellerName,
  phoneNumber,
  allowWhatsapp,
  productTitle
}) => {
  const { language } = useLanguage();
  const [isRevealed, setIsRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(phoneNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const internationalPhone = cleanPhone.startsWith('880') 
    ? cleanPhone 
    : cleanPhone.startsWith('0') 
      ? `88${cleanPhone}` 
      : `880${cleanPhone}`;

  const whatsappMessage = encodeURIComponent(
    `আসসালামু আলাইকুম, BikroyBD-তে আপনার "${productTitle}" বিজ্ঞাপনটি দেখে যোগাযোগ করছি। এটি কি এখনো বিক্রি করা সম্ভব?`
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={language === 'bn' ? 'বিক্রেতার সাথে যোগাযোগ' : 'Contact Seller'}
    >
      <div className="space-y-6">
        {/* Seller Info */}
        <div className="bg-gray-50 dark:bg-slate-900/60 p-4 rounded-xl border border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">
              {language === 'bn' ? 'বিজ্ঞাপনদাতার নাম' : 'Seller Name'}
            </span>
            <span className="font-bold text-gray-900 dark:text-white text-base">
              {sellerName}
            </span>
          </div>
          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'যাচাইকৃত প্রোফাইল' : 'Verified'}</span>
          </div>
        </div>

        {/* Phone Contact Block */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
            {language === 'bn' ? 'ফোন নম্বর' : 'Phone Number'}
          </label>
          
          {!isRevealed ? (
            <div className="flex items-center justify-between p-3.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
              <span className="font-mono text-base font-bold text-emerald-800 dark:text-emerald-300">
                {phoneNumber.slice(0, 5)}******
              </span>
              <Button
                size="sm"
                variant="primary"
                onClick={() => setIsRevealed(true)}
                icon={<Phone className="w-3.5 h-3.5" />}
              >
                {language === 'bn' ? 'নম্বরটি দেখুন' : 'Show Number'}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-300 dark:border-emerald-700 animate-fadeIn">
              <a
                href={`tel:${phoneNumber}`}
                className="font-mono text-lg font-bold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-2"
              >
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>{phoneNumber}</span>
              </a>
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:text-emerald-600 border border-gray-200 dark:border-slate-700 shadow-sm transition-all"
                title="Copy Number"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>

        {/* WhatsApp Direct Chat */}
        {allowWhatsapp && (
          <div className="pt-2">
            <a
              href={`https://wa.me/${internationalPhone}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm shadow-sm transition-all hover:shadow active:scale-[0.98]"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{language === 'bn' ? 'হোয়াটসঅ্যাপে সরাসরি চ্যাট করুন' : 'Chat on WhatsApp'}</span>
            </a>
          </div>
        )}

        {/* Safety Disclaimer Box */}
        <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-xl border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{language === 'bn' ? 'সতর্কতা ও নিরাপত্তা টিপস' : 'Safety Advice'}</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-amber-900/80 dark:text-amber-400">
            <li>{language === 'bn' ? 'পণ্য হাতে পেয়ে ও নিজে চালিয়ে দেখে তবেই টাকা দিন।' : 'Never send advance payment before inspecting the item in person.'}</li>
            <li>{language === 'bn' ? 'জনবহুল ও নিরাপদ স্থানে দেখা করুন।' : 'Meet in well-lit, public locations (e.g. shopping mall or metro station).'}</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};
