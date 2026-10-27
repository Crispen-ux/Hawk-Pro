import { useState } from "react";
import { DownloadIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useInstallPrompt } from "./use-install-prompt.ts";

// Bottom install prompt. Hidden in the builder preview iframe and once installed or dismissed.
export default function InstallBanner() {
  const { canInstall, isIos, install } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem("hawk-install-dismissed") === "1",
  );

  if (dismissed || window.self !== window.top || (!canInstall && !isIos))
    return null;

  const close = () => {
    localStorage.setItem("hawk-install-dismissed", "1");
    setDismissed(true);
  };

  return (
    <div
      className="fixed inset-x-3 bottom-20 z-30 mx-auto flex max-w-md items-center gap-3 border bg-card p-3 shadow-xl"
      role="dialog"
      aria-label="Install HAWK app"
    >
      <DownloadIcon className="size-5 shrink-0 text-primary" />
      <p className="flex-1 text-sm">
        {isIos
          ? "Add HAWK to your home screen: tap Share, then Add to Home Screen."
          : "Install HAWK for faster access."}
      </p>
      {!isIos && (
        <Button size="sm" onClick={() => void install()}>
          Install
        </Button>
      )}
      <Button size="icon" variant="ghost" aria-label="Dismiss" onClick={close}>
        <XIcon />
      </Button>
    </div>
  );
}
