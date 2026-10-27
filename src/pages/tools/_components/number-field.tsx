import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit: string;
  hint?: string;
};

export default function NumberField({
  id,
  label,
  value,
  onChange,
  unit,
  hint,
}: Props) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className="w-14 shrink-0 text-sm text-muted-foreground">
          {unit}
        </span>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
