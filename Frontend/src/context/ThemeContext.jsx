/**
 * ThemeContext Component
 * 
 * What is it?
 * A dedicated React Context Provider (`ThemeProvider`) and custom hook (`useTheme`) for managing light and dark mode themes.
 * 
 * What does it do?
 * 1. Initializes theme state ('light' or 'dark') by checking `localStorage` or matching system preferences (`prefers-color-scheme`).
 * 2. Dynamically toggles the `dark` CSS class on `document.documentElement` (`<html>` element) to trigger Tailwind CSS dark mode styles.
 * 3. Persists theme choices in `localStorage` for consistent user experience across sessions.
 * 4. Provides a `toggleTheme()` handler function to switch between light and dark modes.
 * 5. Exposes the `useTheme()` custom hook for easy access to theme state and toggle handlers throughout the app.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(undefined);

export const ThemeProvider = ({ children }) => {
    // Initialize theme from localStorage or fallback to OS color scheme preference
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        if (saved === 'light' || saved === 'dark') return saved;
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });

    // Effect: Synchronize the 'dark' CSS class on <html> element and persist active theme to localStorage
    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Toggles active theme state between 'light' and 'dark'
    const toggleTheme = () => {
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

/**
 * Custom hook to safely consume ThemeContext.
 * Throws an explicit error if invoked outside of a ThemeProvider context tree.
 */
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

