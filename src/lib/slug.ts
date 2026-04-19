/**
 * Convert "Selling iPhone 15 Pro Max" → "selling-iphone-15-pro-max"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')    // Remove special chars
    .replace(/[\s_]+/g, '-')      // Replace spaces/underscores with -
    .replace(/-+/g, '-')          // Collapse multiple dashes
    .replace(/^-+|-+$/g, '')      // Remove leading/trailing dashes
    .substring(0, 200);           // Max length
}

/**
 * Generate a unique slug by appending a short random string
 * Example: "selling-iphone-15" → "selling-iphone-15-a3f8k2"
 */
export function generateUniqueSlug(title: string): string {
  const base = slugify(title);
  const random = Math.random().toString(36).substring(2, 8); // 6 chars
  return `${base}-${random}`;
}