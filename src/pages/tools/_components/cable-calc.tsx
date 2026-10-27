import { useState } from "react";
import { Label } from "@/components/ui/label.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { cableLoss } from "@/lib/audio-calc.ts";
import NumberField from "./number-field.tsx";
import ResultBox from "./result-box.tsx";

const SIZES = ["1.5", "2.5", "4", "6"];

export default function CableCalc() {
  const [len, setLen] = useState("30");
  const [area, setArea] = useState("2.5");
  const [load, setLoad] = useState("8");
  const l = Number(len),
    a = Number(area),
    z = Number(load);
  const res = l > 0 && z > 0 ? cableLoss(l, a, z) : null;

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="space-y-4">
        <NumberField
          id="cable-l"
          label="Cable run length"
          unit="m"
          value={len}
          onChange={setLen}
        />
        <div className="space-y-1.5">
          <Label htmlFor="cable-a">Copper conductor size</Label>
          <Select value={area} onValueChange={setArea}>
            <SelectTrigger id="cable-a" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SIZES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s} mm&sup2;
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <NumberField
          id="cable-z"
          label="Speaker load"
          unit="ohm"
          value={load}
          onChange={setLoad}
        />
      </div>
      <div className="space-y-4">
        <ResultBox
          label="Power lost in the cable"
          value={res ? `${res.powerLossPct.toFixed(1)}%` : "-"}
          note="Lower is better. Keep long runs on thicker cable."
        />
        <ResultBox
          label="Level drop at the speaker"
          value={res ? `${res.levelDropDb.toFixed(2)} dB` : "-"}
          note="Assumes solid copper and a purely resistive load. Real speakers vary."
        />
      </div>
    </div>
  );
}
