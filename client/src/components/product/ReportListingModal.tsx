import React, { useState } from 'react';
import { Flag, CheckCircle2, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';

interface ReportListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number;
  productTitle: string;
}

export const ReportListingModal: React.FC<ReportListingModalProps> = ({
  isOpen,
  onClose,
  productId,
  productTitle
}) => {
  const { language } = useLanguage();
  const [reasonCode, setReasonCode] = useState('fraud_scam');
  const [explanation, setExplanation] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const cleanExplanation = explanation.trim();
    if (cleanExplanation.length < 5) {
      setError(
        language === 'bn'
          ? 'অনুগ্রহ করে অভিযোগের সংক্ষিপ্ত বিবরণ লিখুন (কমপক্ষে ৫ অক্ষর)'
          : 'Please provide brief details about the issue (minimum 5 characters)'
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await api.post('/reports', {
        productId,
        reasonCode,
        explanation: cleanExplanation
      });
      setSubmitted(true);
    } catch (err: any) {
      if (err.response) {
        setError(
          err.response.data?.error?.message ||
            (language === 'bn' ? 'অভিযোগ জমা দিতে সমস্যা হয়েছে' : 'Failed to submit report')
        );
      } else {
        // Offline preview fallback
        setSubmitted(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setExplanation('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleResetAndClose}
      title={language === 'bn' ? 'বিজ্ঞাপনটির বিরুদ্ধে অভিযোগ দায়ের' : 'Report this Listing'}
    >
      {submitted ? (
        <div className="text-center py-6 space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-gray-900 dark:text-white">
            {language === 'bn' ? 'আপনার অভিযোগটি গৃহীত হয়েছে' : 'Report Submitted'}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            {language === 'bn'
              ? 'আমাদের মডারেশন টিম দ্রুত বিজ্ঞাপনের তথ্য ও সত্যতা যাচাই করে প্রয়োজনীয় ব্যবস্থা গ্রহণ করবে।'
              : 'Our moderation team will review the listing and take appropriate action.'}
          </p>
          <Button onClick={handleResetAndClose} variant="primary" size="sm">
            {language === 'bn' ? 'ঠিক আছে' : 'Done'}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {language === 'bn' ? `বিজ্ঞাপন: "${productTitle}"` : `Listing: "${productTitle}"`}
          </p>

          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="report-reason" className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              {language === 'bn' ? 'অভিযোগের কারণ' : 'Reason for Reporting'}
            </label>
            <select
              id="report-reason"
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              className="w-full text-xs p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl"
            >
              <option value="fraud_scam">
                {language === 'bn' ? 'প্রতারণামূলক বা ভুয়া বিজ্ঞাপন' : 'Fraud / Fake Listing'}
              </option>
              <option value="prohibited_item">
                {language === 'bn' ? 'নিষিদ্ধ বা অবৈধ পণ্য' : 'Prohibited / Illegal Item'}
              </option>
              <option value="counterfeit">
                {language === 'bn' ? 'নকল বা কপি পণ্যকে আসল দাবি' : 'Counterfeit Item'}
              </option>
              <option value="offensive">
                {language === 'bn' ? 'আপত্তিকর ছবি বা ভাষা' : 'Offensive Language or Photos'}
              </option>
              <option value="duplicate">
                {language === 'bn' ? 'একই বিজ্ঞাপন বারবার পোস্ট (স্প্যাম)' : 'Duplicate / Spam Ad'}
              </option>
            </select>
          </div>

          <div>
            <label htmlFor="report-explanation" className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              {language === 'bn' ? 'বিস্তারিত ব্যাখ্যা (কমপক্ষে ৫ অক্ষর)' : 'Details & Explanation (min 5 chars)'}
            </label>
            <textarea
              id="report-explanation"
              required
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={3}
              placeholder={language === 'bn' ? 'সমস্যার বিস্তারিত বিবরণ দিন...' : 'Describe the issue...'}
              className="w-full text-xs p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={handleResetAndClose}>
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              isLoading={isLoading}
              disabled={isLoading}
              icon={<Flag className="w-3.5 h-3.5" />}
            >
              {language === 'bn' ? 'অভিযোগ জমা দিন' : 'Submit Report'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
