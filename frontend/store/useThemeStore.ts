import { create } from 'zustand';

type Theme = 'clinical-day' | 'icu-night';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDarkMode: () => boolean;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'clinical-day',
  setTheme: (theme) => set({ theme }),
  isDarkMode: () => get().theme === 'icu-night',
}));
