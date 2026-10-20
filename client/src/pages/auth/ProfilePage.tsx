import React, { useState } from 'react';
import { User, Phone, Mail, MapPin, ShieldCheck, Check, Save } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { FIXTURE_DIVISIONS, FIXTURE_DISTRICTS } from '../../fixtures/mockData';

export const ProfilePage: React.FC = () => {
  const { language } = useLanguage();
  const { currentUser } = useAuth();

  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [phoneNumber] = useState(currentUser?.phoneNumber || '');
  const [email] = useState(currentUser?.email || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [divisionId, setDivisionId] = useState<number>(currentUser?.divisionId || 1);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-slate-700 shadow-sm space-y-6">
        
        {/* Profile Card Header */}
        <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-gray-100 dark:border-slate-700 text-center sm:text-left">
          <img
            src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
            alt={currentUser?.fullName}
            className="w-20 h-20 rounded-full object-cover ring-4 ring-emerald-500/20"
          />
          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {currentUser?.fullName}
              </h1>
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>যাচাইকৃত</span>
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {currentUser?.email} • {currentUser?.phoneNumber}
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{language === 'bn' ? 'প্রোফাইল তথ্য সফলভাবে সংরক্ষিত হয়েছে' : 'Profile updated successfully'}</span>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                {language === 'bn' ? 'পুরো নাম' : 'Full Name'}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full text-xs p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                {language === 'bn' ? 'বিভাগ' : 'Division'}
              </label>
              <select
                value={divisionId}
                onChange={(e) => setDivisionId(parseInt(e.target.value, 10))}
                className="w-full text-xs p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl"
              >
                {FIXTURE_DIVISIONS.map(d => (
                  <option key={d.id} value={d.id}>{d.nameBn} ({d.nameEn})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              {language === 'bn' ? 'বায়ো / পরিচয়' : 'Bio / About You'}
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={language === 'bn' ? 'নিজের সম্পর্কে কিছু লিখুন...' : 'A brief description about yourself...'}
              className="w-full text-xs p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <Button type="submit" variant="primary" size="md" icon={<Save className="w-4 h-4" />}>
              {language === 'bn' ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
