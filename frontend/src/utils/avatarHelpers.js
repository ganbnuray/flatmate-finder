/**
 * @fileoverview Shared avatar utilities used by MatchesPage and MessagesPage
 * to render colored initials avatars from profile data.
 */

/** Palette of accent colors assigned to avatar backgrounds by user ID hash. */
export const ACCENT_COLORS = [
  '#6366f1', '#10b981', '#ec4899', '#3b82f6',
  '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6',
];

/**
 * Extracts up to two initials from a display name.
 *
 * @param {string} displayName - The user's display name.
 * @returns {string} One or two uppercase initial characters.
 */
export function getInitials(displayName) {
  return (displayName || '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Derives a deterministic accent color from a user ID string.
 *
 * Sums the character codes of the ID and maps to an index in ACCENT_COLORS.
 *
 * @param {string} userId - The user's unique identifier.
 * @returns {string} A hex color string from ACCENT_COLORS.
 */
export function getAccentColor(userId) {
  const hash = (userId || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return ACCENT_COLORS[hash % ACCENT_COLORS.length];
}
