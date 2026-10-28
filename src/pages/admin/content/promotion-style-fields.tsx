import {
  defaultPromotionStyle,
  type PromotionStyle,
} from "../../../../db/website-content";
import type { Promotion } from "@/components/promotion-banner";
export default function PromotionStyleFields({
  promotion,
  onChange,
}: {
  promotion: Promotion;
  onChange: (v: PromotionStyle) => void;
}) {
  const style =
    promotion.style ?? defaultPromotionStyle(promotion.placement === "strip");
  const update = (v: Partial<PromotionStyle>) => onChange({ ...style, ...v });
  const cls = "rounded border bg-background p-2";
  return (
    <section className="space-y-4 rounded-lg border p-4">
      <h3 className="font-semibold">Banner appearance</h3>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-2 text-sm">
          Text size
          <select
            className={cls}
            value={style.textSize}
            onChange={(e) =>
              update({ textSize: e.target.value as PromotionStyle["textSize"] })
            }
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          Text alignment
          <select
            className={cls}
            value={style.alignment}
            onChange={(e) =>
              update({
                alignment: e.target.value as PromotionStyle["alignment"],
              })
            }
          >
            <option value="left">Left</option>
            <option value="center">Centre</option>
            <option value="right">Right</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          Button style
          <select
            className={cls}
            value={style.buttonStyle}
            onChange={(e) =>
              update({
                buttonStyle: e.target.value as PromotionStyle["buttonStyle"],
              })
            }
          >
            <option value="solid">Solid</option>
            <option value="outline">Outlined</option>
          </select>
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {(
          [
            ["background", "Background colour"],
            ["text", "Text colour"],
            ["buttonBackground", "Button / outline colour"],
            ["buttonText", "Button text colour (solid)"],
          ] as const
        ).map(([key, label]) => (
          <label
            key={key}
            className="flex items-center justify-between gap-3 rounded border p-3 text-sm"
          >
            {label}
            <input
              className="h-10 w-14 cursor-pointer"
              type="color"
              value={style[key]}
              onChange={(e) => update({ [key]: e.target.value })}
            />
          </label>
        ))}
      </div>
    </section>
  );
}
