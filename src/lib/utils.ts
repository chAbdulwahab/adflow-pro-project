import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return format(new Date(date), 'MMM d, yyyy');
}

export function timeAgo(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function generateSlug(title: string): string {
  const base = slugify(title);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPrice(price: number): string {
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `${(price / 1_000).toFixed(0)}K`;
  return price.toString();
}

export const AD_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  payment_pending: 'Payment Pending',
  payment_submitted: 'Payment Submitted',
  payment_verified: 'Payment Verified',
  scheduled: 'Scheduled',
  published: 'Published',
  expired: 'Expired',
  archived: 'Archived',
  rejected: 'Rejected',
};

export const AD_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
  submitted: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  under_review: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  payment_pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  payment_submitted: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  payment_verified: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  scheduled: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  published: 'bg-green-500/20 text-green-300 border-green-500/30',
  expired: 'bg-red-500/20 text-red-300 border-red-500/30',
  archived: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  rejected: 'bg-red-700/20 text-red-400 border-red-700/30',
};

export function getStatusBadge(status: string) {
  return {
    label: AD_STATUS_LABELS[status] ?? status,
    className: AD_STATUS_COLORS[status] ?? 'bg-zinc-500/20 text-zinc-300',
  };
}

export function calculateRankScore(ad: {
  is_featured: boolean;
  package?: { weight: number };
  published_at?: string;
  seller?: { is_verified: boolean };
}): number {
  const featuredBonus = ad.is_featured ? 50 : 0;
  const packageBonus = (ad.package?.weight ?? 1) * 10;
  const daysSincePublish = ad.published_at
    ? (Date.now() - new Date(ad.published_at).getTime()) / (1000 * 60 * 60 * 24)
    : 0;
  const freshnessPoints = Math.max(0, 20 - daysSincePublish / 2);
  const verifiedBonus = ad.seller?.is_verified ? 5 : 0;
  return featuredBonus + packageBonus + freshnessPoints + verifiedBonus;
}

export function normalizeMediaUrl(url: string, type: string) {
  if (type === 'youtube') {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (match) {
      return {
        normalized_url: `https://www.youtube.com/embed/${match[1]}`,
        thumbnail_url: `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`,
      };
    }
  }
  return { normalized_url: url, thumbnail_url: url };
}
