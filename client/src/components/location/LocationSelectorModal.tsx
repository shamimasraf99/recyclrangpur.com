import React from 'react';
import { MapPin, Check } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useLanguage } from '../../context/LanguageContext';
import { FIXTURE_DIVISIONS, FIXTURE_DISTRICTS } from '../../fixtures/mockData';
import { Division, District } from '../../../shared/types';

interface LocationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (loc: { division?: Division; district?: District; label: string }) => void;
  selectedDistrictId?: number;
}

export const LocationSelectorModal: React.FC<LocationSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  selectedDistrictId
}) => {
  const { language } = useLanguage();
  const rangpurCity = FIXTURE_DIVISIONS[0];

  const handleSelectAllRangpurCity = () => {
    onSelectLocation({
      division: rangpurCity,
      label: language === 'bn' ? 'রংপুর শহর (সব এলাকা)' : 'Rangpur City (All Areas)'
    });
    onClose();
  };

  const handleSelectArea = (area: District) => {
    onSelectLocation({
      division: rangpurCity,
      district: area,
      label: language === 'bn' ? `${area.nameBn}, রংপুর শহর` : `${area.nameEn}, Rangpur City`
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={language === 'bn' ? 'রংপুর শহরের এলাকা নির্বাচন করুন' : 'Select Area in Rangpur City'}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Select All of Rangpur City */}
        <button
          onClick={handleSelectAllRangpurCity}
          className="w-full flex items-center justify-between p-3.5 rounded-xl border border-emerald-500/40 hover:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-left transition-all"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-600 text-white">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-gray-900 dark:text-white block">
                {language === 'bn' ? 'রংপুর শহর (সব এলাকা)' : 'All of Rangpur City'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {language === 'bn' ? 'পুরো রংপুর মেট্রোপলিটন শহরের সকল বিজ্ঞাপন দেখুন' : 'Browse listings across all Rangpur Metropolitan areas'}
              </span>
            </div>
          </div>
          {!selectedDistrictId && <Check className="w-4 h-4 text-emerald-600" />}
        </button>

        {/* Rangpur City Neighborhoods Grid */}
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block px-1">
            {language === 'bn' ? 'রংপুর শহরের প্রধান এলাকাসমূহ' : 'Rangpur City Neighborhoods'}
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {FIXTURE_DISTRICTS.map(area => (
              <button
                key={area.id}
                onClick={() => handleSelectArea(area)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left border transition-colors ${
                  selectedDistrictId === area.id
                    ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                    : 'border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-800 dark:text-gray-200'
                }`}
              >
                <span>{language === 'bn' ? area.nameBn : area.nameEn}</span>
                {selectedDistrictId === area.id && <Check className="w-4 h-4 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
