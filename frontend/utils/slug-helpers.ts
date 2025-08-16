/**
 * Utility functions for working with slugs
 */

/**
 * Generate a URL-safe slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Check if a string is a valid UUID v4
 */
export function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

/**
 * Get race parameter from route (handles both slug and legacy ID)
 */
export async function getRaceFromRoute(route: any, useRaces: any) {
  const param = route.params.slug || route.params.id

  // If it's a UUID, fetch by ID (legacy support)
  if (isUUID(param)) {
    return await useRaces.fetchRaceById(param)
  }

  // Otherwise, fetch by slug
  return await useRaces.fetchRaceBySlug(param)
}
