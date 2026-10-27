import { useState } from "react";
import { axialModes } from "@/lib/audio-calc.ts";
import NumberField from "./number-field.tsx";

export default function RoomModesCalc() {
  const [dims, setDims] = useState({ Length: "8", Width: "5", Height: "3" });

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="space-y-4">
        {Object.entries(dims).map(([k, v]) => (
          <NumberField
            key={k}
            id={`room-${k}`}
            label={k}
            unit="m"
            value={v}
            onChange={(x) => setDims((p) => ({ ...p, [k]: x }))}
          />
        ))}
      </div>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Bass frequencies where the room tends to boom or go thin. Useful when
          placing subwoofers.
        </p>
        <ul className="space-y-3">
          {Object.entries(dims).map(([k, v]) => {
            const n = Number(v);
            return (
              <li key={k} className="border-l-2 border-primary bg-muted/50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                  {k}
                </p>
                <p className="font-serif text-2xl font-bold">
                  {n > 0
                    ? axialModes(n, 4)
                        .map((f) => `${Math.round(f)} Hz`)
                        .join("  /  ")
                    : "-"}
                </p>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-muted-foreground">
          First four axial modes at 20 deg C for an empty rectangular room. Real
          rooms differ.
        </p>
      </div>
    </div>
  );
}
