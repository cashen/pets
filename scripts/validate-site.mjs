import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const html=read("index.html");
const notFound=read("404.html");
const wrangler=JSON.parse(read("wrangler.jsonc"));
const cssFiles=["css/tokens.css","css/base.css","css/layout.css","css/components.css","css/sections.css","css/responsive.css","css/error.css"];
const css=cssFiles.map(read).join("\n");
const js=read("js/main.js");
const nav=read("js/navigation.js");
const brand=read("assets/brand/brand.svg");
const mark=read("assets/brand/logo-mark.svg");
const responsive=read("css/responsive.css");
const failures=[];
const ok=(condition,message)=>{if(!condition)failures.push(message)};
const contrastRatio=(a,b)=>{const c=h=>{const v=parseInt(h,16)/255;return v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4};const rgb=h=>h.replace("#","").match(/../g).map(c);const x=rgb(a),y=rgb(b);const l1=.2126*x[0]+.7152*x[1]+.0722*x[2],l2=.2126*y[0]+.7152*y[1]+.0722*y[2];return (Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05)};

const tokens=read("css/tokens.css");
ok(tokens.includes("--brand-text:#A84300"),"readable brand text token missing");
ok(tokens.includes("--brand-deep:#9E3B00"),"deep brand token missing");
ok(tokens.includes("--on-brand:#2B1A12"),"on-brand text token missing");
ok(contrastRatio("#A84300","#FFFFFF")>=4.5,"brand text contrast below 4.5:1");
ok(contrastRatio("#9E3B00","#FFFFFF")>=4.5,"deep brand contrast below 4.5:1");
ok(contrastRatio("#2B1A12","#F36B12")>=4.5,"on-brand contrast below 4.5:1");
ok(contrastRatio("#6A5B50","#FFFFFF")>=4.5,"hero kicker contrast below 4.5:1");
ok(contrastRatio("#756458","#FFFFFF")>=4.5,"meta text contrast below 4.5:1");
ok(read("css/layout.css").includes(".wrap{width:min(var(--wrap),calc(100% - (var(--pad) * 2) - var(--safe-left) - var(--safe-right)))"),"desktop safe-side shell contract missing");
ok(read("css/sections.css").includes("padding-top:calc(var(--header-h) + var(--safe-top))"),"hero safe-top contract missing");
ok(read("css/base.css").includes("top:max(10px,calc(var(--safe-top) + 10px));left:max(10px,calc(var(--safe-left) + 10px));"),"skip-link safe-area contract missing");
ok(read("css/responsive.css").includes("@media(orientation:landscape) and (max-width:1100px) and (max-height:480px){.eco-board{"),"short-landscape Eco contract missing");

const scanCssStructure=(source)=>{
  let brace=0,paren=0,bracket=0,string=null,escaped=false,comment=false,error="";
  for(let i=0;i<source.length;i++){
    const c=source[i],next=source[i+1];
    if(comment){if(c==="*"&&next==="/"){comment=false;i++;}continue;}
    if(!string&&c==="/"&&next==="*"){comment=true;i++;continue;}
    if(string){if(escaped){escaped=false;continue;}if(c==="\\"){escaped=true;continue;}if(c===string)string=null;continue;}
    if(c==='"'||c==="'"){string=c;continue;}
    if(c==="{")brace++;else if(c==="}"){brace--;if(brace<0&&!error)error="unexpected } at offset "+i;}
    else if(c==="(")paren++;else if(c===")"){paren--;if(paren<0&&!error)error="unexpected ) at offset "+i;}
    else if(c==="[")bracket++;else if(c==="]"){bracket--;if(bracket<0&&!error)error="unexpected ] at offset "+i;}
  }
  if(comment&&!error)error="unterminated comment";if(string&&!error)error="unterminated string";
  if((brace||paren||bracket)&&!error)error="unbalanced delimiters: {}="+brace+" ()="+paren+" []="+bracket;
  return {ok:!error&&brace===0&&paren===0&&bracket===0,error,brace,paren,bracket};
};
for(const file of cssFiles){const result=scanCssStructure(read(file));ok(result.ok,"CSS structure error in "+file+": "+(result.error||"unknown"));}

const cssContracts={"css/sections.css":[".hero{",".about-story{",".feature-grid{",".value-grid{",".ability-stack{",".eco-board{",".eco-center{",".eco-node{",".contact{"],"css/components.css":[".site-header{",".nav-menu{",".nav-menu-list{"],"css/layout.css":[".wrap{",".section{",".section-head{",".lead{"]};
for(const [file,selectors] of Object.entries(cssContracts)){const source=read(file);for(const selector of selectors)ok(source.includes(selector),"CSS selector contract missing in "+file+": "+selector);}
const ecoResponsiveContract=[
  {name:"tablet",pattern:/@media\(max-width:1100px\)/,areas:'grid-template-areas:"center center" "brand food" "insurance hospital" "park salon"',center:"width:min(220px,100%);aspect-ratio:1;min-height:0;border-radius:50%"},
  {name:"mobile",pattern:/@media\(max-width:760px\)/,areas:'grid-template-areas:"center" "brand" "food" "insurance" "hospital" "park" "salon"',center:"width:180px;aspect-ratio:1;min-height:0;border-radius:50%"},
  {name:"mobile landscape",pattern:/@media\(orientation:landscape\) and \(max-width:760px\)/,areas:'grid-template-areas:"center center" "brand food" "insurance hospital" "park salon"',center:"width:160px"}
];
for(const contract of ecoResponsiveContract){
  ok(contract.pattern.test(responsive),"eco responsive breakpoint missing: "+contract.name);
  ok(responsive.includes(contract.areas),"eco named-area contract missing: "+contract.name);
  ok(responsive.includes(contract.center),"eco center geometry contract missing: "+contract.name);
}
ok(!responsive.includes("grid-template-areas:none"),"responsive grid must not cancel Eco named areas without redefining them");

const uiSystemContract={companyImage:"assets/images/company/company-facade.webp",skipLink:'class="skip-link" href="#top"',menuLock:"html.menu-open,body.menu-open{overflow:hidden;overscroll-behavior:none}",shortLandscape:/@media\(orientation:landscape\) and \(max-width:1100px\) and \(max-height:480px\)/};
ok(html.includes(uiSystemContract.companyImage),"company profile image contract missing");
ok((read("css/tokens.css").match(/--safe-top:env\(safe-area-inset-top,0px\)/g)||[]).length===1,"safe-area top token duplicated");
ok((read("css/tokens.css").match(/--safe-right:env\(safe-area-inset-right,0px\)/g)||[]).length===1,"safe-area right token duplicated");
ok((read("css/tokens.css").match(/--safe-bottom:env\(safe-area-inset-bottom,0px\)/g)||[]).length===1,"safe-area bottom token duplicated");
ok((read("css/tokens.css").match(/--safe-left:env\(safe-area-inset-left,0px\)/g)||[]).length===1,"safe-area left token duplicated");
ok((read("css/base.css").match(/html\.menu-open,body\.menu-open\{overflow:hidden;overscroll-behavior:none\}/g)||[]).length===1,"menu scroll-lock rule duplicated");
ok(html.includes('company-facade.webp?v=20261002-r092" alt="产业园建筑外观" width="400" height="206"'),"company image dimensions contract missing");
ok(html.includes(uiSystemContract.skipLink),"skip link contract missing");
ok(read("css/base.css").includes(uiSystemContract.menuLock),"menu scroll-lock contract missing");
ok(uiSystemContract.shortLandscape.test(responsive),"short landscape contract missing");
for(const token of ["--safe-top:env(safe-area-inset-top,0px)","--safe-right:env(safe-area-inset-right,0px)","--safe-bottom:env(safe-area-inset-bottom,0px)","--safe-left:env(safe-area-inset-left,0px)"]) ok(read("css/tokens.css").includes(token),"safe-area token missing: "+token);
ok(read("css/components.css").includes("padding-top:var(--safe-top)"),"header safe-area contract missing");
const responsiveContracts=[{name:"desktop/tablet",pattern:/@media\(max-width:1100px\)/,selectors:[".hero-grid{",".feature-grid{",".eco-board{",".eco-center{",".nav-menu{"]},{name:"tablet",pattern:/@media\(min-width:761px\) and \(max-width:1100px\)/,selectors:[".hero-grid{",".section-head{",".eco-center{",".nav-menu{"]},{name:"mobile",pattern:/@media\(max-width:760px\)/,selectors:[".hero-grid{",".eco-board{",".eco-center{",".nav-menu{"]},{name:"mobile landscape",pattern:/@media\(orientation:landscape\) and \(max-width:760px\)/,selectors:[".hero-grid{",".hero-lead{",".hero-image-frame img{"]}];
for(const contract of responsiveContracts){ok(contract.pattern.test(responsive),"responsive breakpoint contract missing: "+contract.name);for(const selector of contract.selectors)ok(responsive.includes(selector),"responsive selector contract missing ("+contract.name+"): "+selector);}



const requiredIds=["about","position","value","ability","eco","contact"];
const navExpected=["about","position","value","ability","eco","contact"];
const domains=(wrangler.routes||[]).filter(r=>r?.custom_domain===true).map(r=>r.pattern).filter(Boolean);

ok(/^<!doctype html>/i.test(html.trim()),"missing doctype");
ok(/^<!doctype html>/i.test(notFound.trim()),"404 missing doctype");
ok(/meta name="viewport"/i.test(html),"missing viewport");
ok(/meta name="ui-version" content="2026\.10\.02-r09\.2-readability-shell-hardening"/.test(html),"wrong ui version");
ok((html.match(/<section\b/g)||[]).length===7,"expected 7 sections: hero + 01-05 + contact");
for(const id of requiredIds) {
  ok(html.includes('id="'+id+'"'),"missing #"+id);
  ok(html.includes('id="'+id+'-anchor"'),"missing precise anchor #"+id+"-anchor");
  ok(html.includes('href="#'+id+'"'),"missing navigation link #"+id);
}
ok(!/id="chain"|id="scenes"/.test(html),"legacy standalone chain/scenes sections remain");

ok(!/scroll-behavior\s*:\s*smooth/.test(css),"global smooth scrolling forbidden");
ok(!/pageshow/i.test(js),"pageshow scroll override forbidden");
ok(!/pointer\s*:\s*coarse/i.test(responsive),"navigation must not depend on pointer type");

for(const selector of [".nav-menu-toggle",".nav-menu-close",".nav-menu-scrim"]) ok(js.includes('document.querySelector("'+selector+'")'),"navigation selector mismatch: "+selector);
for(const selector of [".menu-toggle",".menu-close",".menu-scrim"]) ok(!js.includes('document.querySelector("'+selector+'")'),"legacy navigation selector remains: "+selector);

ok(/role="dialog" aria-modal="true" aria-labelledby="site-menu-title"/.test(html),"mobile menu dialog semantics missing");
ok(/aria-controls="site-menu"/.test(html),"mobile menu aria-controls missing");
ok(/IntersectionObserver/.test(js),"active navigation observer missing");
ok(/history\.pushState\(\{petsMenu:true/.test(js),"menu history sentinel missing");
ok(/history\.replaceState\(\{petsSection:id\}/.test(js),"menu target history replacement missing");
ok(/const fromMenu = link\.closest\("\.nav-menu"\)/.test(js),"menu/page navigation split missing");
ok(/header\?\.getBoundingClientRect\(\)\.height/.test(js),"dynamic header offset missing");
ok(/const scrollToTarget =/.test(js),"single scroll controller missing");
ok(/sectionTargets = new Map/.test(js),"target/section navigation map missing");
ok(/targetId:"about-anchor"/.test(nav)&&/sectionId:"about"/.test(nav),"navigation model target contract missing");
ok(/tabindex="-1"/.test(html),"main focus recovery contract missing");

const navItems=[...nav.matchAll(/\{id:"([^"]+)"[^}]*targetId:"([^"]+)"[^}]*sectionId:"([^"]+)"/g)].map(m=>({id:m[1],targetId:m[2],sectionId:m[3]}));
ok(navItems.map(x=>x.id).join(",")===navExpected.join(","),"navigation model order mismatch");
ok(navItems.length===6,"navigation model cardinality mismatch");
for(const item of navItems) {
  ok(html.includes('id="'+item.targetId+'"'),"navigation target missing: "+item.targetId);
  ok(html.includes('id="'+item.sectionId+'"'),"navigation section missing: "+item.sectionId);
}

ok(domains.length===2 && domains.includes("montpets.com") && domains.includes("www.montpets.com"),"custom domains contract missing");
ok(wrangler.name==="pets","wrangler name mismatch");
ok(wrangler.compatibility_date==="2026-09-30","wrangler compatibility date mismatch");
ok(wrangler.assets?.directory===".","workers assets directory mismatch");
ok(wrangler.assets?.not_found_handling==="404-page","Cloudflare 404-page contract missing");
ok(!fs.existsSync(path.join(root,"_headers")),"_headers must remain absent");
ok(!fs.existsSync(path.join(root,"package.json")),"package.json must remain absent in minimal static build");

ok(fs.existsSync(path.join(root,"assets/brand/brand.svg")),"full traced brand logo missing");
ok(fs.existsSync(path.join(root,"assets/brand/logo-mark.svg")),"traced logo mark missing");
ok(/viewBox="0 0 883 202"/.test(brand),"full logo viewBox mismatch");
ok(/viewBox="0 0 210 202"/.test(mark),"mark viewBox mismatch");
ok(!/<text\b/.test(brand)&&!/<text\b/.test(mark),"logo must be path-based");
ok((brand.match(/<path\b/g)||[]).length>=6,"full wordmark path trace incomplete");
ok((mark.match(/<path\b/g)||[]).length>=2,"mark path trace incomplete");
ok(/assets\/brand\/brand\.svg/.test(html),"index must use canonical full wordmark");
ok(!/<span class="brand-copy">/.test(html),"header must not reconstruct brand with separate text");
ok(/fetchpriority="high"/.test(html)&&/rel="preload"[^>]*as="image"/.test(html),"hero priority/preload contract missing");

ok(!/<style\b|\sstyle="/i.test(html),"inline style remains");
ok(!/<script>([\s\S]*?)<\/script>/i.test(html),"inline script remains");
ok(!/<script\b/i.test(notFound),"404 should not load javascript");
ok(!/<style\b|\sstyle="/i.test(notFound),"404 should not use inline styles");
ok(notFound.includes('href="/">返回首页</a>'),"404 home link missing");
ok(notFound.includes("/assets/brand/brand.svg"),"404 must use canonical wordmark");

const ids=[...html.matchAll(/(?:^|[\s<])id="([^"]+)"/g)].map(m=>m[1]);
ok(new Set(ids).size===ids.length,"duplicate html ids");
for(const m of html.matchAll(/href="#([^"]+)"/g)) if(m[1]!=="top"&&!ids.includes(m[1])) failures.push("missing anchor target: #"+m[1]);

ok((html.match(/class="feature-card"/g)||[]).length===6,"expected 6 platform-position cards");
ok((html.match(/class="value-card"/g)||[]).length===6,"expected 6 customer-value cards");
ok((html.match(/class="ability-card"/g)||[]).length===4,"expected 4 capability cards");
ok((html.match(/<div class="service-grid">/g)||[]).length===1,"five-service grid missing");
ok((html.match(/class="eco-node\b/g)||[]).length===6,"expected 6 ecosystem nodes");
ok((html.match(/class="coop-grid"/g)||[]).length===1,"cooperation modes missing");
for(const label of ["繁育企业","销售服务企业","食品用品企业","保险、运输企业","医疗、美容、养护、服装等企业"]) ok(html.includes(label),"missing five-service copy: "+label);
ok(html.includes("一宠一芯一档一码"),"identity slogan missing");

const localFiles=[...cssFiles,"js/navigation.js","js/main.js","assets/brand/brand.svg","assets/brand/logo-mark.svg","assets/images/company/company-facade.webp"];
for(const file of localFiles) ok(fs.existsSync(path.join(root,file)),"missing local file: "+file);
for(const ref of [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(m=>m[1])) {
  if(/^[a-z]+:/i.test(ref)||ref.startsWith("#")) continue;
  ok(fs.existsSync(path.join(root,ref.split("?")[0])),"missing local resource: "+ref);
}
try{new Function(js);new Function(nav)}catch(e){failures.push("JavaScript syntax error: "+e.message)}

ok((html.match(/class="life-flow"/g)||[]).length===1,"PR27 lifecycle flow missing");
ok((html.match(/class="life-dot"/g)||[]).length===4,"PR27 lifecycle must remain four stages");
ok((html.match(/class="feature-grid"/g)||[]).length===1,"PR27 platform grid missing");
ok((html.match(/class="value-grid"/g)||[]).length===1,"PR27 value grid missing");
ok(!/class="identity-visual"|class="company-ledger"|class="lifecycle-graph"|class="value-matrix"|class="data-foundation"/.test(html),"R08.1 overdesigned structures remain");
ok(!/class="eco-lines"/.test(html),"ecosystem connector-line overlay must remain absent");
ok(/.eco-center{[^}]*aspect-ratio:1/.test(css),"ecosystem center must preserve 1:1 geometry");
ok(/.eco-center{[^}]*min-height:0/.test(css),"ecosystem center must not force unequal height");
ok((css.match(/\.eco-node\.e[1-6]\{grid-area:/g)||[]).length===6,"ecosystem node area mapping must define all six partners");
ok(/.nav-menu,.nav-menu-list{min-height:0}/.test(responsive),"menu flex children must allow internal scroll");
ok(/orientation:landscape/.test(responsive),"landscape-specific responsive rule missing");
for(const token of ["--type-hero","--type-section","--type-lead","--type-body","--type-card","--type-ui","--type-meta","--type-micro","--weight-display","--weight-heading","--weight-ui","--weight-body","--lh-display","--lh-heading","--lh-lead","--lh-body","--lh-card","--lh-meta","--lh-micro","--ls-display","--ls-heading"]) ok(css.includes(token),"typography token missing: "+token);
ok(!/font-weight\s*:\s*(850|900)\b/.test(css),"legacy heavy weight 850/900 remains in CSS");
ok(!/font-size\s*:\s*(8|9|10|11)px/.test(css),"hard-coded 8-11px typography remains; use typography tokens");
ok(!/letter-spacing\s*:\s*-\.0(3|4|5|6)em/.test(css),"aggressive negative letter-spacing remains");
ok(!/\.hero-lead\{font-size:1?1px/.test(responsive),"landscape Hero lead must not fall to 11px");
if((css.match(/font-weight\s*:\s*(850|900)\b/g)||[]).length>0) failures.push("legacy heavy font weight remains");
if(failures.length){console.error("VALIDATION FAILED");failures.forEach(x=>console.error(" - "+x));process.exit(1)}
console.log("VALIDATION PASSED: R09.2 readability shell hardening");
console.log("sections:",(html.match(/<section\b/g)||[]).length);
console.log("navigation:",navExpected.join(" → "));
console.log("precise anchors:",navItems.map(x=>x.targetId).join(", "));
console.log("traced wordmark paths:",(brand.match(/<path\b/g)||[]).length);
console.log("custom domains:",domains.join(", "));
