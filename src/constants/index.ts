// ============================================
// USER ROLES
// ============================================
export const ROLES = {
  CLIENT: 'client',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// ============================================
// AD STATUSES (The state machine values)
// ============================================
export const AD_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  PAYMENT_PENDING: 'payment_pending',
  PAYMENT_SUBMITTED: 'payment_submitted',
  PAYMENT_VERIFIED: 'payment_verified',
  SCHEDULED: 'scheduled',
  PUBLISHED: 'published',
  EXPIRED: 'expired',
  REJECTED: 'rejected',
  ARCHIVED: 'archived',
} as const;

export type AdStatus = typeof AD_STATUS[keyof typeof AD_STATUS];

// ============================================
// ALLOWED STATE TRANSITIONS (critical!)
// ============================================
export const ALLOWED_TRANSITIONS: Record<AdStatus, AdStatus[]> = {
  draft:             ['submitted'],
  submitted:         ['under_review'],
  under_review:      ['payment_pending', 'rejected'],
  payment_pending:   ['payment_submitted'],
  payment_submitted: ['payment_verified', 'rejected'],
  payment_verified:  ['scheduled', 'published'],
  scheduled:         ['published'],
  published:         ['expired', 'archived'],
  expired:           ['archived', 'payment_pending'],
  rejected:          ['draft'],
  archived:          [],
};

// ============================================
// PAYMENT STATUS
// ============================================
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
} as const;

// ============================================
// PAYMENT METHODS
// ============================================
export const PAYMENT_METHODS = ['jazzcash', 'easypaisa', 'bank_transfer'] as const;

// ============================================
// MEDIA SOURCE TYPES
// ============================================
export const MEDIA_SOURCE = {
  IMAGE: 'image',
  YOUTUBE: 'youtube',
  CLOUDINARY: 'cloudinary',
} as const;

// ============================================
// NOTIFICATION TYPES
// ============================================
export const NOTIFICATION_TYPES = {
  AD_APPROVED: 'ad_approved',
  AD_REJECTED: 'ad_rejected',
  PAYMENT_VERIFIED: 'payment_verified',
  PAYMENT_REJECTED: 'payment_rejected',
  AD_PUBLISHED: 'ad_published',
  AD_EXPIRED: 'ad_expired',
  AD_EXPIRING_SOON: 'ad_expiring_soon',
} as const;