import { useState } from "react";
import { SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import AiProductList from "@/components/ai/ai-product-list.tsx";
import { useRentalSuggest } from "@/components/ai/use-ai-picks.ts";

export default function RentalAiHelper() {
  const [eventType, setEventType] = useState("");
  const [guests, setGuests] = useState("");
  const [notes, setNotes] = useState("");
  const { suggest, loading, error, result } = useRentalSuggest();

  return (
    <div className="space-y-4 border p-5">
      <h3 className="flex items-center gap-2 font-serif text-2xl font-bold uppercase">
        <SparklesIcon className="size-5 text-primary" /> Not sure what to ask
        for?
      </h3>
      <p className="text-sm text-muted-foreground">
        Describe your event and AI will suggest equipment to include in your
        enquiry.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ai-event">Event type</Label>
          <Input
            id="ai-event"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            placeholder="Wedding, band night..."
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ai-guests">Approx. guests</Label>
          <Input
            id="ai-guests"
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            placeholder="150"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ai-notes">Venue and notes</Label>
        <Textarea
          id="ai-notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Indoor hall, speeches and music"
        />
      </div>
      <Button
        type="button"
        disabled={loading || eventType.trim().length < 3}
        onClick={() => void suggest({ eventType, guests, location: "", notes })}
      >
        {loading ? <Spinner /> : "Suggest equipment"}
      </Button>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {result && <AiProductList picks={result} />}
    </div>
  );
}
