import fs from "node:fs";

const root = new URL("../", import.meta.url);
const read = file => fs.readFileSync(new URL(file, root), "utf8");
const html = read("index.html");
const notFound = read("404.html");
const wrangler = JSON.parse(read("wrangler.jsonc"));
const assetsIgnore = read(".assetsignore");
const files = [
  "css/tokens.css","css/base.css","css/layout.css","css/components.css","css/error.css",
  "css/sections.css","css/responsive.css","js/navigation.js","js/main.js"
];
const failures = [];



if (!/^<!doctype html>/i.test(html.trim())) failures.push("missing doctype");
if (!/^<!doctype html>/i.test(notFound.trim())) failures.push("404 missing doctype");
if (!/<main\b[^>]*id="top"/i.test(notFound)) failures.push("404 missing main#top");
if (!/noindex, nofollow/i.test(notFound)) failures.push("404 missing noindex");
if (/<script\b/i.test(notFound)) failures.push("404 should not load javascript");
if (/<style\b|\sstyle="/i.test(notFound)) failures.push("404 should not use inline styles");
if (!notFound.includes('href="/">返回首页</a>')) failures.push("404 home recovery link missing");
if (!/<main\b[^>]*id="top"/i.test(html)) failures.push("missing main#top");
if (fs.existsSync(new URL("_headers", root))) failures.push("legacy _headers should be removed");
if (wrangler.name !== "pets") failures.push("wrangler name mismatch");
if (wrangler.compatibility_date !== "2026-09-30") failures.push("wrangler compatibility date mismatch");
if (wrangler.assets?.directory !== ".") failures.push("workers assets directory mismatch");
if (wrangler.assets?.not_found_handling !== "404-page") failures.push("workers 404-page handling missing");
for (const pattern of [".github/"," .codex/","scripts/","README.md","wrangler.jsonc",".assetsignore","_headers",".git/","node_modules/",".wrangler/","package.json","package-lock.json","npm-shrinkwrap.json",".env",".env.*"]) {
  const normalized = pattern.trim();
  if (!assetsIgnore.split(/\r?\n/).some(line => line.trim() === normalized)) failures.push("assetsignore missing: " + normalized);
}
if (!/<header\b[^>]*class="nav"/i.test(html)) failures.push("missing header.nav");
if ((html.match(/<section\b/g) || []).length < 9) failures.push("expected at least 9 sections");
if (!/<section\b[^>]*id="scenes"/.test(html)) failures.push("missing #scenes section");

const ids = [...html.matchAll(/(?:^|[\s<])id="([^"]+)"/g)].map(m => m[1]);
const duplicateIds = ids.filter((id,i) => ids.indexOf(id) !== i);
duplicateIds.forEach(id => failures.push("duplicate id: " + id));

for (const m of html.matchAll(/href="#([^"]+)"/g)) {
  const id = m[1];
  if (id !== "top" && !ids.includes(id)) failures.push("missing anchor target: #" + id);
}
for (const file of files) {
  if (!fs.existsSync(new URL(file, root))) failures.push("missing file: " + file);
}
for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
  const ref = m[1];
  if (/^[a-z]+:/i.test(ref) || ref.startsWith("#")) continue;
  if (!fs.existsSync(new URL(ref, root))) failures.push("missing local resource: " + ref);
}

if (/<style\b/i.test(html)) failures.push("inline <style> remains");
if (/\sstyle="/i.test(html)) failures.push("inline style attribute remains");
if (/<script>([\s\S]*?)<\/script>/i.test(html)) failures.push("inline script remains");
if (/scroll-behavior\s*:\s*smooth/i.test(read("css/base.css"))) failures.push("global smooth scrolling remains");
if (/pageshow/.test(read("js/main.js"))) failures.push("pageshow scroll override remains");
if (!/fetchpriority="high"/.test(html)) failures.push("hero image missing fetchpriority");
if (!/aria-controls="site-menu"/.test(html)) failures.push("menu button missing aria-controls");
if (!/data-nav-id="scenes"/.test(html)) failures.push("scenes missing from navigation model");
if (!/<div class="nav-menu" id="site-menu" role="dialog" aria-modal="true" aria-labelledby="site-menu-title"/.test(html)) failures.push("mobile navigation dialog contract missing");
if (!/id="site-menu-title"/.test(html)) failures.push("mobile navigation title missing");
if (!/tabindex="-1"/.test(html)) failures.push("main focus recovery contract missing");

const sectionsCss = read("css/sections.css");
const responsiveCss = read("css/responsive.css");
const chainNodes = [...html.matchAll(/class="chain-node\b/g)].length;
const ecoNodes = [...html.matchAll(/class="eco-node\b/g)].length;
if (!/<div class="chain-layout"/.test(html)) failures.push("chain layout renderer missing");
if (chainNodes !== 5) failures.push("expected exactly 5 chain service nodes");
if (/class="node\b/.test(html)) failures.push("legacy absolute chain nodes remain");
if (/class="eco-line/.test(html)) failures.push("legacy ecosystem connector lines remain");
if (ecoNodes !== 6) failures.push("expected exactly 6 ecosystem nodes");
if (/\.chain-node\{[^}]*position\s*:\s*absolute/i.test(sectionsCss)) failures.push("chain nodes must remain in normal flow");
if (/\.eco-node\{[^}]*position\s*:\s*absolute/i.test(sectionsCss)) failures.push("ecosystem nodes must remain in normal flow");
if (!/grid-template-areas:"breeding \. sales"/.test(sectionsCss)) failures.push("desktop chain renderer areas missing");
if (!/grid-template-areas:"hub hub"/.test(responsiveCss)) failures.push("tablet chain renderer contract missing");
if (!/grid-template-areas:none/.test(responsiveCss)) failures.push("tablet/phone ecosystem flow contract missing");
if (!/@media \(min-width:761px\) and \(max-width:1100px\) and \(pointer:coarse\)/.test(responsiveCss)) failures.push("coarse tablet media wrapper missing");
if (!/@media \(min-width:761px\) and \(max-width:1100px\) and \(pointer:coarse\)\{[\s\S]*\.chain-layout\{/.test(responsiveCss)) failures.push("coarse tablet chain renderer missing");
if (!/\.hero-grid\{min-height:min\(640px,74vh\)/.test(sectionsCss)) failures.push("desktop hero height contract missing");
if (!/\.hero-image\{[^}]*aspect-ratio:4\/3/.test(sectionsCss)) failures.push("desktop hero media ratio contract missing");
if (!/\.value-grid\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/.test(sectionsCss)) failures.push("desktop value grid contract missing");
if (!/\.value\.big\{grid-column:1\/-1/.test(sectionsCss)) failures.push("desktop value feature span missing");
if (!/grid-template-areas:"brand \. food" "insurance hub hospital"/.test(sectionsCss)) failures.push("desktop ecosystem hub center contract missing");
if (!/\.contact\{background:var\(--dark\)/.test(sectionsCss)) failures.push("desktop contact treatment missing");
if (!/href="#eco">生态合作<\/a>/.test(html)) failures.push("hero ecosystem CTA target mismatch");

const navigation = read("js/navigation.js");
const main = read("js/main.js");
try { new Function(navigation); } catch (error) { failures.push("navigation.js syntax: " + error.message); }
try { new Function(main); } catch (error) { failures.push("main.js syntax: " + error.message); }


if (!/2026\.10\.01-r06\.7-minimal-404/.test(html)) failures.push("ui-version not advanced to r06.7");
if (failures.length) {
  console.error("VALIDATION FAILED");
  for (const item of failures) console.error(" - " + item);
  process.exit(1);
}
console.log("VALIDATION OK");
console.log("sections:", (html.match(/<section\b/g) || []).length);
console.log("local architecture files:", files.length);