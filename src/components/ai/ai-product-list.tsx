import { Link } from "react-router-dom";
import { formatZar } from "@/lib/format.ts";
import type { AiPicks } from "./use-ai-picks.ts";

export default function AiProductList({ picks }: { picks: AiPicks }) {
  return (
    <div className="space-y-3" role="status">
      <p className="text-sm">{picks.message}</p>
      <ul className="space-y-2">
        {picks.products.map((p) => (
          <li key={p.id}>
            <Link
              to={`/shop/${p.slug}`}
              className="flex items-center gap-3 border p-2 hover:border-primary"
            >
              <img src={p.images[0]} alt="" className="size-14 object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-serif text-lg font-semibold uppercase leading-tight">
                  {p.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatZar(p.priceZar)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
