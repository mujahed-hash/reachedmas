import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    lightTheme,
    darkThemeSky,
    darkThemeDeepBlue,
    ThemeType,
    DarkAccentId,
    DARK_ACCENT_STORAGE_KEY,
} from './theme';

type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextType {
    theme: ThemeType;
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
    isDark: boolean;
    /** Accent when dark mode is active (sky vs deep blue). Ignored in light mode. */
    darkAccent: DarkAccentId;
    setDarkAccent: (accent: DarkAccentId) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemColorScheme = useColorScheme();
    const [mode, setModeState] = useState<ThemeMode>('system');
    const [darkAccent, setDarkAccentState] = useState<DarkAccentId>('sky');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        Promise.all([
            AsyncStorage.getItem('theme_mode'),
            AsyncStorage.getItem(DARK_ACCENT_STORAGE_KEY),
        ]).then(([savedMode, savedAccent]) => {
            if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
                setModeState(savedMode);
            }
            if (savedAccent === 'sky' || savedAccent === 'deepBlue') {
                setDarkAccentState(savedAccent);
            }
            setIsMounted(true);
        });
    }, []);

    const setMode = async (newMode: ThemeMode) => {
        setModeState(newMode);
        await AsyncStorage.setItem('theme_mode', newMode);
    };

    const setDarkAccent = async (accent: DarkAccentId) => {
        setDarkAccentState(accent);
        await AsyncStorage.setItem(DARK_ACCENT_STORAGE_KEY, accent);
    };

    const isDark = mode === 'system' ? systemColorScheme === 'dark' : mode === 'dark';
    const theme: ThemeType = isDark
        ? darkAccent === 'deepBlue'
            ? darkThemeDeepBlue
            : darkThemeSky
        : lightTheme;

    if (!isMounted) return null;

    return (
        <ThemeContext.Provider value={{ theme, mode, setMode, isDark, darkAccent, setDarkAccent }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useAppTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useAppTheme must be used within a ThemeProvider');
    }
    return context;
}
