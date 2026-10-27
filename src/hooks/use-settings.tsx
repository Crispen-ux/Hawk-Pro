import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_SETTINGS, type SettingsInput } from "../../db/validation.ts";
import { fetchSettings } from "@/lib/api.ts";

type SettingsValue = {
  settings: SettingsInput;
  ready: boolean;
  refresh: () => void;
  apply: (next: SettingsInput) => void;
};

const SettingsContext = createContext<SettingsValue | null>(null);

// Announcement bar and contact block shown by the header and footer. If the
// database is unreachable the shipped defaults keep the chrome complete.
export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SettingsInput>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  const apply = useCallback((next: SettingsInput) => setSettings(next), []);

  useEffect(() => {
    let cancelled = false;
    fetchSettings()
      .then((value) => {
        if (!cancelled) setSettings(value);
      })
      .catch(() => {
        /* keep defaults */
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [version]);

  const value = useMemo(
    () => ({ settings, ready, refresh, apply }),
    [settings, ready, refresh, apply],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSiteSettings(): SettingsValue {
  const ctx = useContext(SettingsContext);
  if (!ctx)
    throw new Error("useSiteSettings must be used inside SiteSettingsProvider");
  return ctx;
}
