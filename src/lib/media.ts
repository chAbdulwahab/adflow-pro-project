import { MEDIA_SOURCE } from '@/constants';

export interface NormalizedMedia {
  source_type: 'image' | 'youtube' | 'cloudinary';
  original_url: string;
  normalized_thumbnail_url: string;
  validation_status: 'valid' | 'invalid';
}

/**
 * Takes any URL and determines:
 *  - What type of media it is (YouTube, Cloudinary, direct image)
 *  - What thumbnail URL to use
 *  - Whether it's valid
 */
export function normalizeMediaUrl(url: string): NormalizedMedia {
  const trimmed = url.trim();

  // ===== 1. YOUTUBE =====
  const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
  const ytMatch = trimmed.match(youtubeRegex);
  if (ytMatch) {
    const videoId = ytMatch[1];
    return {
      source_type: MEDIA_SOURCE.YOUTUBE,
      original_url: trimmed,
      normalized_thumbnail_url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      validation_status: 'valid',
    };
  }

  // ===== 2. CLOUDINARY =====
  if (trimmed.includes('cloudinary.com') && trimmed.includes('/upload/')) {
    // Inject thumbnail transformation
    const thumbUrl = trimmed.replace('/upload/', '/upload/w_400,h_300,c_fill,q_auto,f_auto/');
    return {
      source_type: MEDIA_SOURCE.CLOUDINARY,
      original_url: trimmed,
      normalized_thumbnail_url: thumbUrl,
      validation_status: 'valid',
    };
  }

  // ===== 3. DIRECT IMAGE URL =====
  const imageExtRegex = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i;
  const httpsRegex = /^https?:\/\//;

  if (httpsRegex.test(trimmed) && imageExtRegex.test(trimmed)) {
    return {
      source_type: MEDIA_SOURCE.IMAGE,
      original_url: trimmed,
      normalized_thumbnail_url: trimmed, // Use same URL
      validation_status: 'valid',
    };
  }

  // ===== 4. INVALID =====
  return {
    source_type: MEDIA_SOURCE.IMAGE,
    original_url: trimmed,
    normalized_thumbnail_url: '/placeholder.jpg',
    validation_status: 'invalid',
  };
}

/**
 * Normalize an array of URLs
 */
export function normalizeMediaUrls(urls: string[]): NormalizedMedia[] {
  return urls.map(normalizeMediaUrl);
}