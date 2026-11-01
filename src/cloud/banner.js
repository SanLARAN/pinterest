// 3.0x: profile banners. What a banner may be, and how big — one place for the cloud, the profile screen and the
// tests. The bucket's own limits (supabase/migrations/20261101120000_hush_profile_cards.sql) say the same.
export const BANNER_BUCKET = 'hush-banners';
export const BANNER_MAX = 20 * 1024 * 1024; // 20 MB
export const BANNER_EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'video/mp4': 'mp4' };
export const BANNER_ACCEPT = '.png,.jpg,.jpeg,.gif,.mp4,image/png,image/jpeg,image/gif,video/mp4';

// 'image' | 'video' | null (anything else is refused before it is uploaded)
export function bannerKind(file) {
  const type = file && file.type;
  if (!type || !BANNER_EXT[type]) return null;
  return type === 'video/mp4' ? 'video' : 'image';
}

// why a file cannot be a banner, as an error code the profile turns into words (or null when it can)
export function bannerProblem(file) {
  if (!file) return 'banner_none';
  if (!bannerKind(file)) return 'banner_type';
  if (file.size > BANNER_MAX) return 'banner_size';
  return null;
}
