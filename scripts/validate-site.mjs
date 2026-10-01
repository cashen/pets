import fs from "node:fs";
import path from "node:path";
import {execFileSync} from "node:child_process";
const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const html=read("index.html");
const cssFiles=["css/tokens.css","css/base.css","css/layout.css","css/components.css","css/sections.css","css/responsive.css"];
const css=cssFiles.map(read).join("\n");
const js=read("js/main.js");
const nav=read("js/navigation.js");
const fail=[];
const ok=(condition,message)=>{if(!condition)fail.push(message)};
ok(/^<!doctype html>/i.test(html),"missing doctype");
ok(/meta name="viewport"/i.test(html),"missing viewport");
ok(/meta name="ui-version" content="2026\.10\.01-r07\.0-brochure-rebuild"/.test(html),"wrong ui version");
ok(/id="(about|position|value|ability|eco)"/g.test(html),"missing brochure sections");
for(const id of ["about","position","value","ability","eco","contact"]) ok(new RegExp('id="'+id+'"').test(html),"missing #"+id);
for(const id of ["about","position","value","ability","eco","contact"]) ok(new RegExp('href="#'+id+'"').test(html),"missing nav link #"+id);
ok(!/scroll-behavior\s*:\s*smooth/.test(css),"global smooth scrolling forbidden");
ok(!/pageshow/i.test(js),"pageshow scroll override forbidden");
ok(/role="dialog"/.test(html)&&/aria-modal="true"/.test(html),"mobile menu dialog semantics missing");
ok(/IntersectionObserver/.test(js),"active navigation observer missing");
ok(/not_found_handling/.test(read("wrangler.jsonc"))&&/404-page/.test(read("wrangler.jsonc")),"Cloudflare 404-page contract missing");
ok(/montpets\.com/.test(read("wrangler.jsonc"))&&/www\.montpets\.com/.test(read("wrangler.jsonc")),"custom domains missing");
ok(!fs.existsSync(path.join(root,"_headers")),"_headers must remain absent for this Cloudflare Pages asset setup");
try{new Function(js);new Function(nav)}catch(e){fail.push("JavaScript syntax error: "+e.message)}
try{execFileSync(process.execPath,["--version"],{stdio:"ignore"})}catch{}
if(fail.length){console.error("VALIDATION FAILED");fail.forEach(x=>console.error(" - "+x));process.exit(1)}
console.log("VALIDATION PASSED: brochure r07");
