/** Default human placeholder used across CRM when no photo is uploaded. */
export const DEFAULT_AVATAR_URL = '/default-avatar.png'

export function getDefaultAvatar(_name = 'User'): string {
  return DEFAULT_AVATAR_URL
}

/**
 * Resolve a usable avatar URL.
 * Falls back to the human dummy image for empty, Dicebear, or invalid values.
 */
export function resolveAvatar(avatar: string | undefined | null, _name = 'User'): string {
  if (!avatar || typeof avatar !== 'string') return DEFAULT_AVATAR_URL

  const trimmed = avatar.trim()
  if (!trimmed) return DEFAULT_AVATAR_URL

  // Legacy generated placeholders
  if (trimmed.includes('api.dicebear.com')) return DEFAULT_AVATAR_URL
  if (trimmed.startsWith('data:image/svg+xml')) return DEFAULT_AVATAR_URL

  return trimmed
}

/** Use on <img onError={...}> to swap broken images to the dummy avatar. */
export function handleAvatarError(event: { currentTarget: HTMLImageElement }) {
  const img = event.currentTarget
  if (img.dataset.fallbackApplied === '1') return
  img.dataset.fallbackApplied = '1'
  img.src = DEFAULT_AVATAR_URL
}
