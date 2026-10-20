import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ProductCondition, ModerationStatus, AvailabilityStatus } from '../../../shared/types';
import { useLanguage } from '../../context/LanguageContext';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'condition' | 'moderation' | 'availability' | 'default';
  condition?: ProductCondition;
  moderation?: ModerationStatus;
  availability?: AvailabilityStatus;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  condition,
  moderation,
  availability,
  className
}) => {
  const { t } = useLanguage();

  if (variant === 'condition' && condition) {
    const conditionStyles = {
      like_new: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
      good: 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800',
      fair: 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
      for_parts: 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
    };

    return (
      <span className={twMerge(clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', conditionStyles[condition], className))}>
        {t(`condition.${condition}`)}
      </span>
    );
  }

  if (variant === 'moderation' && moderation) {
    const modStyles = {
      approved: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300',
      pending: 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300',
      rejected: 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-300',
      draft: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300'
    };

    return (
      <span className={twMerge(clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', modStyles[moderation], className))}>
        {t(`status.${moderation}`)}
      </span>
    );
  }

  if (variant === 'availability' && availability) {
    const availStyles = {
      available: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200',
      reserved: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200',
      sold: 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-300',
      archived: 'bg-gray-100 dark:bg-gray-900 text-gray-500 border-gray-300'
    };

    return (
      <span className={twMerge(clsx('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border', availStyles[availability], className))}>
        {t(`status.${availability}`)}
      </span>
    );
  }

  return (
    <span className={twMerge(clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-200', className))}>
      {children}
    </span>
  );
};
