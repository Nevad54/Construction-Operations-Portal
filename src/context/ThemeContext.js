import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const DEFAULT_THEME_CONTEXT = {
  theme: 'light',
  toggleTheme: () => {},
};

// Use a non-undefined default so accidental missing providers don't crash the app.
// We still warn in development to catch wiring issues early.
const ThemeContext = createContext(DEFAULT_THEME_CONTEXT);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    
    if (saved) {
      setTheme(saved);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
    
    setMounted(true);
  }, []);

  // Update DOM and localStorage when theme changes
  useEffect(() => {
    if (!mounted) return;

    const html = document.documentElement;
    
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const value = useMemo(() => ({ theme, toggleTheme }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('useTheme used without ThemeProvider; falling back to light theme.');
    }
    return DEFAULT_THEME_CONTEXT;
  }
  return context;
}
