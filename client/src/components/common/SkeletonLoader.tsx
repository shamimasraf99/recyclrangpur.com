import React from 'react';

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-gray-100 dark:border-slate-700 shadow-sm animate-pulse">
      <div className="w-full aspect-[4/3] bg-gray-200 dark:bg-slate-700" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-1/3" />
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4" />
        </div>
      </div>
    </div>
  );
};

export const DetailSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-pulse">
      <div className="md:col-span-2 space-y-4">
        <div className="w-full aspect-video bg-gray-200 dark:bg-slate-700 rounded-xl" />
        <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-2/3" />
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full" />
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-4/5" />
      </div>
      <div className="space-y-4">
        <div className="h-32 bg-gray-200 dark:bg-slate-700 rounded-xl" />
        <div className="h-48 bg-gray-200 dark:bg-slate-700 rounded-xl" />
      </div>
    </div>
  );
};
