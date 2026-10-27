// Run with Node 24, matching package.json engines. No requests or database writes.
import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const api = new URL("../api/", import.meta.url);
async function check(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const url = new URL(
      entry.name + (entry.isDirectory() ? "/" : ""),
      directory,
    );
    if (entry.isDirectory()) {
      if (entry.name !== "_lib") await check(url);
    } else if (entry.name.endsWith(".ts")) {
      const module = await import(url.href);
      if (typeof module.default !== "function")
        throw new Error("No API handler: " + fileURLToPath(url));
      console.log(
        "Loaded " + fileURLToPath(url).split(/[/\\]/).slice(-2).join("/"),
      );
    }
  }
}
await check(api);
console.log("All server entry points loaded successfully.");
