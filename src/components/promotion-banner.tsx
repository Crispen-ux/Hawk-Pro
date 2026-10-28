import { FramedImage } from "./content-image";
import { defaultImageFraming } from "../../db/image-framing";
import { Link } from "react-router-dom";
import {
  defaultPromotionStyle,
  type WebsiteContent,
} from "../../db/website-content";
export type Promotion = WebsiteContent["promotions"][number];
export default function PromotionBanner({
  promotion: p,
  preview = false,
  mobile,
}: {
  promotion: Promotion;
  preview?: boolean;
  mobile?: boolean;
}) {
  const strip = p.placement === "strip";
  const style = p.style ?? defaultPromotionStyle(strip);
  const buttonStyle = {
    backgroundColor:
      style.buttonStyle === "solid" ? style.buttonBackground : "transparent",
    color:
      style.buttonStyle === "solid" ? style.buttonText : style.buttonBackground,
    border: "2px solid " + style.buttonBackground,
  };
  const fontSize = strip
    ? { small: 14, medium: 18, large: 24 }[style.textSize]
    : { small: 24, medium: 36, large: 48 }[style.textSize];
  const button = p.button ? (
    preview ? (
      <span
        style={buttonStyle}
        className={
          strip
            ? "inline-flex rounded border border-current px-4 py-2 text-sm font-semibold"
            : "inline-flex rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
        }
      >
        {p.button}
      </span>
    ) : (
      <Link
        style={buttonStyle}
        className={
          strip
            ? "inline-flex rounded border border-current px-4 py-2 text-sm font-semibold"
            : "inline-flex rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
        }
        to={p.href}
      >
        {p.button}
      </Link>
    )
  ) : null;
  return (
    <div className="@container w-full min-w-0">
      <aside
        style={{
          backgroundColor: style.background,
          color: style.text,
          textAlign: style.alignment,
        }}
        aria-label="Promotion"
        className={
          strip
            ? "flex flex-col items-center justify-center gap-3 bg-primary px-5 py-4 text-primary-foreground @2xl:flex-row @2xl:gap-6"
            : "overflow-hidden rounded-lg border bg-card text-card-foreground " +
              (p.image ? "grid @2xl:grid-cols-2" : "")
        }
      >
        {!strip && p.image ? (
          <FramedImage
            image={{
              src: p.image,
              alt: "",
              overlay: 0,
              ...(p.imageFraming ?? defaultImageFraming()),
            }}
            fit="contain"
            mobile={mobile}
            className="aspect-video w-full self-center"
          />
        ) : null}
        <div
          style={{ textAlign: style.alignment }}
          className={
            strip
              ? "min-w-0 space-y-1"
              : "min-w-0 self-center space-y-4 p-6 @2xl:p-10"
          }
        >
          <p
            style={{ fontSize, lineHeight: 1.1 }}
            className={
              strip
                ? "break-words font-semibold"
                : "break-words font-serif text-3xl font-extrabold uppercase leading-tight @2xl:text-4xl"
            }
          >
            {p.title}
          </p>
          {p.body ? (
            <p
              style={{
                color: style.text,
                fontSize: { small: 14, medium: 16, large: 18 }[style.textSize],
                opacity: 0.85,
              }}
              className={
                strip
                  ? "whitespace-pre-line break-words text-sm"
                  : "whitespace-pre-line break-words text-base text-muted-foreground"
              }
            >
              {p.body}
            </p>
          ) : null}
          {!strip ? button : null}
        </div>
        {strip ? button : null}
      </aside>
    </div>
  );
}
