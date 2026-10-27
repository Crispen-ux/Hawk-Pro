import { Mail, Phone, Clock, MapPin } from "lucide-react";
import { useSiteSettings } from "@/hooks/use-settings";
export default function StoreContact() {
  const { settings } = useSiteSettings();
  const { contact } = settings;
  return (
    <section className="border-t pt-6 space-y-4">
      <h2 className="font-serif text-2xl uppercase font-bold">
        Talk to {settings.store.name}
      </h2>
      <address className="not-italic space-y-3 text-sm text-muted-foreground">
        <p className="flex gap-3">
          <Mail className="size-4 shrink-0 text-primary" />
          <a
            href={"mailto:" + contact.email}
            className="hover:text-primary break-all"
          >
            {contact.email}
          </a>
        </p>
        <p className="flex gap-3">
          <Phone className="size-4 shrink-0 text-primary" />
          <a
            href={"tel:" + contact.phone.replace(/[^+0-9]/g, "")}
            className="hover:text-primary"
          >
            {contact.phone}
          </a>
        </p>
        <p className="flex gap-3 whitespace-pre-line">
          <MapPin className="size-4 shrink-0 text-primary" />
          {contact.address}
        </p>
      </address>
      <p className="flex gap-3 whitespace-pre-line text-sm text-muted-foreground">
        <Clock className="size-4 shrink-0 text-primary" />
        {contact.hours}
      </p>
    </section>
  );
}
