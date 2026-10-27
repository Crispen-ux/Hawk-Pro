import { ConvexError } from "convex/values";

const GATEWAY_URL = "https://ai-gateway.hercules.app/v1/chat/completions";
const MODEL = "openai/gpt-6-luna";

// Calls the Hercules AI Gateway and parses a JSON object reply.
export async function callJson(system: string, user: string): Promise<unknown> {
  const apiKey = process.env.HERCULES_API_KEY;
  if (!apiKey) {
    throw new ConvexError({
      message: "AI is not configured",
      code: "EXTERNAL_SERVICE_ERROR",
    });
  }
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    throw new ConvexError({
      message: "The AI service is unavailable right now",
      code: "EXTERNAL_SERVICE_ERROR",
    });
  }
  const data: unknown = await res.json();
  const content = extractContent(data);
  try {
    return JSON.parse(content);
  } catch {
    throw new ConvexError({
      message: "The AI returned an unreadable answer",
      code: "EXTERNAL_SERVICE_ERROR",
    });
  }
}

function extractContent(data: unknown): string {
  if (
    typeof data === "object" &&
    data !== null &&
    "choices" in data &&
    Array.isArray(data.choices)
  ) {
    const first: unknown = data.choices[0];
    if (typeof first === "object" && first !== null && "message" in first) {
      const msg = first.message;
      if (
        typeof msg === "object" &&
        msg !== null &&
        "content" in msg &&
        typeof msg.content === "string"
      ) {
        return msg.content;
      }
    }
  }
  return "";
}

export const SAFETY_RULES = `Rules: Only recommend products from the provided catalogue, using their exact ids. Never invent specifications, prices, certifications, awards, stock levels or availability. Prices in the catalogue are placeholders. If nothing fits, say so honestly. Keep answers short and plain.`;
