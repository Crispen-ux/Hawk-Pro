export default function ResultBox({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div
      className="space-y-1 border-l-2 border-primary bg-muted/50 p-4"
      role="status"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
        {label}
      </p>
      <p className="font-serif text-5xl font-extrabold uppercase leading-none">
        {value}
      </p>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}
