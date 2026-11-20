import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { HighlightColor } from './db/db';
import { syncSystemBars } from './native';

export interface Settings {
  primaryVersion: string | null;
  compareVersions: string[];
  compareOn: boolean;
  fontSize: number;
  lineHeight: number;
  fontFamily: 'sans' | 'serif';
  showDividers: boolean;
  showArrows: boolean;
  showMemos: boolean;
  theme: 'auto' | 'light' | 'dark';
  colors: { bg: string | null; text: string | null; verseNum: string | null; memo: string | null };
  highlightColor: HighlightColor;
  ttsRate: number;
  last: { book: number; chapter: number } | null;
}

export const DEFAULT_SETTINGS: Settings = {
  primaryVersion: null,
  compareVersions: [],
  compareOn: false,
  fontSize: 19,
  lineHeight: 1.75,
  fontFamily: 'serif',
  showDividers: true,
  showArrows: true,
  showMemos: true,
  theme: 'auto',
  colors: { bg: null, text: null, verseNum: null, memo: null },
  highlightColor: 'yellow',
  ttsRate: 1,
  last: null,
};

const KEY = 'mlb.settings';

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...s, colors: { ...DEFAULT_SETTINGS.colors, ...s.colors } };
    }
  } catch {
    /* 저장소를 쓸 수 없는 환경 */
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(s: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* 무시 */
  }
}

const Ctx = createContext<{ settings: Settings; update: (patch: Partial<Settings>) => void } | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(loadSettings);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'auto') delete root.dataset.theme;
    else root.dataset.theme = settings.theme;

    const media = matchMedia('(prefers-color-scheme: dark)');
    const sync = () => syncSystemBars(settings.theme === 'dark' || (settings.theme === 'auto' && media.matches));
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, [settings.theme]);

  return <Ctx.Provider value={{ settings, update }}>{children}</Ctx.Provider>;
}

export function useSettings() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('SettingsProvider 필요');
  return ctx;
}
