import type { CSSProperties } from 'react';

export const CLAY_COLORS = {
    bg: '#F0EDFA',
    surface: '#FFFFFF',
    surfaceAlt: '#F7F5FF',
    dark: '#1B1D2A',
    darkAlt: '#252840',
    text: '#1B1D2A',
    textSecondary: '#4A4D68',
    textMuted: '#8B8FA8',
    primary: '#6C63FF',
    primaryLight: '#8B85FF',
    accent: '#FF6B8A',
    safe: '#34D399',
    safeDark: '#059669',
    moderate: '#FBBF24',
    high: '#F87171',
    restricted: '#A78BFA',
    critical: '#EF4444',
    orange: '#FF7A00',
    border: 'rgba(27,29,42,0.08)',
} as const;

export const CLAY_CARD_STYLE: CSSProperties = {
    background: CLAY_COLORS.surface,
    borderRadius: 20,
    border: `1px solid ${CLAY_COLORS.border}`,
    boxShadow: '6px 6px 14px rgba(27,29,42,0.10), -3px -3px 10px rgba(255,255,255,0.9)',
};

export const CLAY_CARD_INNER_STYLE: CSSProperties = {
    background: CLAY_COLORS.surfaceAlt,
    borderRadius: 14,
    border: `1px solid ${CLAY_COLORS.border}`,
    boxShadow: 'inset 3px 3px 6px rgba(27,29,42,0.06), inset -2px -2px 4px rgba(255,255,255,0.8)',
};