import { useState } from "react";
import { useAction } from "convex/react";
import { SparklesIcon } from "lucide-react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { errorText } from "@/components/ai/use-ai-picks.ts";

type Props = { brand: string; model: string; fault: string };
type Result = { causes: string[]; safety: string };

export default function RepairAiTriage({ brand, model, fault }: Props) {
  const run = useAction(api.ai.shop.triageRepair);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const go = async () => {
    setLoading(true);
    setError("");
    try {
      setResult(await run({ brand, model, fault }));
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 border p-4">
      <Button
        type="button"
        variant="secondary"
        disabled={loading || fault.trim().length < 10}
        onClick={() => void go()}
      >
        {loading ? <Spinner /> : <SparklesIcon />} Suggest possible causes (AI)
      </Button>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {result && (
        <div className="space-y-2 text-sm" role="status">
          <p className="font-semibold">
            Possible causes a technician may check:
          </p>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            {result.causes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          {result.safety && (
            <p className="text-muted-foreground">{result.safety}</p>
          )}
          <p className="text-xs text-muted-foreground">
            This is not a diagnosis, quote or turnaround time.
          </p>
        </div>
      )}
    </div>
  );
}
