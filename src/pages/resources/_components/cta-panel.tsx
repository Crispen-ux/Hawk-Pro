import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { CTA_COPY, type CtaTarget } from "@/data/resources.ts";

// Lead-generation call to action linking into the enquiry forms.
export default function CtaPanel({ target }: { target: CtaTarget }) {
  const c = CTA_COPY[target];
  return (
    <aside className="space-y-3 border-l-2 border-primary bg-muted/50 p-6">
      <h2 className="font-serif text-3xl font-extrabold uppercase leading-none">
        {c.heading}
      </h2>
      <p className="text-sm text-muted-foreground">{c.text}</p>
      <Button asChild size="lg">
        <Link to={c.to}>{c.label}</Link>
      </Button>
    </aside>
  );
}
