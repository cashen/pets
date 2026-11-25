import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const checkOnly=process.argv.includes("--check");
const brandPath=path.join(root,"content","brand.json");
const sitePath=path.join(root,"content","site.json");
const homePath=path.join(root,"index.html");
const notFoundPath=path.join(root,"404.html");
const navPath=path.join(root,"js","navigation.js");
const readmePath=path.join(root,"README.md");
const read=file=>fs.readFileSync(file,"utf8");
const write=(file,value)=>fs.writeFileSync(file,value,"utf8");
const esc=value=>String(value).replace(/[&<>"\']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","\'":"&#39;"}[char]));
const fail=message=>{throw new Error(message)};
const brand=JSON.parse(read(brandPath));
const site=JSON.parse(read(sitePath));

function validateSource(){
  const requiredBrand=["companyName","brandName","platformName","platformEnglishName","tagline","identity","domain","wwwDomain"];
  for(const key of requiredBrand) if(typeof brand[key]!=="string"||!brand[key].trim()) fail("brand field missing: "+key);
  if(!brand.platformName.endsWith("大数据认证平台")) fail("brand platformName must end with 大数据认证平台");
  if(typeof site.officialAccountUrl!=="string"||!/^https:\/\//.test(site.officialAccountUrl)) fail("site.officialAccountUrl must be an HTTPS URL");
  if(!/^PET FULL-LIFECYCLE BIG DATA CERTIFICATION PLATFORM$/.test(brand.platformEnglishName)) fail("brand platformEnglishName contract mismatch");
  if(brand.domain!=="montpets.com"||brand.wwwDomain!=="www.montpets.com") fail("brand domain contract mismatch");
  if(!/^\d{4}\.\d{2}\.\d{2}-r\d+\.\d+-[a-z0-9-]+$/.test(site.uiVersion)) fail("invalid uiVersion: "+site.uiVersion);
  if(!Number.isInteger(site.copyrightYear)||site.copyrightYear<2000) fail("invalid copyrightYear");
  for(const key of ["navigationOverline","navigationTitle","mediaLabel","mediaPath"]) if(typeof site[key]!=="string"||!site[key].trim()) fail("site field missing: "+key);
  if(site.mediaPath!=="/news/") fail("site.mediaPath must remain /news/");
  if(!site.mediaNavigation||site.mediaNavigation.label!==site.mediaLabel||site.mediaNavigation.href!==site.mediaPath) fail("site.mediaNavigation must match mediaLabel/mediaPath");
  if(!Array.isArray(site.navigation)||site.navigation.length===0) fail("site.navigation must contain items");
  const ids=new Set(),targets=new Set(),sections=new Set();
  for(const item of site.navigation){
    for(const key of ["id","label","menuLabel","targetId","sectionId"]) if(typeof item[key]!=="string"||!item[key].trim()) fail("navigation field missing: "+key);
    if(ids.has(item.id)) fail("duplicate navigation id: "+item.id);
    if(targets.has(item.targetId)) fail("duplicate navigation targetId: "+item.targetId);
    if(sections.has(item.sectionId)) fail("duplicate navigation sectionId: "+item.sectionId);
    ids.add(item.id);targets.add(item.targetId);sections.add(item.sectionId);
  }
}
function replaceBlock(source,startMarker,endMarker,body,file){
  const start=source.indexOf(startMarker),end=source.indexOf(endMarker);
  if(start<0||end<start) fail("generated block markers missing: "+file);
  return source.slice(0,start)+startMarker+"\n"+body+"\n"+endMarker+source.slice(end+endMarker.length);
}
function replaceVersionLine(source){
  const lines=source.split("\n"),idx=lines.findIndex(line=>line.startsWith("当前版本："));
  if(idx<0) fail("README current version line missing");
  lines[idx]="当前版本：`"+site.uiVersion+"`";
  return lines.join("\n");
}
function platformTitleParts(){
  const suffix="大数据认证平台";
  if(!brand.platformName.endsWith(suffix)) fail("platformName must end with 大数据认证平台");
  return {lead:brand.platformName.slice(0,-suffix.length),strong:suffix};
}
function navDesktop(){
  const links=site.navigation.map(item=>"<a"+(item.id==="contact"?' class="nav-cta"':"")+" data-nav-id=\""+esc(item.id)+"\" href=\"#"+esc(item.sectionId)+"\">"+esc(item.label)+"</a>");
  const media=site.mediaNavigation;
  links.splice(Math.max(0,links.length-1),0,"<a class=\"nav-media-link\" href=\""+esc(media.href)+"\">"+esc(media.label)+"</a>");
  return links.join("");
}
function navMobile(){
  const links=site.navigation.map((item,i)=>"<a"+(item.id==="contact"?' class="menu-contact"':"")+" data-nav-id=\""+esc(item.id)+"\" href=\"#"+esc(item.sectionId)+"\"><span>"+String(i+1).padStart(2,"0")+"</span><b>"+esc(item.menuLabel)+"</b><em>→</em></a>");
  const media=site.mediaNavigation;
  const mediaLink="<a class=\"menu-media-link\" href=\""+esc(media.href)+"\"><span>"+String(site.navigation.length).padStart(2,"0")+"</span><b>"+esc(media.label)+"</b><em>→</em></a>";
  links.splice(Math.max(0,links.length-1),0,mediaLink);
  const contact=links.pop();
  links.push(contact.replace("<span>"+String(site.navigation.length).padStart(2,"0")+"</span>","<span>"+String(site.navigation.length+1).padStart(2,"0")+"</span>"));
  return links.join("");
}
function headerBlock(){
  return [
    "<header class=\"site-header\"><div class=\"nav-in\">",
    "<a class=\"brand\" href=\"#top\" aria-label=\"返回首页\"><img class=\"brand-wordmark\" src=\"./assets/brand/brand.svg?v=20261006-r100\" alt=\""+esc(brand.brandName)+"\" width=\"184\" height=\"42\"></a>",
    "<nav class=\"nav-links\" aria-label=\"主导航\">",
    navDesktop(),
    "</nav>",
    "<button class=\"nav-menu-toggle\" type=\"button\" aria-label=\"打开导航菜单\" aria-expanded=\"false\" aria-controls=\"site-menu\"><span></span><span></span><span></span></button>",
    "</div></header>",
    "<div class=\"nav-menu-scrim\" aria-hidden=\"true\"></div>",
    "<div class=\"nav-menu\" id=\"site-menu\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"site-menu-title\" aria-hidden=\"true\">",
    "<div class=\"nav-menu-head\"><div><span class=\"menu-overline\">"+esc(site.navigationOverline)+"</span><strong id=\"site-menu-title\">"+esc(site.navigationTitle)+"</strong></div><button class=\"nav-menu-close\" type=\"button\" aria-label=\"关闭导航菜单\">×</button></div>",
    "<nav class=\"nav-menu-list\" aria-label=\"页面章节\">",
    navMobile(),
    "</nav></div>"
  ].join("\n");
}
function headBlock(){
  const title=brand.brandName+"｜"+brand.platformName;
  const description="以宠物身份数据为核心，连接身份、健康、流转与服务记录，面向宠物产业链提供数字化数据服务。";
  const url="https://"+brand.domain+"/";
  const image=url+"assets/images/hero/hero.png";
  const organization={
    "@context":"https://schema.org",
    "@type":"Organization",
    "@id":url+"#organization",
    "name":brand.companyName,
    "alternateName":brand.brandName,
    "url":url,
    "logo":url+"assets/brand/brand.svg",
    "description":brand.companyName+"｜"+brand.platformName
  };
  return [
    "<title>"+esc(title)+"</title>",
    "<meta name=\"description\" content=\""+esc(description)+"\">",
    "<meta name=\"ui-version\" content=\""+esc(site.uiVersion)+"\">",
    "<link rel=\"canonical\" href=\""+esc(url)+"\">",
    "<meta property=\"og:type\" content=\"website\">",
    "<meta property=\"og:site_name\" content=\""+esc(brand.brandName)+"\">",
    "<meta property=\"og:title\" content=\""+esc(title)+"\">",
    "<meta property=\"og:description\" content=\""+esc(description)+"\">",
    "<meta property=\"og:url\" content=\""+esc(url)+"\">",
    "<meta property=\"og:image\" content=\""+esc(image)+"\">",
    "<meta property=\"og:locale\" content=\"zh_CN\">",
    "<meta name=\"twitter:card\" content=\"summary_large_image\">",
    "<meta name=\"twitter:title\" content=\""+esc(title)+"\">",
    "<meta name=\"twitter:description\" content=\""+esc(description)+"\">",
    "<meta name=\"twitter:image\" content=\""+esc(image)+"\">",
    "<script type=\"application/ld+json\">"+JSON.stringify(organization).replace(/</g,"\\u003c")+"</script>"
  ].join("\n");
}
function heroBlock(){
  const title=platformTitleParts();
  return [
    "<div class=\"hero-brandline\"><span class=\"hero-mini-mark\"></span>"+esc(brand.companyName)+"</div><p class=\"hero-kicker\">"+esc(brand.platformEnglishName)+"</p>",
    "<h1 id=\"hero-title\"><span>"+esc(title.lead)+"</span><strong>"+esc(title.strong)+"</strong></h1><p class=\"hero-tag\">"+esc(brand.tagline)+"</p>"
  ].join("\n");
}
function lifecycleBlock(){return "<div class=\"lifecycle-head\"><span>一个平台贯穿宠物全生命周期</span><b>"+esc(brand.identity)+"</b></div>";}
function identityFeatureBlock(){return "<h3>“"+esc(brand.identity)+"”身份标识</h3>";}
function identityValueIntroBlock(){return "<p class=\"lead\">平台围绕“"+esc(brand.identity)+"”，连接宠物身份、健康、流转和服务记录，面向宠物企业、宠主与宠物达人探索金融保险、交易溯源、社区交流、无害化处置等服务场景。</p>";}
function identityValueFeatureBlock(){return "<p>平台以宠物身份为基础，围绕金融保险、交易溯源、社区交流和无害化处置等场景，推动身份与服务信息在不同主体间衔接。</p>";}
function identityAbilityBlock(){return "<p class=\"lead\">围绕“"+esc(brand.identity)+"”，统一身份、采集、流转和溯源记录，让宠物信息在不同服务环节中保持连续。</p>";}
function contactBlock(){return "<div class=\"contact-card\"><span>"+esc(brand.companyName)+"</span><strong>"+esc(brand.platformName)+"</strong><a class=\"contact-action\" href=\""+esc(site.officialAccountUrl)+"\" target=\"_blank\" rel=\"noopener noreferrer\">关注微信公众号<span aria-hidden=\"true\">↗</span></a><small>了解平台动态与合作方向</small></div>";}
function footerBlock(){
  const footerLinks=site.navigation.map(item=>'<a href="#'+esc(item.sectionId)+'">'+esc(item.menuLabel)+'</a>');
  footerLinks.push('<a href="'+esc(site.mediaPath)+'">'+esc(site.mediaLabel)+'</a>');
  return [
    '<section class="footer-brand" aria-label="品牌信息">',
    '<a href="#top" aria-label="返回首页"><img class="footer-brand-logo" src="./assets/brand/brand.svg?v=20261006-r100" alt="'+esc(brand.brandName)+'" width="184" height="42" loading="lazy"></a>',
    '<strong class="footer-brand-name">'+esc(brand.companyName)+'</strong>',
    '<span class="footer-brand-platform">'+esc(brand.platformName)+'</span>',
    '<p class="footer-brand-tagline">'+esc(brand.tagline)+'</p>',
    '</section>',
    '<nav class="footer-nav" aria-label="页脚导航"><strong class="footer-heading">快速导航</strong><div class="footer-nav-links">'+footerLinks.join("")+'</div></nav>',
    '<section class="footer-wechat" aria-label="微信公众号">',
    '<a class="footer-wechat-link" href="'+esc(site.officialAccountUrl)+'" target="_blank" rel="noopener noreferrer" aria-label="打开'+esc(brand.brandName)+'微信公众号入口">',
    '<span class="footer-wechat-qr" aria-hidden="true">',
    '<img class="footer-wechat-qr-image" src="./assets/images/social/wechat-official.svg?v=20261006-r104" alt="" width="132" height="132" loading="lazy" decoding="async">',
    '<img class="footer-wechat-qr-logo" src="./assets/images/social/wechat-logo.jpg?v=20261006-r104" alt="" width="38" height="38" loading="lazy" decoding="async">',
    '</span></a>',
    '<div class="footer-wechat-copy"><strong>微信公众号</strong><span>扫码关注'+esc(brand.brandName)+'</span></div>',
    '</section>',
    '<div class="footer-bottom"><span>© '+site.copyrightYear+' <b>'+esc(brand.companyName)+'</b> · '+esc(brand.identity)+'</span><span>'+esc(brand.domain)+'</span></div>'
  ].join("\n");
}
function notFoundHeadBlock(){
  return [
    "<title>"+esc(brand.brandName)+"｜页面不存在</title>",
    "<meta name=\"description\" content=\""+esc(brand.brandName+brand.platformName)+"\">"
  ].join("\n");
}
function notFoundFooterBlock(){return "<footer class=\"error-footer\"><span><b>"+esc(brand.brandName)+"</b> · "+esc(brand.tagline)+"</span><span>© "+site.copyrightYear+" "+esc(brand.companyName)+"</span></footer>";}
function navigationJs(){
  const items=site.navigation.map((item,i)=>"    {id:\""+item.id+"\",label:\""+item.label+"\",menuLabel:\""+item.menuLabel+"\",targetId:\""+item.targetId+"\",sectionId:\""+item.sectionId+"\"}"+(i===site.navigation.length-1?"":","));
  return ["(() => {",'  "use strict";',"","  const items = [","<!-- NAVIGATION:GENERATED:START -->",items.join("\n"),"<!-- NAVIGATION:GENERATED:END -->","  ];","","  window.PetsNavigation = Object.freeze({","    items: items.map(item => Object.freeze({...item}))","  });","})();",""].join("\n");
}
validateSource();

const home=read(homePath),notFound=read(notFoundPath),navJs=read(navPath),readme=read(readmePath);
let expectedHome=home;
expectedHome=replaceBlock(expectedHome,"<!-- SITE:HEAD:GENERATED:START -->","<!-- SITE:HEAD:GENERATED:END -->",headBlock(),"index.html");
expectedHome=replaceBlock(expectedHome,"<!-- SITE:NAV:GENERATED:START -->","<!-- SITE:NAV:GENERATED:END -->",headerBlock(),"index.html");
expectedHome=replaceBlock(expectedHome,"<!-- BRAND:HERO:GENERATED:START -->","<!-- BRAND:HERO:GENERATED:END -->",heroBlock(),"index.html");
expectedHome=replaceBlock(expectedHome,"<!-- BRAND:LIFECYCLE:GENERATED:START -->","<!-- BRAND:LIFECYCLE:GENERATED:END -->",lifecycleBlock(),"index.html");
expectedHome=replaceBlock(expectedHome,"<!-- BRAND:IDENTITY-CARD:GENERATED:START -->","<!-- BRAND:IDENTITY-CARD:GENERATED:END -->",identityFeatureBlock(),"index.html");
expectedHome=replaceBlock(expectedHome,"<!-- BRAND:VALUE-INTRO:GENERATED:START -->","<!-- BRAND:VALUE-INTRO:GENERATED:END -->",identityValueIntroBlock(),"index.html");
expectedHome=replaceBlock(expectedHome,"<!-- BRAND:VALUE-FEATURE:GENERATED:START -->","<!-- BRAND:VALUE-FEATURE:GENERATED:END -->",identityValueFeatureBlock(),"index.html");
expectedHome=replaceBlock(expectedHome,"<!-- BRAND:ABILITY-INTRO:GENERATED:START -->","<!-- BRAND:ABILITY-INTRO:GENERATED:END -->",identityAbilityBlock(),"index.html");
expectedHome=replaceBlock(expectedHome,"<!-- BRAND:CONTACT:GENERATED:START -->","<!-- BRAND:CONTACT:GENERATED:END -->",contactBlock(),"index.html");
expectedHome=replaceBlock(expectedHome,"<!-- SITE:FOOTER:GENERATED:START -->","<!-- SITE:FOOTER:GENERATED:END -->",footerBlock(),"index.html");
let expected404=notFound;
expected404=replaceBlock(expected404,"<!-- SITE:HEAD:GENERATED:START -->","<!-- SITE:HEAD:GENERATED:END -->",notFoundHeadBlock(),"404.html");
expected404=replaceBlock(expected404,"<!-- BRAND:FOOTER:GENERATED:START -->","<!-- BRAND:FOOTER:GENERATED:END -->",notFoundFooterBlock(),"404.html");
expected404=expected404.replace(/alt="[^"]+"/,'alt="'+brand.brandName+'"');
const expectedNav=navigationJs();
const expectedReadme=replaceVersionLine(readme);

if(checkOnly){
  if(home!==expectedHome) fail("index.html generated content is out of sync");
  if(notFound!==expected404) fail("404.html generated content is out of sync");
  if(navJs!==expectedNav) fail("js/navigation.js generated content is out of sync");
  if(readme!==expectedReadme) fail("README current version is out of sync");
  console.log("SITE GENERATION CHECK PASSED: core brand/site/navigation sources are synchronized");
  process.exit(0);
}
write(homePath,expectedHome);
write(notFoundPath,expected404);
write(navPath,expectedNav);
write(readmePath,expectedReadme);
console.log("SITE GENERATED: core brand/site/navigation surfaces synchronized");
