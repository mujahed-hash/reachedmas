/** RGB triple for `rgba(${accentTint}, opacity)` — dark sky vs deep blue tints */
export type AccentTint = string;

export const lightTheme = {
    background: '#F8FAFC',
    card: '#FFFFFF',
    text: '#0F172A',
    textMuted: '#64748B',
    primary: '#2113FF', // Match web Premium Blue
    primarySoft: '#2113FF',
    primaryOnSurface: '#2113FF',
    primaryMutedBg: 'rgba(33, 19, 255, 0.1)',
    /** Light mode brand RGB */
    accentTint: '33,19,255' as AccentTint,
    border: '#E2E8F0',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B'
};

/** Default dark accent — fresh sky (blue-600 / sky) */
export const darkThemeSky = {
    background: '#08090a',
    card: 'rgba(255,255,255, 0.02)',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    primary: '#0284C7',
    primarySoft: '#0284C7',
    primaryOnSurface: '#0EA5E9',
    primaryMutedBg: 'rgba(2, 132, 199, 0.2)',
    accentTint: '2,132,199' as AccentTint,
    border: 'rgba(255,255,255, 0.05)',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B'
};

/**
 * Dark accent option — deeper true blue (blue-700 family), not the light theme purple (#2113FF).
 */
export const darkThemeDeepBlue = {
    background: '#08090a',
    card: 'rgba(255,255,255, 0.02)',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    primary: '#1D4ED8',
    primarySoft: '#1D4ED8',
    primaryOnSurface: '#60A5FA',
    primaryMutedBg: 'rgba(29, 78, 216, 0.22)',
    accentTint: '29,78,216' as AccentTint,
    border: 'rgba(255,255,255, 0.05)',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B'
};

/** @deprecated use darkThemeSky */
export const darkTheme = darkThemeSky;

export type ThemeType = typeof lightTheme;

export type DarkAccentId = 'sky' | 'deepBlue';

export const DARK_ACCENT_STORAGE_KEY = 'dark_accent';
