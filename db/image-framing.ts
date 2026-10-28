import { z } from "zod";
export const frameSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  zoom: z.number().min(0.1).max(3),
});
export const imageFramingSchema = z.object({
  desktop: frameSchema,
  mobile: frameSchema,
});
export type ImageFraming = z.infer<typeof imageFramingSchema>;
export function defaultImageFraming(): ImageFraming {
  return {
    desktop: { x: 50, y: 50, zoom: 1 },
    mobile: { x: 50, y: 50, zoom: 1 },
  };
}
