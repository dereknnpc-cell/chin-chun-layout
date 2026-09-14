import { copyFile, mkdir, rm } from "node:fs/promises";
import { build } from "esbuild";

const outputDirectory = "dist";
const staticFiles = [
  "index.html",
  "app.js",
  "style.css",
  "manifest.json",
  "favicon.svg",
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

await Promise.all(
  staticFiles.map((file) => copyFile(file, `${outputDirectory}/${file}`))
);
