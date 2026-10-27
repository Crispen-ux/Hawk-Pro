import { useState } from "react";
import { delayMs } from "@/lib/audio-calc.ts";
import NumberField from "./number-field.tsx";
import ResultBox from "./result-box.tsx";

export default function DelayCalc() {
  const [dist, setDist] = useState("20");
  const [temp, setTemp] = useState("20");
  const d = Number(dist),
    t = Number(temp);
  const ms = d > 0 && Number.isFinite(t) ? delayMs(d, t) : NaN;

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="space-y-4">
        <NumberField
          id="delay-d"
          label="Distance between speaker stacks"
          unit="m"
          value={dist}
          onChange={setDist}
          hint="From the main speakers to the delay (fill) speakers."
        />
        <NumberField
          id="delay-t"
          label="Air temperature"
          unit="deg C"
          value={temp}
          onChange={setTemp}
        />
      </div>
      <ResultBox
        label="Delay to set"
        value={Number.isFinite(ms) ? `${ms.toFixed(1)} ms` : "-"}
        note="Many engineers add a few extra milliseconds so the main speakers still arrive first. Fine-tune by ear."
      />
    </div>
  );
}
