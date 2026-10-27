// Verify source and emitted JavaScript; Vercel packages TypeScript as .js files.
import {
  readdir,
  readFile,
  writeFile,
  mkdir,
  mkdtemp,
  rm,
} from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import ts from "typescript";
const root = fileURLToPath(new URL("../", import.meta.url));
const sourceFiles = [],
  routes = [];
async function collect(directory) {
  for (const entry of await readdir(path.join(root, directory), {
    withFileTypes: true,
  })) {
    const relative = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "migrations") await collect(relative);
    } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")) {
      sourceFiles.push(relative);
      if (directory.startsWith("api") && !relative.includes("_lib"))
        routes.push(relative);
    }
  }
}
await collect("api");
await collect("db");
for (const file of routes) {
  const source = await import(pathToFileURL(path.join(root, file)).href);
  if (typeof source.default !== "function")
    throw new Error("Missing API handler: " + file);
}
const config = ts.readConfigFile(
  path.join(root, "tsconfig.json"),
  ts.sys.readFile,
);
if (config.error)
  throw new Error(
    ts.flattenDiagnosticMessageText(config.error.messageText, "\n"),
  );
const converted = ts.convertCompilerOptionsFromJson(
  config.config.compilerOptions ?? {},
  root,
);
if (converted.errors.length)
  throw new Error("Invalid root server compiler options");
const options = {
  target: ts.ScriptTarget.ES2021,
  module: ts.ModuleKind.NodeNext,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
  ...converted.options,
  noEmit: false,
  sourceMap: false,
  declaration: false,
};
const base = path.resolve(root, "node_modules/.tmp");
await mkdir(base, { recursive: true });
const output = await mkdtemp(path.join(base, "server-check-"));
if (!path.resolve(output).startsWith(base + path.sep))
  throw new Error("Invalid test output location");
try {
  await writeFile(
    path.join(output, "package.json"),
    JSON.stringify({ type: "module" }),
  );
  for (const file of sourceFiles) {
    const source = await readFile(path.join(root, file), "utf8");
    const compiled = ts.transpileModule(source, {
      fileName: path.join(root, file),
      compilerOptions: options,
    }).outputText;
    const target = path.join(output, file.replace(/\.ts$/, ".js"));
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, compiled);
  }
  for (const file of routes) {
    const module = await import(
      pathToFileURL(path.join(output, file.replace(/\.ts$/, ".js"))).href
    );
    if (typeof module.default !== "function")
      throw new Error("Missing compiled API handler: " + file);
    if (file === path.join("api", "account.ts")) {
      let status = 200;
      let body = "";
      const response = {
        get statusCode() {
          return status;
        },
        set statusCode(v) {
          status = v;
        },
        writableEnded: false,
        setHeader() {},
        end(value) {
          body = value;
        },
      };
      await module.default({ method: "GET", headers: {} }, response);
      if (status !== 401 || JSON.parse(body).error !== "Sign in required")
        throw new Error("Compiled signed-out account route did not return 401");
    }
    console.log("Loaded compiled " + file);
  }
  console.log(
    "All source and compiled server entry points loaded successfully.",
  );
} finally {
  await rm(output, { recursive: true, force: true });
}
