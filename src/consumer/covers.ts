/**
 * Box cover art. Slugs are frozen in the bot repo (services/covers.py);
 * image files will land in public/covers/{slug}.webp later — until then
 * every cover renders as a CSS gradient placeholder, and the <img> is a
 * progressive enhancement with an onError fallback to the gradient.
 *
 * Unknown / null cover_id → classic.
 */

export const COVER_GRADIENTS: Record<string, string> = {
  // Warm amber — the default box.
  classic:
    'linear-gradient(135deg, #92400e 0%, #d97706 55%, #f6c453 100%)',
  // Dark with a golden centre glow.
  glow:
    'radial-gradient(ellipse at 50% 45%, rgba(250, 204, 21, 0.55) 0%, ' +
    'rgba(146, 64, 14, 0.35) 40%, #16120d 78%)',
  // Dark with a thin light seam — a box cracked open.
  unboxing:
    'linear-gradient(180deg, #171717 0%, #171717 46%, ' +
    'rgba(255, 241, 209, 0.9) 50%, #1c1917 54%, #1c1917 100%)',
  // Sunrise warmth.
  morning:
    'linear-gradient(160deg, #f9a8a8 0%, #fdba74 48%, #fde68a 100%)',
}

const FALLBACK_SLUG = 'classic'

export function coverSlug(coverId?: string | null): string {
  return coverId && coverId in COVER_GRADIENTS ? coverId : FALLBACK_SLUG
}

export function coverGradient(coverId?: string | null): string {
  return COVER_GRADIENTS[coverSlug(coverId)] ?? COVER_GRADIENTS[FALLBACK_SLUG]!
}

export function coverImageUrl(coverId?: string | null): string {
  return `/covers/${coverSlug(coverId)}.webp`
}
