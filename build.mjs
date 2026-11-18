import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

// Portable mode avoids the native executable on hosts where it cannot start.
const { build, transform } = await import(process.env.ESBUILD_WASM === "1" ? "esbuild-wasm" : "esbuild");
const outputDirectory = "dist";
const scripts = ["app.js", "desktop-baseline.js", "boiler-equipment.js", "building-geometry.js", "site-access.js", "digital-twin.js", "live-twin.js", "twin-models.js", "photo-models.js", "three-twin.js", "i18n.js", "cloud-sync.js"];
const styles = ["digital-twin.css", "style.css"];
await rm(outputDirectory, { recursive: true, force: true });
await mkdir(`${outputDirectory}/assets`, { recursive: true });

await build({entryPoints:["cloud-sync-source.js"],bundle:true,minify:true,format:"iife",target:"es2020",outfile:"cloud-sync.js"});
await build({entryPoints:["three-twin.mjs"],bundle:true,minify:true,format:"iife",target:"es2020",legalComments:"eof",outfile:"three-twin.js"});
const cloudBundle = await readFile("cloud-sync.js", "utf8");
await writeFile("cloud-sync.js", cloudBundle.replace(/[ \t]+$/gm, ""), "utf8");

const assets = {};
async function emit(name, source) {
  const loader = name.endsWith(".css") ? "css" : "js";
  const { code } = await transform(source, { loader, minify: true, charset: "utf8", target: "es2020", legalComments: "eof" });
  const hash = createHash("sha256").update(code).digest("hex").slice(0, 16);
  const path = `assets/${name.replace(/\.(js|css)$/, `.${hash}.$1`)}`;
  await writeFile(`${outputDirectory}/${path}`, code);
  assets[name] = path;
}
await Promise.all([...scripts, ...styles].map(async name => emit(name, await readFile(name, "utf8"))));
// Resolve optional dependencies before hashing the loader itself.
let loader = await readFile("twin-loader.js", "utf8");
for (const [name, path] of Object.entries(assets)) loader = loader.replaceAll(`'${name}'`, `'${path}'`);
await emit("twin-loader.js", loader);
let html = await readFile("index.html", "utf8");
html = html.replace(/\b(src|href)="([^"?]+)(?:\?[^"\s]*)?"/g, (match, attr, name) => assets[name] ? `${attr}="${assets[name]}"` : match);
await writeFile(`${outputDirectory}/index.html`, html);
await writeFile(`${outputDirectory}/asset-manifest.json`, JSON.stringify(assets, null, 2));
await Promise.all(["factory_layout_data.json", "manifest.json", "favicon.svg"].map(name => copyFile(name, `${outputDirectory}/${name}`)));
