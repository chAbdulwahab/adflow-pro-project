import type { Role, AdStatus } from '@/constants';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'active' | 'suspended' | 'banned';
  created_at: string;
}

export interface Package {
  id: string;
  name: string;
  duration_days: number;
  weight: number;
  is_featured: boolean;
  price: number;
  description: string | null;
  is_active: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

export interface City {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

export interface Ad {
  id: string;
  user_id: string;
  package_id: string | null;
  category_id: string | null;
  city_id: string | null;
  title: string;
  slug: string;
  description: string;
  price: number | null;
  status: AdStatus;
  publish_at: string | null;
  expire_at: string | null;
  rank_score: number;
  admin_boost: number;
  is_featured: boolean;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdMedia {
  id: string;
  ad_id: string;
  source_type: 'image' | 'youtube' | 'cloudinary';
  original_url: string;
  normalized_thumbnail_url: string;
  validation_status: 'pending' | 'valid' | 'invalid';
  display_order: number;
}

export interface Payment {
  id: string;
  ad_id: string;
  amount: number;
  method: string;
  transaction_ref: string;
  sender_name: string;
  screenshot_url: string | null;
  status: 'pending' | 'verified' | 'rejected';
  verified_by: string | null;
  verified_at: string | null;
  rejection_note: string | null;
  created_at: string;
}

// JWT payload shape
export interface JWTPayload {
  id: string;
  role: Role;
  email: string;
  iat?: number;
  exp?: number;
}