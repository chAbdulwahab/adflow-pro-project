import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { slugify, generateUniqueSlug } from '@/lib/slug';
import { normalizeMediaUrl } from '@/lib/media';
import { calculateRankScore } from '@/lib/rank';
import { AD_STATUS, ROLES, ALLOWED_TRANSITIONS } from '@/constants';

export async function GET() {
  try {
    // Test DB
    const dbTest = await db.query('SELECT NOW() as time');

    // Test slug
    const slugTest = {
      simple: slugify('Selling my iPhone 15 Pro Max!'),
      unique: generateUniqueSlug('Selling my iPhone 15 Pro Max!'),
    };

    // Test media normalizer
    const mediaTests = {
      youtube: normalizeMediaUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
      youtu_be: normalizeMediaUrl('https://youtu.be/dQw4w9WgXcQ'),
      cloudinary: normalizeMediaUrl('https://res.cloudinary.com/demo/image/upload/sample.jpg'),
      direct_image: normalizeMediaUrl('https://example.com/photo.jpg'),
      invalid: normalizeMediaUrl('hello not a url'),
    };

    // Test rank score
    const rankTest = calculateRankScore({
      is_featured: true,
      package_weight: 3,
      publish_at: new Date(),
      admin_boost: 10,
      seller_is_verified: true,
    });

    return NextResponse.json({
      success: true,
      message: '✅ All utilities working!',
      db_time: dbTest.rows[0].time,
      constants: {
        sample_status: AD_STATUS.PUBLISHED,
        sample_role: ROLES.ADMIN,
        transitions_from_draft: ALLOWED_TRANSITIONS.draft,
      },
      slugs: slugTest,
      media: mediaTests,
      rank_score_example: `${rankTest} (Premium featured ad, verified seller, just posted)`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}