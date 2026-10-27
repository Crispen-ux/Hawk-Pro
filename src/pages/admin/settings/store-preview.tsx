import { Mail, Phone, MapPin, Clock, ExternalLink } from "lucide-react";
import type { SettingsInput } from "../../../../db/validation";
export default function StorePreview({
  settings,
}: {
  settings: SettingsInput;
}) {
  return (
    <section className="border bg-card overflow-hidden">
      <div className="bg-primary text-primary-foreground px-5 py-3 text-center text-xs uppercase font-semibold tracking-widest">
        {settings.announcement || "Your store announcement"}
      </div>
      <div className="p-6 space-y-5">
        <div>
          <p className="text-[10px] uppercase tracking-[.25em] text-muted-foreground mb-4">
            Storefront preview
          </p>
          <img
            src="/brand/hawk-white.png"
            alt="HAWK"
            className="h-16 w-auto invert dark:invert-0"
          />
          <h3 className="mt-4">{settings.store.name}</h3>
          <p className="text-sm text-muted-foreground mt-2">
            {settings.store.tagline}
          </p>
        </div>
        <ul className="space-y-4 text-sm">
          <li className="flex gap-3">
            <Mail className="size-4 shrink-0 text-primary" />
            <span className="break-all">
              {settings.contact.email || "Your support email"}
            </span>
          </li>
          <li className="flex gap-3">
            <Phone className="size-4 shrink-0 text-primary" />
            {settings.contact.phone || "Your phone number"}
          </li>
          <li className="flex gap-3">
            <MapPin className="size-4 shrink-0 text-primary" />
            <span className="whitespace-pre-line">
              {settings.contact.address || "Your store address"}
            </span>
          </li>
          <li className="flex gap-3">
            <Clock className="size-4 shrink-0 text-primary" />
            <span className="whitespace-pre-line">
              {settings.contact.hours || "Your trading hours"}
            </span>
          </li>
        </ul>
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-primary text-xs uppercase tracking-wider font-semibold"
        >
          Open storefront <ExternalLink size={14} />
        </a>
      </div>
    </section>
  );
}
