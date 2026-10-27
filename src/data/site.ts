// Central site config: edit copy, navigation and contact placeholders here.
export const ANNOUNCEMENT = "Engineered for Sound. Built for Performance.";

export const LOGO_URL =
  "https://hercules-cdn.com/file_JtzsppMCGnREfzpiDm2tmZiA";

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

export function unsplash(id: string, width = 1000): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=75`;
}

export const IMAGES = {
  hero: "1561314105-e6ac04c2984a",
  speakerA: "1608538770329-65941f62f9f8",
  speakerB: "1653579657403-25b2695601d4",
  speakerC: "1613830689755-3f89b57a96fc",
  mesh: "1485211177140-aa3b17a0c7b6",
  box: "1612022630455-ad6e37084907",
  arrays: "1763420953483-86239ad9c206",
  wall: "1769461929909-90ad81432709",
  stack: "1769461929909-90ad81432709",
  mixer: "1679931942077-0be253938a30",
  mixerB: "1600152015632-77c2aa5565d5",
  repair: "1517420704952-d9f39e95b43e",
  solder: "1562941995-17dc31eaaf6d",
} as const;

// Paste the CDN URL of the CNC footage (mp4) here after uploading it in Files & Media.
// Optional poster image shown before playback.
export const CRAFT_VIDEO = {
  src: "",
  poster: "",
} as const;
