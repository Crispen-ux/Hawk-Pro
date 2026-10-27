import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";

const TITLES: Record<string, string> = {
  privacy: "Privacy policy",
  terms: "Terms and conditions",
};

export default function LegalPage() {
  const { doc = "" } = useParams();
  const title = TITLES[doc];

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-24 text-center">
      <h1 className="font-serif text-5xl font-extrabold uppercase">
        {title ?? "Page not found"}
      </h1>
      <p className="text-muted-foreground">
        {title
          ? "Placeholder: this document will be added once the business provides it."
          : "That page does not exist."}
      </p>
      <Button asChild>
        <Link to="/">Back home</Link>
      </Button>
    </div>
  );
}
