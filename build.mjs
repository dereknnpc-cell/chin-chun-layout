import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { build } from "esbuild";

const outputDirectory = "dist";
const staticFiles = [
  "index.html",
  "app.js",
  "style.css",
  "manifest.json",
  "favicon.svg",
  "i18n.js",
  "cloud-sync.js"
];

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

await build({
  entryPoints: ["cloud-sync-source.js"],
  bundle: true,
  minify: true,
  format: "iife",
  outfile: "cloud-sync.js"
});

// Some bundled dependencies contain whitespace-only template-literal lines.
// Keep the generated artifact deterministic and friendly to git diff checks.
const cloudBundle = await readFile("cloud-sync.js", "utf8");
await writeFile("cloud-sync.js", cloudBundle.replace(/[ \t]+$/gm, ""), "utf8");

await Promise.all(
  staticFiles.map((file) => copyFile(file, `${outputDirectory}/${file}`))
);
