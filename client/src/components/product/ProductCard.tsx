import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Heart } from 'lucide-react';
import { Product } from '../../../shared/types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { language, formatPrice } = useLanguage();
  const { wishlistIds, toggleWishlist } = useAuth();
  const isWishlisted = wishlistIds.includes(product.id);

  const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
  const imageUrl = primaryImage?.thumbnailUrl || primaryImage?.imageUrl || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400';

  return (
    <div className="group relative bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col">
      {/* Thumbnail Container */}
      <Link to={`/products/${product.id}`} className="relative block aspect-[4/3] bg-gray-100 dark:bg-slate-900 overflow-hidden">
        <img
          src={imageUrl}
          alt={product.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Condition Badge Overlay */}
        <div className="absolute top-2.5 left-2.5">
          <Badge variant="condition" condition={product.condition} />
        </div>

        {/* Featured Tag */}
        {product.isFeatured && (
          <div className="absolute bottom-2.5 left-2.5 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
            {language === 'bn' ? 'ফিচার্ড' : 'Featured'}
          </div>
        )}
      </Link>

      {/* Wishlist Button Overlay */}
      <button
        onClick={(e) => {
          e.preventDefault();
          toggleWishlist(product.id);
        }}
        className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-transform active:scale-90 shadow-sm ${
          isWishlisted
            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400'
            : 'bg-white/80 dark:bg-slate-900/80 text-gray-500 hover:text-rose-500'
        }`}
        aria-label="Save to Wishlist"
      >
        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
      </button>

      {/* Item Meta & Details */}
      <div className="p-4 flex flex-col flex-1">
        {/* Price & Negotiable Flag */}
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {formatPrice(product.priceBdt)}
          </span>
          {product.isNegotiable && (
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
              {language === 'bn' ? 'আলোচনা সাপেক্ষ' : 'Negotiable'}
            </span>
          )}
        </div>

        {/* Title */}
        <Link to={`/products/${product.id}`} className="block mb-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {product.title}
          </h3>
        </Link>

        {/* Location & Time Footer */}
        <div className="mt-auto pt-3 border-t border-gray-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1 truncate max-w-[65%]">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate">
              {product.district ? (language === 'bn' ? product.district.nameBn : product.district.nameEn) : 'ঢাকা'}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0 text-[11px]">
            <Clock className="w-3 h-3 text-gray-400" />
            <span>{language === 'bn' ? 'আজ' : 'Today'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
