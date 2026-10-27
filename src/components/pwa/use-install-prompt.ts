import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<void> };

function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches;
}

export function useInstallPrompt() {
  const [event, setEvent] = useState<InstallEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent) && !isStandalone();
  const install = async () => {
    await event?.prompt();
    setEvent(null);
  };
  return { canInstall: event !== null && !isStandalone(), isIos, install };
}
