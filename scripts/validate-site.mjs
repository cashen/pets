import fs from "node:fs";
import path from "node:path";

const root = new URL("../", import.meta.url);
const read = file => fs.readFileSync(new URL(file, root), "utf8");
const html = read("index.html");
const files = [
  "css/tokens.css","css/base.css","css/layout.css","css/components.css",
  "css/sections.css","css/responsive.css","js/navigation.js","js/main.js"
];
const failures = [];

if (!/^<!doctype html>/i.test(html.trim())) failures.push("missing doctype");
if (!/<main\b[^>]*id="top"/i.test(html)) failures.push("missing main#top");
if (!/<header\b[^>]*class="nav"/i.test(html)) failures.push("missing header.nav");
if ((html.match(/<section\b/g) || []).length < 9) failures.push("expected at least 9 sections");
if (!/<section\b[^>]*id="scenes"/.test(html)) failures.push("missing #scenes section");

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
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
if (/<script>([\s\S]*?)<\/script>/i.test(html)) failures.push("inline script remains");
if (/\sstyle="/i.test(html)) failures.push("inline style attribute remains");
if (!/aria-controls="site-menu"/.test(html)) failures.push("menu button missing aria-controls");
if (!/data-nav-id="scenes"/.test(html)) failures.push("scenes missing from navigation model");

const navigation = read("js/navigation.js");
const main = read("js/main.js");
try { new Function(navigation.replace(/^\s*\(\(\) => \{[\s\S]*?\}\)\(\);\s*$/,"")) } catch {}
try { new Function(main) } catch (error) { failures.push("main.js syntax: " + error.message); }

if (failures.length) {
  console.error("VALIDATION FAILED");
  for (const item of failures) console.error(" - " + item);
  process.exit(1);
}
console.log("VALIDATION OK");
console.log("sections:", (html.match(/<section\b/g) || []).length);
console.log("local architecture files:", files.length);
