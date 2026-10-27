import { useState, type FormEvent } from "react";
import { SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet.tsx";
import AiProductList from "./ai-product-list.tsx";
import { useFindProducts } from "./use-ai-picks.ts";

const EXAMPLES = [
  "Speakers for a small bar",
  "Something with deep bass for a party",
  "Gear for a live band",
];

// Floating AI product finder available on every page.
export default function SoundAdvisor() {
  const [query, setQuery] = useState("");
  const { search, loading, error, result } = useFindProducts();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 3) void search(query);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="fixed bottom-4 right-4 z-40 h-12 gap-2 px-3.5 pb-[env(safe-area-inset-bottom)] sm:bottom-5 sm:right-5 sm:px-5 text-xs font-semibold uppercase tracking-widest shadow-xl">
          <SparklesIcon />{" "}
          <span className="hidden sm:inline">Sound advisor</span>
          <span className="sr-only sm:hidden">Sound advisor</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-4 sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl uppercase">
            Find your sound
          </SheetTitle>
          <SheetDescription>
            Describe your room, event or need. AI suggests products from the
            HAWK range.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
          <form onSubmit={submit} className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. speakers for a 100 person hall"
              aria-label="Describe what you need"
              maxLength={400}
            />
            <Button type="submit" disabled={loading}>
              {loading ? <Spinner /> : "Ask"}
            </Button>
          </form>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <Button
                key={ex}
                size="sm"
                variant="secondary"
                onClick={() => {
                  setQuery(ex);
                  void search(ex);
                }}
              >
                {ex}
              </Button>
            ))}
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {result && <AiProductList picks={result} />}
          <p className="mt-auto pb-4 text-xs text-muted-foreground">
            AI suggestions only. Availability and specifications are not
            confirmed.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
