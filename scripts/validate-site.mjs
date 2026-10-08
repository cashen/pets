import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const html=read("index.html");
const newsIndex=read("news/index.html");
const newsData=JSON.parse(read("content/news.json"));
const brandData=JSON.parse(read("content/brand.json"));
const siteData=JSON.parse(read("content/site.json"));
const notFound=read("404.html");
const readme=read("README.md");
const wrangler=JSON.parse(read("wrangler.jsonc"));
const cssFiles=["css/tokens.css","css/base.css","css/layout.css","css/components.css","css/sections.css","css/responsive.css","css/wechat-footer.css","css/media.css","css/error.css"];
const css=cssFiles.map(read).join("\n");
const js=read("js/main.js");
const nav=read("js/navigation.js");
const brand=read("assets/brand/brand.svg");
const mark=read("assets/brand/logo-mark.svg");
const responsive=read("css/responsive.css");
const failures=[];
const ok=(condition,message)=>{if(!condition)failures.push(message)};
const heroBinary=fs.readFileSync(path.join(root,"assets/images/hero/hero.png"));
ok(heroBinary.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])),"Hero binary must be a valid PNG");
const heroWidth=heroBinary.readUInt32BE(16);
const heroHeight=heroBinary.readUInt32BE(20);
ok(heroWidth===1256 && heroHeight===471,"Hero intrinsic PNG dimensions mismatch");
ok(heroBinary[24]===8,"Hero PNG bit depth must be 8");
ok(heroBinary[25]===2,"Hero PNG must be truecolor RGB");

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
ok(html.includes('company-facade.webp?v=20261006-r100" alt="产业园建筑外观" width="400" height="206"'),"company image dimensions contract missing");
ok(/<img alt="宠物全生命周期数字化服务视觉" src="\.\/assets\/images\/hero\/hero\.png\?v=20261008-r162" width="1256" height="471"[^>]*>/.test(html),"hero image intrinsic dimensions contract missing");
ok(read("css/sections.css").includes(".hero-image-frame{position:relative;overflow:hidden;border:0;padding:0;"),"hero frame must have no border or padding");
ok(read("css/sections.css").includes(".hero-image-frame img{display:block;width:100%;height:auto;aspect-ratio:auto;object-fit:initial}"),"hero image must render at natural aspect ratio without crop");
ok(!read("css/responsive.css").includes("hero-image-frame{border-width:7px"),"responsive hero border override remains");
ok(read("css/sections.css").includes(".hero-image-frame{\n  width:100%;\n  grid-column:1 / -1;"),"hero frame full-track contract missing");
ok(read("css/responsive.css").includes(".hero-media .hero-orbit-c{grid-column:1}\n  .hero-media .hero-orbit-d{grid-column:2}"),"mobile Hero orbit grid mapping missing");
ok(!/\.hero-image-frame img\{[^}]*aspect-ratio:(?:4\/3|16\/10)/.test(css),"legacy hero crop ratio remains in base CSS");
ok(!responsive.includes(".hero-image-frame img{aspect-ratio:4/3}")&&!responsive.includes(".hero-image-frame img{aspect-ratio:16/10}"),"responsive hero crop override remains");
ok(html.includes(uiSystemContract.skipLink),"skip link contract missing");
ok(read("css/base.css").includes(uiSystemContract.menuLock),"menu scroll-lock contract missing");
ok(/error-nav\{min-height:calc\(var\(--header-h\) \+ var\(--safe-top\)\)/.test(read("css/error.css")),"404 header safe-area contract missing");
ok(/safe-bottom/.test(read("css/error.css")),"404 bottom safe-area contract missing");
ok(notFound.includes("20261006-r150"),"404 asset version is stale");
ok(uiSystemContract.shortLandscape.test(responsive),"short landscape contract missing");
for(const token of ["--safe-top:env(safe-area-inset-top,0px)","--safe-right:env(safe-area-inset-right,0px)","--safe-bottom:env(safe-area-inset-bottom,0px)","--safe-left:env(safe-area-inset-left,0px)"]) ok(read("css/tokens.css").includes(token),"safe-area token missing: "+token);
ok(read("css/components.css").includes("padding-top:var(--safe-top)"),"header safe-area contract missing");
const responsiveContracts=[{name:"desktop/tablet",pattern:/@media\(max-width:1100px\)/,selectors:[".hero-grid{",".feature-grid{",".eco-board{",".eco-center{",".nav-menu{"]},{name:"tablet",pattern:/@media\(min-width:761px\) and \(max-width:1100px\)/,selectors:[".hero-grid{",".section-head{",".eco-center{",".nav-menu{"]},{name:"mobile",pattern:/@media\(max-width:760px\)/,selectors:[".hero-grid{",".eco-board{",".eco-center{",".nav-menu{"]},{name:"mobile landscape",pattern:/@media\(orientation:landscape\) and \(max-width:760px\)/,selectors:[".hero-grid{",".hero-lead{"]}];
for(const contract of responsiveContracts){ok(contract.pattern.test(responsive),"responsive breakpoint contract missing: "+contract.name);for(const selector of contract.selectors)ok(responsive.includes(selector),"responsive selector contract missing ("+contract.name+"): "+selector);}



const requiredIds=siteData.navigation.map(item=>item.sectionId);
const navExpected=siteData.navigation.map(item=>item.id);
const domains=(wrangler.routes||[]).filter(r=>r?.custom_domain===true).map(r=>r.pattern).filter(Boolean);
for(const key of ["companyName","brandName","platformName","platformEnglishName","tagline","identity","domain","wwwDomain"]) ok(typeof brandData[key]==="string"&&brandData[key].trim(),"brand source field missing: "+key);
ok(siteData.uiVersion==="2026.10.08-r18.0-core-content-governance","wrong UI version source");
ok(siteData.mediaLabel==="媒体报道"&&siteData.mediaPath==="/news/","media site configuration drift");
const sourceNav=siteData.navigation.map(({id,label,menuLabel,targetId,sectionId})=>({id,label,menuLabel,targetId,sectionId}));

ok(/^<!doctype html>/i.test(html.trim()),"missing doctype");
ok(/^<!doctype html>/i.test(notFound.trim()),"404 missing doctype");
ok(/meta name="viewport"/i.test(html),"missing viewport");
ok(html.includes('meta name="ui-version" content="'+siteData.uiVersion+'"'),"wrong ui version");
ok((html.match(/<section\b/g)||[]).length===8,"expected 8 sections: hero + 01-05 + brand news + contact");
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
ok(/activeIdFromScroll/.test(js)&&/scheduleActiveSync/.test(js),"scroll-based active navigation controller missing");
ok(!/IntersectionObserver/.test(js),"legacy IntersectionObserver active controller remains");
ok(/history\.pushState\(\{petsMenu:true/.test(js),"menu history sentinel missing");
ok(/history\.replaceState\(\{petsSection:id\}/.test(js),"menu target history replacement missing");
ok(/const fromMenu = link\.closest\("\.nav-menu"\)/.test(js),"menu/page navigation split missing");
ok(/header\?\.getBoundingClientRect\(\)\.height/.test(js),"dynamic header offset missing");
ok(/const scrollToTarget =/.test(js),"single scroll controller missing");
ok(/sectionTargets = new Map/.test(js),"target/section navigation map missing");
ok(/targetId:"about-anchor"/.test(nav)&&/sectionId:"about"/.test(nav),"navigation model target contract missing");
ok(/tabindex="-1"/.test(html),"main focus recovery contract missing");

const navItems=[...nav.matchAll(/\{id:"([^"]+)",label:"([^"]+)",menuLabel:"([^"]+)",targetId:"([^"]+)",sectionId:"([^"]+)"\}/g)].map(m=>({id:m[1],label:m[2],menuLabel:m[3],targetId:m[4],sectionId:m[5]}));
ok(JSON.stringify(navItems)===JSON.stringify(sourceNav),"navigation model must match content/site.json");
ok(navItems.map(x=>x.id).join(",")===navExpected.join(","),"navigation model order mismatch");
ok(navItems.length===siteData.navigation.length,"navigation model cardinality mismatch");
for(const item of navItems) {
  ok(html.includes('id="'+item.targetId+'"'),"navigation target missing: "+item.targetId);
  ok(html.includes('id="'+item.sectionId+'"'),"navigation section missing: "+item.sectionId);
}

ok(domains.length===2 && domains.includes(brandData.domain) && domains.includes(brandData.wwwDomain),"custom domains contract missing");
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
for(const key of ["companyName","brandName","platformName","platformEnglishName","tagline","identity","domain"]) ok(html.includes(brandData[key]),"brand source not rendered on homepage: "+key);
ok(html.includes(brandData.brandName)&&notFound.includes(brandData.tagline)&&notFound.includes(brandData.companyName),"404 brand source rendering drift");
ok(html.includes('href="https://weixin.qq.com/r/mp/CSDF3RDEkE3vrVS_93Ub"'),"official WeChat HTTPS link missing");
ok(html.includes('class="footer-wechat"'),"footer WeChat block missing");
ok(html.includes('href="'+siteData.mediaPath+'">'+siteData.mediaLabel+'</a>'),"footer media coverage link missing");
ok(read("css/wechat-footer.css").includes(".footer-media{"),"footer media link style missing");



const newsSorted=[...newsData].sort((a,b)=>b.date.localeCompare(a.date)||a.slug.localeCompare(b.slug));
const htmlEscape=value=>String(value).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
ok(Array.isArray(newsData)&&newsData.length>0,"news source must contain at least one record");
ok(JSON.stringify(newsData)===JSON.stringify(newsSorted),"news source must be reverse chronological");
const newsSlugs=new Set(),newsUrls=new Set();
for(const item of newsData){
  for(const field of ["slug","date","source","category","title","summary","sourceUrl"])ok(typeof item[field]==="string"&&item[field].trim(),"news source field missing: "+field+" / "+(item.slug||"unknown"));
  ok(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug),"invalid news slug: "+item.slug);
  ok(/^\d{4}-\d{2}-\d{2}$/.test(item.date),"invalid news date: "+item.slug);
  ok(/^https?:\/\//.test(item.sourceUrl),"news source URL must be http(s): "+item.slug);
  ok(!newsSlugs.has(item.slug),"duplicate news slug: "+item.slug);
  ok(!newsUrls.has(item.sourceUrl),"duplicate news source URL: "+item.sourceUrl);
  newsSlugs.add(item.slug);newsUrls.add(item.sourceUrl);
}
ok((html.match(/class="media-card"/g)||[]).length===newsData.length,"homepage media card count must equal news source");
ok((newsIndex.match(/class="news-list-card"/g)||[]).length===newsData.length,"news archive card count must equal news source");
let homeOrder=-1,archiveOrder=-1;
for(const item of newsData){
  const homeTitle=html.indexOf(item.title),archiveTitle=newsIndex.indexOf(item.title);
  ok(homeTitle>homeOrder,"homepage media order/content mismatch: "+item.slug);
  ok(archiveTitle>archiveOrder,"news archive order/content mismatch: "+item.slug);
  homeOrder=homeTitle;archiveOrder=archiveTitle;
  const sourceHref=htmlEscape(item.sourceUrl);
  ok(html.includes('href="'+sourceHref+'"'),"homepage media source link missing: "+item.slug);
  ok(newsIndex.includes('href="/news/'+item.slug+'/"'),"news archive detail link missing: "+item.slug);
  const articlePath="news/"+item.slug+"/index.html";
  ok(fs.existsSync(path.join(root,articlePath)),"news detail missing: "+item.slug);
  const article=read(articlePath);
  ok(article.includes(item.title),"news detail title missing: "+item.slug);
  ok(article.includes('href="'+sourceHref+'"'),"news detail source link missing: "+item.slug);
  ok(article.includes(item.summary),"news detail summary missing: "+item.slug);
  if(item.author)ok(article.includes(item.author),"news detail author missing: "+item.slug);
  if(item.editor)ok(article.includes(item.editor),"news detail editor missing: "+item.slug);
}
const newsDirs=fs.readdirSync(path.join(root,"news"),{withFileTypes:true}).filter(entry=>entry.isDirectory()).map(entry=>entry.name).sort();
ok(JSON.stringify(newsDirs)===JSON.stringify(newsData.map(x=>x.slug).sort()),"news detail directories must match news source");




const publicPages=[html,newsIndex,notFound].join("\n");
for(const phrase of ["目前收录一篇","不改变现有官网信息架构","记录品牌与企业发展的重要节点，保持克制、持续更新","本页保留原始信息来源","价值：","共生共荣的产业生态","本文作为官网媒体报道记录"]) ok(!publicPages.includes(phrase),"developer/AI-like public copy remains: "+phrase);
ok(html.includes("媒体报道"),"homepage media coverage label missing");
ok(!html.includes("有关梦宠数智的公开报道。"),"redundant media coverage intro remains");
ok(!html.includes("brand-news"),"legacy brand-news semantics remain in homepage");
ok(!css.includes("brand-news"),"legacy brand-news selectors remain in CSS");
ok(!fs.existsSync(path.join(root,"css/landing.css")),"landing.css must be removed after CSS convergence");
ok(!html.includes("./css/landing.css"),"index must not reference removed landing.css");
ok(!/@media/.test(read("css/sections.css")),"sections.css must not contain breakpoint rules");

ok(readme.includes(siteData.uiVersion),"README version is out of sync");
ok(!readme.includes("2026.10.06-r10.4-wechat-footer-cleanup"),"stale R10.4 README version remains");
ok(!readme.includes("\\n"),"README contains literal newline escape text");
ok(html.includes("身份 · 健康 · 服务"),"eco center service labels missing");
ok(html.includes("欢迎在宠物身份、健康、溯源及数据服务等方向开展合作。"),"contact cooperation copy is not humanized");
ok(newsIndex.includes("媒体报道"),"media coverage index label missing");



ok(newsIndex.includes('meta name="viewport"'),"brand news index viewport missing");

ok(html.includes('class="footer-wechat-qr"'),"footer WeChat QR wrapper missing");
ok(html.includes('class="footer-wechat-qr-image" src="./assets/images/social/wechat-official.svg?v=20261006-r104"'),"official WeChat QR asset missing or cache version mismatch");
ok(html.includes('class="footer-wechat-qr-logo" src="./assets/images/social/wechat-logo.jpg?v=20261006-r104"'),"provided WeChat logo layer missing");
ok(!html.includes('class="sr-only"'),"footer QR has stray visible accessibility text");
ok(!read("assets/images/social/wechat-official.svg").includes("<image"),"QR SVG must not depend on nested image resources");

const newsDetailFiles=newsData.map(item=>"news/"+item.slug+"/index.html");
const localFiles=[...cssFiles,"js/navigation.js","js/main.js","scripts/browser-smoke.spec.mjs","assets/brand/brand.svg","assets/brand/logo-mark.svg","assets/images/company/company-facade.webp","assets/images/social/wechat-official.svg","assets/images/social/wechat-logo.jpg","news/index.html","content/news.json","content/brand.json","content/site.json","scripts/generate-news.mjs","scripts/generate-site.mjs",...newsDetailFiles];
for(const file of localFiles)ok(fs.existsSync(path.join(root,file)),"missing local file: "+file);
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
ok(/orientation: landscape\) and \(min-width:761px\) and \(max-width:1100px\)/.test(responsive),"tablet landscape Hero contract missing");
ok(/--type-lead:14px;--type-body:14px;--type-card:14px;--type-ui:14px;--type-meta:12px/.test(responsive),"landscape mobile typography contract missing");
for(const token of ["--type-hero","--type-section","--type-lead","--type-body","--type-card","--type-ui","--type-meta","--type-micro","--weight-display","--weight-heading","--weight-ui","--weight-body","--lh-display","--lh-heading","--lh-lead","--lh-body","--lh-card","--lh-meta","--lh-micro","--ls-display","--ls-heading"]) ok(css.includes(token),"typography token missing: "+token);
ok(!/font-weight\s*:\s*(850|900)\b/.test(css),"legacy heavy weight 850/900 remains in CSS");
ok(!/font-size\s*:\s*(8|9|10|11)px/.test(css),"hard-coded 8-11px typography remains; use typography tokens");
ok(!/letter-spacing\s*:\s*-\.0(3|4|5|6)em/.test(css),"aggressive negative letter-spacing remains");
ok(!/\.hero-lead\{font-size:1?1px/.test(responsive),"landscape Hero lead must not fall to 11px");
ok(!/--type-(lead|body|card|ui|meta):1[01]px/.test(responsive),"landscape mobile typography is undersized");
if((css.match(/font-weight\s*:\s*(850|900)\b/g)||[]).length>0) failures.push("legacy heavy font weight remains");
if(failures.length){console.error("VALIDATION FAILED");failures.forEach(x=>console.error(" - "+x));process.exit(1)}
console.log("VALIDATION PASSED: R17.0 content single-source + CSS architecture static contracts");
console.log("sections:",(html.match(/<section\b/g)||[]).length);
console.log("navigation:",navExpected.join(" → "));
console.log("precise anchors:",navItems.map(x=>x.targetId).join(", "));
console.log("traced wordmark paths:",(brand.match(/<path\b/g)||[]).length);
console.log("custom domains:",domains.join(", "));
