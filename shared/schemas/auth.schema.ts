import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: 'নাম কমপক্ষে ২ অক্ষরের হতে হবে / Name must be at least 2 characters' })
    .max(100),
  email: z
    .string()
    .email({ message: 'সঠিক ইমেইল ঠিকানা দিন / Please enter a valid email address' })
    .max(191),
  phoneNumber: z
    .string()
    .regex(/^(?:\+8801|01)[3-9]\d{8}$/, {
      message: 'সঠিক বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 01712345678) / Valid Bangladeshi phone number required'
    }),
  password: z
    .string()
    .min(8, { message: 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে / Password must be at least 8 characters' })
    .max(100),
  preferredLanguage: z.enum(['bn', 'en']).default('bn')
});

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(3, { message: 'ইমেইল অথবা ফোন নম্বর দিন / Enter email or phone number' }),
  password: z
    .string()
    .min(1, { message: 'পাসওয়ার্ড প্রদান করুন / Password is required' })
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'বর্তমান পাসওয়ার্ড আবশ্যক' }),
  newPassword: z.string().min(8, { message: 'নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে' })
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
