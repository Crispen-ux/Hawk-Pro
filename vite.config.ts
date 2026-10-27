import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import hercules from "@usehercules/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, loadEnv, type Plugin } from "vite";

// Dev-only mirror of the Vercel `api/` directory: the same handlers run as
// Connect middleware so `pnpm dev` and the deployed functions never diverge.
type ApiRequest = IncomingMessage & {
  body?: unknown;
  query?: Record<string, string | string[]>;
};
type Handler = (req: ApiRequest, res: ServerResponse) => void | Promise<void>;

const API_ROUTES: { pattern: RegExp; file: string; params?: string[] }[] = [
  { pattern: /^\/api\/delivery$/, file: "delivery.ts" },
  { pattern: /^\/api\/checkout$/, file: "checkout.ts" },
  { pattern: /^\/api\/payflex$/, file: "payflex.ts" },
  { pattern: /^\/api\/account$/, file: "account.ts" },
  { pattern: /^\/api\/commerce$/, file: "commerce.ts" },
  { pattern: /^\/api\/upload$/, file: "upload.ts" },
  { pattern: /^\/api\/products$/, file: "products.ts" },
  {
    pattern: /^\/api\/products\/([^/]+)$/,
    file: "products/[id].ts",
    params: ["id"],
  },
  { pattern: /^\/api\/enquiries$/, file: "enquiries.ts" },
  {
    pattern: /^\/api\/enquiries\/([^/]+)$/,
    file: "enquiries/[id].ts",
    params: ["id"],
  },
  { pattern: /^\/api\/settings$/, file: "settings.ts" },
  { pattern: /^\/api\/auth$/, file: "auth.ts" },
];

const HANDLER_ENV_KEYS = [
  "POSTGRES_URL",
  "DATABASE_URL",
  "ADMIN_PASSCODE",
  "SESSION_SECRET",
  "EMAIL_API_URL",
  "EMAIL_API_TOKEN",
  "EMAIL_FROM",
  "EMAIL_LOGO_URL",
  "EMAIL_REPLY_TO",
  "EMAIL_TRANSPORT",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "SMTP_TLS_SERVERNAME",
  "BLOB_READ_WRITE_TOKEN",
  "PAYFLEX_CLIENT_ID",
  "PAYFLEX_CLIENT_SECRET",
  "PAYFLEX_ENVIRONMENT",
  "SITE_URL",
] as const;

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const type = req.headers["content-type"] ?? "";
  if (!type.includes("application/json")) return undefined;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  return raw ? JSON.parse(raw) : undefined;
}

function apiDevPlugin(env: Record<string, string>): Plugin {
  const apiRoot = path.resolve(import.meta.dirname, "api");
  return {
    name: "hawk-api-dev",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? "";
        if (!url.startsWith("/api/")) return next();

        const [pathname, search = ""] = url.split("?");
        const route = API_ROUTES.find((r) => r.pattern.test(pathname));
        if (!route) return next();

        try {
          for (const key of HANDLER_ENV_KEYS) {
            if (env[key] && !process.env[key]) process.env[key] = env[key];
          }

          const match = pathname.match(route.pattern);
          const query: Record<string, string | string[]> = Object.fromEntries(
            new URLSearchParams(search),
          );
          if (match && route.params) {
            route.params.forEach((name, i) => {
              query[name] = decodeURIComponent(match[i + 1] ?? "");
            });
          }

          const apiReq = req as ApiRequest;
          apiReq.query = query;
          apiReq.body = await readJsonBody(req);

          const mod = await server.ssrLoadModule(
            path.join(apiRoot, route.file),
          );
          await (mod.default as Handler)(apiReq, res);
          if (!res.writableEnded) next();
        } catch (error) {
          console.error(error);
          if (!res.writableEnded) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify({ error: "Server error" }));
          }
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // The API reads POSTGRES_URL / ADMIN_PASSCODE from process.env, which Vite
  // does not populate from .env files on its own.
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: "0.0.0.0",
      port: 5173,
      allowedHosts: true,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), tailwindcss(), hercules(), apiDevPlugin(env)],
    resolve: {
      alias: {
        "@/convex": path.resolve(import.meta.dirname, "./convex"),
        "@": path.resolve(import.meta.dirname, "./src"),
      },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
    },
    build: {
      chunkSizeWarningLimit: 1000,
    },
  };
});
