import { action } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import { callJson, SAFETY_RULES } from "./gateway.ts";

const catalogueValidator = v.array(
  v.object({
    id: v.string(),
    name: v.string(),
    category: v.string(),
    shortDescription: v.string(),
  }),
);

type Picks = { ids: string[]; message: string };

function toPicks(raw: unknown, validIds: Set<string>): Picks {
  const obj = typeof raw === "object" && raw !== null ? raw : {};
  const rawIds = "ids" in obj && Array.isArray(obj.ids) ? obj.ids : [];
  const ids = rawIds
    .filter((x): x is string => typeof x === "string" && validIds.has(x))
    .slice(0, 4);
  const message =
    "message" in obj && typeof obj.message === "string" ? obj.message : "";
  return { ids, message };
}

function checkInput(text: string, max: number) {
  if (text.trim().length < 3 || text.length > max) {
    throw new ConvexError({
      message: `Please enter between 3 and ${max} characters`,
      code: "BAD_REQUEST",
    });
  }
}

export const findProducts = action({
  args: { query: v.string(), catalogue: catalogueValidator },
  handler: async (_ctx, args): Promise<Picks> => {
    checkInput(args.query, 400);
    const system = `You are the HAWK audio shop assistant. Match the shopper's need to products. Reply as JSON: {"ids": string[] (max 4 product ids, best first), "message": string (1-2 sentences explaining the match)}. ${SAFETY_RULES}`;
    const raw = await callJson(
      system,
      `Catalogue: ${JSON.stringify(args.catalogue)}\nShopper: ${args.query}`,
    );
    return toPicks(raw, new Set(args.catalogue.map((p) => p.id)));
  },
});

export const suggestRentalEquipment = action({
  args: {
    eventType: v.string(),
    guests: v.string(),
    location: v.string(),
    notes: v.string(),
    catalogue: catalogueValidator,
  },
  handler: async (_ctx, args): Promise<Picks> => {
    checkInput(args.eventType + args.notes + args.location, 1500);
    const system = `You help customers describe the audio equipment they might ask to rent from HAWK. Suggest which catalogue items could suit the event. Reply as JSON: {"ids": string[] (max 4), "message": string (2-3 sentences). State that this is only a suggestion, that rental availability and pricing are not confirmed, and that HAWK will respond to the enquiry}. ${SAFETY_RULES}`;
    const user = `Catalogue: ${JSON.stringify(args.catalogue)}\nEvent: ${args.eventType}\nGuests: ${args.guests}\nLocation: ${args.location}\nNotes: ${args.notes}`;
    return toPicks(
      await callJson(system, user),
      new Set(args.catalogue.map((p) => p.id)),
    );
  },
});

export const triageRepair = action({
  args: { brand: v.string(), model: v.string(), fault: v.string() },
  handler: async (
    _ctx,
    args,
  ): Promise<{ causes: string[]; safety: string }> => {
    checkInput(args.fault, 1500);
    const system = `You help a speaker repair workshop. From the fault description, list up to 4 possible causes to be checked by a technician, and one short safety note if relevant (mains power, do not open powered units). Do not promise a diagnosis, cost or turnaround. Reply as JSON: {"causes": string[], "safety": string}.`;
    const raw = await callJson(
      system,
      `Brand: ${args.brand}\nModel: ${args.model}\nFault: ${args.fault}`,
    );
    const obj = typeof raw === "object" && raw !== null ? raw : {};
    const causes =
      "causes" in obj && Array.isArray(obj.causes)
        ? obj.causes
            .filter((c): c is string => typeof c === "string")
            .slice(0, 4)
        : [];
    const safety =
      "safety" in obj && typeof obj.safety === "string" ? obj.safety : "";
    return { causes, safety };
  },
});

export const draftDescription = action({
  args: { name: v.string(), category: v.string(), notes: v.string() },
  handler: async (ctx, args): Promise<{ short: string; long: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Sign in to draft descriptions",
        code: "UNAUTHENTICATED",
      });
    }
    checkInput(args.name, 120);
    const system = `You write product copy for HAWK, a premium pro-audio brand. Tone: confident, technical, plain. Use ONLY the facts supplied; never invent specifications, awards or certifications. Reply as JSON: {"short": string (one line), "long": string (2-3 sentences)}.`;
    const raw = await callJson(
      system,
      `Product: ${args.name}\nCategory: ${args.category}\nFacts: ${args.notes}`,
    );
    const obj = typeof raw === "object" && raw !== null ? raw : {};
    return {
      short: "short" in obj && typeof obj.short === "string" ? obj.short : "",
      long: "long" in obj && typeof obj.long === "string" ? obj.long : "",
    };
  },
});
