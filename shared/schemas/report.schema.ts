import { z } from 'zod';

export const reportReasonEnum = z.enum([
  'fraud_scam',
  'prohibited_item',
  'counterfeit',
  'offensive',
  'duplicate',
  'wrong_category',
  'other'
]);

export const createReportSchema = z
  .object({
    productId: z.coerce.number().int().positive().optional(),
    reportedUserId: z.coerce.number().int().positive().optional(),
    reasonCode: reportReasonEnum,
    explanation: z
      .string()
      .trim()
      .min(5, { message: 'অভিযোগের সংক্ষিপ্ত বিবরণ দিন (কমপক্ষে ৫ অক্ষর) / Please provide report details (min 5 chars)' })
      .max(2000, { message: 'বিবরণ ২০০০ অক্ষরের বেশি হতে পারবে না / Explanation cannot exceed 2000 characters' })
  })
  .refine((data) => Boolean(data.productId || data.reportedUserId), {
    message: 'অভিযোগের জন্য বিজ্ঞাপন বা ব্যবহারকারী নির্দিষ্ট করা আবশ্যক / Either productId or reportedUserId is required',
    path: ['productId']
  });

export type CreateReportInput = z.infer<typeof createReportSchema>;
