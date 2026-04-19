import { z } from 'zod';

// ============================================
// AUTH VALIDATORS
// ============================================

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .trim(),
  email: z
    .string()
    .email('Invalid email')
    .max(255)
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100),
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(20).trim(),
  city: z.string().min(2, 'City is required').max(100).trim(),
  business_name: z.string().max(150, 'Business name too long').optional().nullable(),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(20).trim(),
  city: z.string().min(2, 'City is required').max(100).trim(),
  business_name: z.string().max(150, 'Business name too long').optional().nullable(),
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// ============================================
// AD VALIDATORS
// ============================================

export const adCreateSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title too long')
    .trim(),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(5000, 'Description too long')
    .trim(),
  // Zod v4: coerce string → number, then validate
  price: z.coerce
    .number()
    .min(0, 'Price cannot be negative')
    .optional()
    .nullable(),
  category_id: z.string().uuid('Invalid category ID'),
  city_name:   z.string().min(2, 'City is required').max(100, 'City name too long').trim(),
  package_id:  z.string().uuid('Invalid package ID'),
  media_urls: z
    .array(
      z
        .string()
        .url('Each media item must be a valid URL')
        .refine(
          (url) => url.startsWith('http://') || url.startsWith('https://'),
          'Media URLs must start with http:// or https://. Base64 images (data:...) are not supported — please use a YouTube link, Cloudinary URL, or a direct image URL.'
        )
    )
    .min(1, 'At least one media URL is required')
    .max(10, 'Maximum 10 media items allowed'),
});

// Zod v4: z.enum() only accepts the error/message string shorthand
export const reviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejection_reason: z.string().min(5).max(500).optional().nullable(),
});

export type AdCreateInput = z.infer<typeof adCreateSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;

// ============================================
// PAYMENT VALIDATORS
// ============================================

export const paymentSubmitSchema = z.object({
  amount: z.coerce
    .number()
    .positive('Amount must be greater than 0'),
  method: z.enum(['jazzcash', 'easypaisa', 'bank_transfer']),
  transaction_ref: z
    .string()
    .min(4, 'Transaction reference must be at least 4 characters')
    .max(100, 'Transaction reference too long')
    .trim(),
  sender_name: z
    .string()
    .min(2, 'Sender name too short')
    .max(100, 'Sender name too long')
    .trim(),
  screenshot_url: z
    .string()
    .url('Screenshot must be a valid URL')
    .optional()
    .nullable(),
});

export const paymentVerifySchema = z.object({
  action: z.enum(['verify', 'reject']),
  rejection_note: z.string().min(5).max(500).optional().nullable(),
});

export type PaymentSubmitInput = z.infer<typeof paymentSubmitSchema>;
export type PaymentVerifyInput = z.infer<typeof paymentVerifySchema>;