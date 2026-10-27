import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_SETTINGS, type SettingsInput } from "../../db/validation";
import { fetchSettings } from "@/lib/api";
type SettingsValue = {
  settings: SettingsInput;
  ready: boolean;
  error: string | null;
  refresh: () => void;
  apply: (next: SettingsInput) => void;
};
const SettingsContext = createContext<SettingsValue | null>(null);
export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SettingsInput>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const revision = useRef(0);
  const channel = useRef<BroadcastChannel | null>(null);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  const apply = useCallback((next: SettingsInput) => {
    revision.current++;
    setSettings(next);
    setError(null);
    setReady(true);
    channel.current?.postMessage("changed");
  }, []);
  useEffect(() => {
    if (typeof BroadcastChannel !== "undefined") {
      channel.current = new BroadcastChannel("hawk-store-settings");
      channel.current.onmessage = refresh;
    }
    window.addEventListener("focus", refresh);
    return () => {
      channel.current?.close();
      channel.current = null;
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);
  useEffect(() => {
    let active = true;
    const current = ++revision.current;
    fetchSettings()
      .then((value) => {
        if (active && revision.current === current) {
          setSettings(value);
          setError(null);
        }
      })
      .catch((e) => {
        if (active && revision.current === current)
          setError(
            e instanceof Error
              ? e.message
              : "Store settings could not be loaded",
          );
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [version]);
  const value = useMemo(
    () => ({ settings, ready, error, refresh, apply }),
    [settings, ready, error, refresh, apply],
  );
  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
// eslint-disable-next-line react-refresh/only-export-components
export function useSiteSettings() {
  const value = useContext(SettingsContext);
  if (!value)
    throw new Error("useSiteSettings must be used inside SiteSettingsProvider");
  return value;
}
