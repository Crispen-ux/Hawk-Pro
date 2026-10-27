import { useSyncExternalStore } from "react";
import { WifiOffIcon } from "lucide-react";

function subscribe(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

export default function OfflineIndicator() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine);
  if (online) return null;
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-destructive px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white"
    >
      <WifiOffIcon className="size-4" /> You're offline. Some features need a
      connection.
    </div>
  );
}
