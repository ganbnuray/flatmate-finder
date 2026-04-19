import { getInitials, getAccentColor, ACCENT_COLORS } from './avatarHelpers';

describe('getInitials', () => {
  test('returns uppercase initials from a two-word name', () => {
    expect(getInitials('james olaitan')).toBe('JO');
  });

  test('returns a single initial for a single-word name', () => {
    expect(getInitials('James')).toBe('J');
  });

  test('returns only the first two initials when given three or more words', () => {
    // split → ['alice','bob','charlie'] → map → ['a','b','c'] → join → 'abc'
    // toUpperCase → 'ABC' → slice(0,2) → 'AB'
    expect(getInitials('alice bob charlie')).toBe('AB');
  });

  test('uppercases lowercase input', () => {
    expect(getInitials('alice')).toBe('A');
  });

  test('returns empty string for empty string input', () => {
    // ''.split(' ') → [''] → map(w => w[0]) → [undefined] → join('') → '' → slice → ''
    expect(getInitials('')).toBe('');
  });

  test('returns empty string for null input', () => {
    // (null || '') → '' — same path as empty string
    expect(getInitials(null)).toBe('');
  });

  test('returns empty string for undefined input', () => {
    // (undefined || '') → '' — same path as empty string
    expect(getInitials(undefined)).toBe('');
  });

  test('handles multiple consecutive spaces between words', () => {
    // 'a  b'.split(' ') → ['a', '', 'b'] → map → ['a', undefined, 'b']
    // join('') converts undefined to '' → 'ab' → toUpperCase → 'AB' → slice → 'AB'
    expect(getInitials('a  b')).toBe('AB');
  });
});

describe('getAccentColor', () => {
  test('returns a deterministic color for a specific user ID', () => {
    // 'abc123' char codes: a=97 b=98 c=99 1=49 2=50 3=51 → sum=444
    // 444 % 8 = 4 → ACCENT_COLORS[4] = '#f59e0b'
    expect(getAccentColor('abc123')).toBe('#f59e0b');
  });

  test('returns the same color on repeated calls with the same ID', () => {
    expect(getAccentColor('abc123')).toBe(getAccentColor('abc123'));
  });

  test('returns different colors for IDs with different char code sums', () => {
    // 'abc123' → sum 444, 444 % 8 = 4 → '#f59e0b'
    // 'xyz789' → sum 531, 531 % 8 = 3 → '#3b82f6'
    expect(getAccentColor('abc123')).toBe('#f59e0b');
    expect(getAccentColor('xyz789')).toBe('#3b82f6');
    expect(getAccentColor('abc123')).not.toBe(getAccentColor('xyz789'));
  });

  test('returns ACCENT_COLORS[0] for empty string input', () => {
    // ''.split('').reduce(..., 0) → 0 → 0 % 8 = 0 → ACCENT_COLORS[0]
    expect(getAccentColor('')).toBe(ACCENT_COLORS[0]);
    expect(getAccentColor('')).toBe('#6366f1');
  });

  test('handles null input without throwing', () => {
    // (null || '') → '' — same path as empty string
    expect(() => getAccentColor(null)).not.toThrow();
    expect(getAccentColor(null)).toBe(ACCENT_COLORS[0]);
  });

  test('handles undefined input without throwing', () => {
    // (undefined || '') → '' — same path as empty string
    expect(() => getAccentColor(undefined)).not.toThrow();
    expect(getAccentColor(undefined)).toBe(ACCENT_COLORS[0]);
  });

  test('every returned color is a member of ACCENT_COLORS', () => {
    const ids = ['abc123', 'xyz789', 'user-42', '', 'a', 'zzz'];
    for (const id of ids) {
      expect(ACCENT_COLORS).toContain(getAccentColor(id));
    }
  });
});
