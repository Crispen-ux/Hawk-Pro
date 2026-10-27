import { useState } from "react";
import { PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group.tsx";
import { combinedImpedance } from "@/lib/audio-calc.ts";
import ResultBox from "./result-box.tsx";

type Mode = "series" | "parallel";

export default function ImpedanceCalc() {
  const [values, setValues] = useState<string[]>(["8", "8"]);
  const [mode, setMode] = useState<Mode>("parallel");

  const total = combinedImpedance(values.map(Number), mode);
  const update = (i: number, v: string) =>
    setValues((prev) => prev.map((x, j) => (j === i ? v : x)));

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="space-y-4">
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(v) => v && setMode(v as Mode)}
          aria-label="Wiring"
        >
          <ToggleGroupItem value="parallel">Parallel</ToggleGroupItem>
          <ToggleGroupItem value="series">Series</ToggleGroupItem>
        </ToggleGroup>
        <ul className="space-y-2">
          {values.map((v, i) => (
            <li key={i} className="flex items-center gap-2">
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                value={v}
                aria-label={`Speaker ${i + 1} impedance in ohms`}
                onChange={(e) => update(i, e.target.value)}
              />
              <span className="text-sm text-muted-foreground">ohm</span>
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Remove speaker ${i + 1}`}
                disabled={values.length <= 2}
                onClick={() => setValues((p) => p.filter((_, j) => j !== i))}
              >
                <XIcon />
              </Button>
            </li>
          ))}
        </ul>
        <Button
          variant="secondary"
          disabled={values.length >= 8}
          onClick={() => setValues((p) => [...p, "8"])}
        >
          <PlusIcon /> Add speaker
        </Button>
      </div>
      <ResultBox
        label="Total load"
        value={Number.isFinite(total) ? `${total.toFixed(2)} ohm` : "-"}
        note="Always check your amplifier's minimum load rating before connecting."
      />
    </div>
  );
}
