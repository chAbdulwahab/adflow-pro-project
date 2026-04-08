// Shared TypeScript types for AdFlow Pro

export type UserRole = 'client' | 'moderator' | 'admin' | 'super_admin';
export type UserStatus = 'active' | 'suspended' | 'banned';

export type AdStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'payment_pending'
  | 'payment_submitted'
  | 'payment_verified'
  | 'scheduled'
  | 'published'
  | 'expired'
  | 'archived'
  | 'rejected';

export type PaymentStatus = 'submitted' | 'verified' | 'rejected' | 'disputed';
export type MediaType = 'image' | 'youtube' | 'cloudinary';
export type MediaValidationStatus = 'pending' | 'valid' | 'invalid' | 'failed';
export type NotificationType =
  | 'status_update'
  | 'review_request'
  | 'approval'
  | 'rejection'
  | 'expiry_warning'
  | 'system_alert'
  | 'payment_verified';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface SellerProfile {
  id: string;
  user_id: string;
  display_name?: string;
  business_name?: string;
  phone?: string;
  city?: string;
  is_verified: boolean;
  verification_badge_type: 'bronze' | 'silver' | 'gold';
  total_ads_posted: number;
  avg_rating: number;
  created_at: string;
  updated_at: string;
}

export interface Package {
  id: string;
  name: string;
  duration_days: number;
  weight: number;
  is_featured: boolean;
  featured_weight: number;
  price: number;
  refresh_interval_days?: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon_url?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  ad_count?: number;
}

export interface City {
  id: string;
  name: string;
  slug: string;
  country: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  ad_count?: number;
}

export interface Ad {
  id: string;
  user_id: string;
  package_id: string;
  category_id: string;
  city_id: string;
  title: string;
  slug: string;
  description: string;
  status: AdStatus;
  price?: number;
  publish_at?: string;
  expire_at?: string;
  is_featured: boolean;
  featured_until?: string;
  rank_score: number;
  view_count: number;
  contact_phone?: string;
  contact_email?: string;
  is_visible_publicly: boolean;
  created_at: string;
  updated_at: string;
  published_at?: string;
  // Relations
  package?: Package;
  category?: Category;
  city?: City;
  seller?: SellerProfile & { user?: User };
  media?: AdMedia[];
}

export interface AdMedia {
  id: string;
  ad_id: string;
  source_type: MediaType;
  original_url: string;
  thumbnail_url?: string;
  normalized_url?: string;
  validation_status: MediaValidationStatus;
  error_message?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  ad_id: string;
  user_id: string;
  amount: number;
  method?: string;
  transaction_ref?: string;
  sender_name?: string;
  screenshot_url?: string;
  status: PaymentStatus;
  verified_by?: string;
  rejection_reason?: string;
  created_at: string;
  verified_at?: string;
  updated_at: string;
  ad?: Ad;
  user?: User;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  related_ad_id?: string;
  link?: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  token?: string;
}
