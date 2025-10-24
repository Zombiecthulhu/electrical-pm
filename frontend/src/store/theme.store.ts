import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeVariant = 'professional-blue' | 'electrical-orange' | 'forest-green' | 'dark-mode' | 'inman-knight';
export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  currentTheme: ThemeVariant;
  mode: ThemeMode;
  setTheme: (theme: ThemeVariant) => void;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
}

// Load theme from localStorage on initialization
const getStoredTheme = (): ThemeVariant => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('theme');
    if (stored && ['professional-blue', 'electrical-orange', 'forest-green', 'dark-mode', 'inman-knight'].includes(stored)) {
      return stored as ThemeVariant;
    }
  }
  return 'professional-blue';
};

const getStoredMode = (): ThemeMode => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('darkMode');
    return stored === 'true' ? 'dark' : 'light';
  }
  return 'light';
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      currentTheme: getStoredTheme(),
      mode: getStoredMode(),
      
      setTheme: (theme: ThemeVariant) => {
        set({ currentTheme: theme });
        // Don't automatically change mode when selecting themes
        // Let the user control mode independently
      },
      
      toggleMode: () => {
        const currentMode = get().mode;
        const newMode = currentMode === 'light' ? 'dark' : 'light';
        set({ mode: newMode });
      },
      
      setMode: (mode: ThemeMode) => {
        set({ mode });
      },
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({
        currentTheme: state.currentTheme,
        mode: state.mode,
      }),
    }
  )
);
