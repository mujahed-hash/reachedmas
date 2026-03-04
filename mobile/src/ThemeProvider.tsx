import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, ThemeType } from './theme';

type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextType {
    theme: ThemeType;
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemColorScheme = useColorScheme();
    const [mode, setModeState] = useState<ThemeMode>('system');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // Load saved theme mode
        AsyncStorage.getItem('theme_mode').then((savedMode) => {
            if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
                setModeState(savedMode);
            }
            setIsMounted(true);
        });
    }, []);

    const setMode = async (newMode: ThemeMode) => {
        setModeState(newMode);
        await AsyncStorage.setItem('theme_mode', newMode);
    };

    const isDark = mode === 'system' ? systemColorScheme === 'dark' : mode === 'dark';
    const theme = isDark ? darkTheme : lightTheme;

    if (!isMounted) return null; // Wait for initial load to prevent flicker

    return (
        <ThemeContext.Provider value={{ theme, mode, setMode, isDark }}>
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
