import { useState } from "react";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useAction,
} from "convex/react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { api } from "@/convex/_generated/api.js";
import { errorText } from "@/components/ai/use-ai-picks.ts";

function Drafter() {
  const run = useAction(api.ai.shop.draftDescription);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [facts, setFacts] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<{ short: string; long: string } | null>(
    null,
  );

  const go = async () => {
    setLoading(true);
    setError("");
    try {
      setDraft(await run({ name, category, notes: facts }));
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="d-name">Product name</Label>
        <Input
          id="d-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="d-cat">Category</Label>
        <Input
          id="d-cat"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Subwoofer"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="d-facts">Verified facts (only these are used)</Label>
        <Textarea
          id="d-facts"
          rows={4}
          value={facts}
          onChange={(e) => setFacts(e.target.value)}
        />
      </div>
      <Button
        onClick={() => void go()}
        disabled={loading || name.trim().length < 3}
      >
        {loading ? <Spinner /> : "Draft description"}
      </Button>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {draft && (
        <div className="space-y-2 border p-4 text-sm">
          <p className="font-semibold">{draft.short}</p>
          <p className="text-muted-foreground">{draft.long}</p>
          <p className="text-xs text-muted-foreground">
            Draft only. Review and edit before using.
          </p>
        </div>
      )}
    </div>
  );
}

export default function StudioPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-16">
      <h1 className="font-serif text-5xl font-extrabold uppercase">
        Description drafter
      </h1>
      <p className="text-muted-foreground">
        Staff tool: draft product copy from facts you supply.
      </p>
      <AuthLoading>
        <Skeleton className="h-40 w-full" />
      </AuthLoading>
      <Unauthenticated>
        <SignInButton />
      </Unauthenticated>
      <Authenticated>
        <Drafter />
      </Authenticated>
    </div>
  );
}
