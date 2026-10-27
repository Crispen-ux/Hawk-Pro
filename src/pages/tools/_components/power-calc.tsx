import { useState } from "react";
import { powerNeededW, splAtDistance } from "@/lib/audio-calc.ts";
import NumberField from "./number-field.tsx";
import ResultBox from "./result-box.tsx";

// Both tools share the same inputs, so they live together.
export default function PowerCalc() {
  const [sens, setSens] = useState("95");
  const [dist, setDist] = useState("10");
  const [target, setTarget] = useState("100");
  const [headroom, setHeadroom] = useState("6");
  const [power, setPower] = useState("500");

  const s = Number(sens),
    d = Number(dist),
    t = Number(target),
    h = Number(headroom),
    p = Number(power);
  const valid = s > 0 && d > 0 && t > 0 && h >= 0;
  const needed = valid ? powerNeededW(s, t, d, h) : NaN;
  const maxSpl = s > 0 && d > 0 && p > 0 ? splAtDistance(s, p, d) : NaN;

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="space-y-4">
        <NumberField
          id="sens"
          label="Speaker sensitivity"
          unit="dB"
          value={sens}
          onChange={setSens}
          hint="1 W at 1 m. Use the figure from the speaker's data sheet."
        />
        <NumberField
          id="dist"
          label="Listening distance"
          unit="m"
          value={dist}
          onChange={setDist}
        />
        <NumberField
          id="target"
          label="Target loudness"
          unit="dB SPL"
          value={target}
          onChange={setTarget}
          hint="Around 85 dB is loud speech or background music. 100+ dB is a live event."
        />
        <NumberField
          id="headroom"
          label="Headroom for peaks"
          unit="dB"
          value={headroom}
          onChange={setHeadroom}
          hint="3 to 10 dB is common."
        />
        <NumberField
          id="power"
          label="Power you have available"
          unit="W"
          value={power}
          onChange={setPower}
        />
      </div>
      <div className="space-y-4">
        <ResultBox
          label="Power needed per speaker"
          value={Number.isFinite(needed) ? `${Math.ceil(needed)} W` : "-"}
          note="Free-field estimate. Rooms, extra speakers and the speaker's own limits change real results."
        />
        <ResultBox
          label={`Loudness at ${dist || "?"} m with ${power || "?"} W`}
          value={Number.isFinite(maxSpl) ? `${maxSpl.toFixed(1)} dB` : "-"}
        />
      </div>
    </div>
  );
}
