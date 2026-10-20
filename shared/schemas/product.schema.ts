import { z } from 'zod';

export const productConditionEnum = z.enum(['like_new', 'good', 'fair', 'for_parts']);
export const moderationStatusEnum = z.enum(['draft', 'pending', 'approved', 'rejected']);
export const availabilityStatusEnum = z.enum(['available', 'reserved', 'sold', 'archived']);

const safeImageUrlSchema = z
  .string()
  .max(2097152, { message: 'Image payload too large' })
  .refine(
    (val) =>
      /^https?:\/\/[^\s"'<>]+$/i.test(val) ||
      /^data:image\/(webp|jpeg|jpg|png);base64,[A-Za-z0-9+/=]+$/i.test(val),
    {
      message: 'শুধুমাত্র বৈধ HTTP/HTTPS বা প্রসেসকৃত ছবির লিঙ্ক গ্রহণযোগ্য / Only valid HTTP(S) or image data URLs are allowed'
    }
  );

export const createProductSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, { message: 'বিজ্ঞাপনের শিরোনাম কমপক্ষে ৫ অক্ষরের হতে হবে / Title must be at least 5 characters' })
    .max(150, { message: 'শিরোনাম ১৫০ অক্ষরের মধ্যে হতে হবে / Title cannot exceed 150 characters' }),
  description: z
    .string()
    .trim()
    .min(20, { message: 'পণ্যের বিবরণ কমপক্ষে ২০ অক্ষরের হতে হবে / Description must be at least 20 characters' })
    .max(5000),
  categoryId: z.coerce.number().int().positive({ message: 'ক্যাটাগরি নির্বাচন করুন / Select category' }),
  subcategoryId: z.coerce.number().int().positive({ message: 'সাবক্যাটাগরি নির্বাচন করুন / Select subcategory' }),
  priceBdt: z.coerce
    .number()
    .min(0, { message: 'মূল্য অবশ্যই ধনাত্মক সংখ্যা হতে হবে / Price must be positive' })
    .max(999999999),
  isNegotiable: z.boolean().default(false),
  condition: productConditionEnum,
  divisionId: z.coerce.number().int().positive({ message: 'বিভাগ নির্বাচন করুন / Select division' }),
  districtId: z.coerce.number().int().positive({ message: 'জেলা নির্বাচন করুন / Select district' }),
  upazilaId: z.coerce.number().int().positive().nullable().optional(),
  areaDetails: z.string().trim().max(255).optional(),
  contactPhone: z
    .string()
    .trim()
    .regex(/^(?:\+8801|01)[3-9]\d{8}$/, { message: 'সঠিক বাংলাদেশি মোবাইল নম্বর দিন / Valid Bangladeshi phone required' }),
  hidePhone: z.boolean().default(false),
  allowWhatsapp: z.boolean().default(true),
  imageUrls: z
    .array(safeImageUrlSchema)
    .min(1, { message: 'কমপক্ষে ১টি ছবি আপলোড করুন / Upload at least 1 image' })
    .max(5, { message: 'সর্বোচ্চ ৫টি ছবি আপলোড করা যাবে / Maximum 5 images allowed' }),
  moderationStatus: z.enum(['draft', 'pending']).optional().default('pending')
});

export const updateProductSchema = createProductSchema.partial().extend({
  availabilityStatus: availabilityStatusEnum.optional()
});

export const updateAvailabilitySchema = z.object({
  availabilityStatus: availabilityStatusEnum
});

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(60).default(24),
  q: z.string().max(200).optional(),
  category: z.union([z.string(), z.number()]).optional(),
  subcategory: z.union([z.string(), z.number()]).optional(),
  division: z.union([z.string(), z.number()]).optional(),
  district: z.union([z.string(), z.number()]).optional(),
  upazila: z.union([z.string(), z.number()]).optional(),
  condition: productConditionEnum.optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().positive().optional(),
  isNegotiable: z.coerce.boolean().optional(),
  sort: z.enum(['newest', 'price_low_high', 'price_high_low', 'most_viewed']).default('newest')
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
