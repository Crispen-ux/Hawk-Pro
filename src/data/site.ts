// Central site config: edit copy, navigation and contact placeholders here.
export const ANNOUNCEMENT = "Engineered for Sound. Built for Performance.";

export const LOGO_URL = "/brand/hawk-white.png";

export const NAV_LINKS = [
  { label: "Shop", to: "/shop" },
  { label: "Speakers", to: "/shop?category=speakers" },
  { label: "Subwoofers", to: "/shop?category=subwoofers" },
  { label: "Accessories", to: "/shop?category=accessories" },
  { label: "Rentals", to: "/rentals" },
  { label: "Repairs", to: "/repairs" },
  { label: "Tools", to: "/tools" },
  { label: "Resources", to: "/resources" },
  { label: "About HAWK", to: "/about" },
] as const;

export const CONTACT_PLACEHOLDERS = {
  email: "hello@your-domain.co.za",
  phone: "+27 (0)00 000 0000",
  address: "Business address to be confirmed",
  hours: "Trading hours to be confirmed",
};

export const SOCIAL_LINKS = ["Instagram", "Facebook", "YouTube"] as const;

export { IMAGES, unsplash } from "../../db/website-assets";

// Paste the CDN URL of the CNC footage (mp4) here after uploading it in Files & Media.
// Optional poster image shown before playback.
export const CRAFT_VIDEO = {
  src: "",
  poster: "",
} as const;
