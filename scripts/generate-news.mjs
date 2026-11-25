import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const checkOnly=process.argv.includes("--check");
const PAGE_SIZE=5;
const sourcePath=path.join(root,"content","news.json");
const brandPath=path.join(root,"content","brand.json");
const sitePath=path.join(root,"content","site.json");
const homePath=path.join(root,"index.html");
const archivePath=path.join(root,"news","index.html");
const newsRoot=path.join(root,"news");
const redirectsPath=path.join(root,"_redirects");
const sitemapPath=path.join(root,"sitemap.xml");
const robotsPath=path.join(root,"robots.txt");
const startMarker="<!-- NEWS:GENERATED:START -->";
const endMarker="<!-- NEWS:GENERATED:END -->";
const paginationStart="<!-- NEWS:PAGINATION:GENERATED:START -->";
const paginationEnd="<!-- NEWS:PAGINATION:GENERATED:END -->";
const seoStart="<!-- NEWS:SEO:GENERATED:START -->";
const seoEnd="<!-- NEWS:SEO:GENERATED:END -->";
const read=file=>fs.readFileSync(file,"utf8");
const write=(file,value)=>fs.writeFileSync(file,value,"utf8");
const esc=value=>String(value).replace(/[&<>\"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[char]));
const dateLabel=value=>{const p=value.split("-");return p[0]+"."+p[1]+"."+p[2];};
const hasDate=item=>typeof item.date==="string"&&item.date.trim()!=="";
const stableSort=items=>[...items].sort((a,b)=>{const ad=hasDate(a),bd=hasDate(b);if(ad!==bd)return ad?-1:1;if(!ad&&!bd)return 0;return b.date.localeCompare(a.date)||a.slug.localeCompare(b.slug);});
const pageHref=page=>page===1?"/news/":"/news/page/"+page+"/";
function fail(message){throw new Error(message);}
function validateSource(items){
  if(!Array.isArray(items)||items.length===0)fail("content/news.json must contain at least one news record");
  const slugs=new Set(),urls=new Set(),legacySlugs=new Set();
  for(const item of items){
    for(const field of ["slug","source","category","title","summary","sourceUrl"])if(typeof item[field]!=="string"||item[field].trim()==="")fail("news field missing: "+field);
    if(item.date!=null&&item.date!==""&&(typeof item.date!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(item.date)))fail("invalid optional news date: "+item.slug);
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug)||item.slug==="page")fail("invalid or reserved news slug: "+item.slug);
    if(!/^https?:\/\//.test(item.sourceUrl))fail("news source URL must be http(s): "+item.sourceUrl);
    if(slugs.has(item.slug))fail("duplicate news slug: "+item.slug);
    if(urls.has(item.sourceUrl))fail("duplicate news source URL: "+item.sourceUrl);
    if(item.author!=null&&typeof item.author!=="string")fail("news author must be string: "+item.slug);
    if(item.editor!=null&&typeof item.editor!=="string")fail("news editor must be string: "+item.slug);
    if(item.legacySlugs!=null&&!Array.isArray(item.legacySlugs))fail("legacySlugs must be an array: "+item.slug);
    for(const oldSlug of item.legacySlugs||[]){
      if(typeof oldSlug!=="string"||! /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(oldSlug))fail("invalid legacy news slug: "+item.slug);
      if(oldSlug===item.slug||legacySlugs.has(oldSlug))fail("duplicate or self-referencing legacy news slug: "+oldSlug);
      legacySlugs.add(oldSlug);
    }
    slugs.add(item.slug);urls.add(item.sourceUrl);
  }
  for(const oldSlug of legacySlugs)if(slugs.has(oldSlug))fail("legacy news slug collides with an active slug: "+oldSlug);
  if(JSON.stringify(items)!==JSON.stringify(stableSort(items)))fail("content/news.json must be in reverse chronological order with undated records last");
}
function replaceGeneratedBlock(source,start,end,body,file){
  const a=source.indexOf(start),b=source.indexOf(end);
  if(a<0||b<a)fail("generated block markers missing: "+file);
  return source.slice(0,a)+start+"\n"+body+"\n"+end+source.slice(b+end.length);
}
function homepageBody(items){
  return items.map(item=>[
    '<article class="media-card">',
    '<div class="media-meta">'+(hasDate(item)?'<strong class="media-date">'+esc(dateLabel(item.date))+'</strong>':"")+'<span>'+esc(item.source)+'</span><span>'+esc(item.category)+'</span></div>',
    '<div class="media-body">',
    '<h3 class="media-title">'+esc(item.title)+'</h3>',
    '<p class="media-summary">'+esc(item.summary)+'</p>',
    '<a class="media-action" href="'+esc(item.sourceUrl)+'" target="_blank" rel="noopener noreferrer"><span>查看原文</span><span aria-hidden="true">↗</span></a>',
    '</div>',
    '</article>'
  ].join("\n")).join("\n");
}
function archiveBody(items){
  return items.map(item=>[
    '<article class="news-list-card">',
    '<div class="news-list-meta">'+(hasDate(item)?'<strong>'+esc(dateLabel(item.date))+'</strong>':"")+'<span>'+esc(item.source)+'</span><span>'+esc(item.category)+'</span></div>',
    '<div class="news-list-body">',
    '<h2>'+esc(item.title)+'</h2>',
    '<p>'+esc(item.summary)+'</p>',
    '<a class="media-action" href="/news/'+esc(item.slug)+'/"><span>查看报道</span><span aria-hidden="true">→</span></a>',
    '</div>',
    '</article>'
  ].join("\n")).join("\n");
}
function redirectsBody(items){
  const lines=["# Historical media URLs preserved after semantic slug correction"];
  for(const item of items)for(const oldSlug of item.legacySlugs||[]){
    lines.push("/news/"+oldSlug+" /news/"+item.slug+"/ 301");
    lines.push("/news/"+oldSlug+"/ /news/"+item.slug+"/ 301");
  }
  return lines.join("\n")+"\n";
}
function sitemapBody(items,totalPages){
  const urls=["https://"+brand.domain+"/","https://"+brand.domain+"/news/"];
  for(let page=2;page<=totalPages;page++)urls.push("https://"+brand.domain+pageHref(page));
  for(const item of items)urls.push("https://"+brand.domain+"/news/"+item.slug+"/");
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.map(url=>"  <url><loc>"+esc(url)+"</loc></url>").join("\n")+"\n</urlset>\n";
}
function robotsBody(){
  return "User-agent: *\nAllow: /\nSitemap: https://"+brand.domain+"/sitemap.xml\n";
}
function paginationBody(page,total){
  if(total<=1)return "";
  const tokens=new Set([1,total]);
  for(let n=Math.max(2,page-1);n<=Math.min(total-1,page+1);n++)tokens.add(n);
  const ordered=[...tokens].sort((a,b)=>a-b);
  const parts=[];
  if(page>1)parts.push('<a class="news-page-link" href="'+pageHref(page-1)+'" rel="prev" aria-label="上一页">上一页</a>');
  else parts.push('<span class="news-page-link is-disabled" aria-disabled="true">上一页</span>');
  let previous=0;
  for(const n of ordered){
    if(previous&&n-previous>1)parts.push('<span class="news-page-ellipsis" aria-hidden="true">…</span>');
    if(n===page)parts.push('<span class="news-page-number is-current" aria-current="page">'+n+'</span>');
    else parts.push('<a class="news-page-number" href="'+pageHref(n)+'" aria-label="第 '+n+' 页">'+n+'</a>');
    previous=n;
  }
  if(page<total)parts.push('<a class="news-page-link" href="'+pageHref(page+1)+'" rel="next" aria-label="下一页">下一页</a>');
  else parts.push('<span class="news-page-link is-disabled" aria-disabled="true">下一页</span>');
  return '<nav class="news-pagination" aria-label="媒体报道分页">'+parts.join("")+'</nav>';
}
function archiveDocument(template,items,page,total){
  let document=replaceGeneratedBlock(template,startMarker,endMarker,archiveBody(items),"news archive page "+page);
  document=replaceGeneratedBlock(document,paginationStart,paginationEnd,paginationBody(page,total),"news pagination "+page);
  const title=page===1?"媒体报道｜梦宠数智":"媒体报道｜第 "+page+" 页｜梦宠数智";
  const description=page===1?"辽宁梦宠数智科技有限公司相关公开媒体报道。":"辽宁梦宠数智科技有限公司媒体报道归档，第 "+page+" 页。";
  document=document.replace(/<title>[\s\S]*?<\/title>/,'<title>'+esc(title)+'</title>');
  document=document.replace(/<meta name="description" content="[^"]*">/,'<meta name="description" content="'+esc(description)+'">');
  const canonical="https://"+brand.domain+pageHref(page);
  const seo=[
    '<link rel="canonical" href="'+esc(canonical)+'">',
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="'+esc(brand.brandName)+'">',
    '<meta property="og:title" content="'+esc(title)+'">',
    '<meta property="og:description" content="'+esc(description)+'">',
    '<meta property="og:url" content="'+esc(canonical)+'">',
    '<meta name="twitter:card" content="summary">'
  ];
  if(page>1)seo.push('<link rel="prev" href="https://'+brand.domain+pageHref(page-1)+'">');
  if(page<total)seo.push('<link rel="next" href="https://'+brand.domain+pageHref(page+1)+'">');
  return replaceGeneratedBlock(document,seoStart,seoEnd,seo.join("\n"),"news SEO "+page);
}
function detailPage(item){const people=(item.author||item.editor)?'<div class="news-article-summary"><strong>作者：</strong>'+esc(item.author||"—")+'　<strong>编辑：</strong>'+esc(item.editor||"—")+'</div>':"";return ['<!doctype html>','<html lang="zh-CN">','<head>','<meta charset="utf-8">','<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">','<title>媒体报道｜'+esc(item.title)+'｜'+esc(brand.brandName)+'</title>','<meta name="description" content="'+esc("媒体报道："+(hasDate(item)?dateLabel(item.date)+" ":"")+item.source+"："+item.title)+'">','<link rel="canonical" href="https://'+brand.domain+'/news/'+esc(item.slug)+'/">','<meta property="og:type" content="article">','<meta property="og:site_name" content="'+esc(brand.brandName)+'">','<meta property="og:title" content="'+esc(item.title)+'">','<meta property="og:description" content="'+esc(item.summary)+'">','<meta property="og:url" content="https://'+brand.domain+'/news/'+esc(item.slug)+'/">','<meta name="twitter:card" content="summary">','<meta name="theme-color" content="#f36b12">','<link rel="stylesheet" href="/css/tokens.css?v=20261008-r165">','<link rel="stylesheet" href="/css/base.css?v=20261006-r100">','<link rel="stylesheet" href="/css/media.css?v=20261006-r150">',
'<link rel="stylesheet" href="/css/brand-refresh.css?v=20261125-r1">','</head>','<body class="news-page">','<a class="skip-link" href="#news-article">跳过导航，直接进入主要内容</a>','<header class="news-header"><div class="news-header-in">','<a class="brand" href="/" aria-label="返回'+esc(brand.brandName)+'首页"><img class="brand-wordmark" src="/assets/brand/brand.svg?v=20261006-r100" alt="'+esc(brand.brandName)+'" width="176" height="40"></a>','<a class="news-back" href="/news/"><span aria-hidden="true">←</span><span>'+esc(site.mediaLabel)+'</span></a>','</div></header>','<main id="news-article" class="news-main" tabindex="-1"><article class="news-article">','<div class="eyebrow">MEDIA COVERAGE</div>','<h1>'+esc(item.title)+'</h1>','<div class="news-article-meta">'+(hasDate(item)?'<span>'+esc(dateLabel(item.date))+'</span><span>·</span>':'')+'<span>'+esc(item.source)+'</span><span>·</span><span>'+esc(item.category)+'</span></div>','<div class="news-article-summary">'+esc(item.summary)+'</div>',people,'<div class="news-source"><span>来源：'+esc(item.source)+'</span><a href="'+esc(item.sourceUrl)+'" target="_blank" rel="noopener noreferrer">查看原文 ↗</a></div>','</article></main>','<footer class="news-footer"><span>© '+site.copyrightYear+' '+esc(brand.companyName)+' · '+esc(brand.domain)+'</span></footer>','</body>','</html>',''].join("\n");}
const brand=JSON.parse(read(brandPath)),site=JSON.parse(read(sitePath));
if(typeof brand.companyName!=="string"||typeof brand.brandName!=="string"||typeof brand.domain!=="string")fail("content/brand.json missing news identity fields");
if(!Number.isInteger(site.copyrightYear))fail("content/site.json copyrightYear must be an integer");
const items=stableSort(JSON.parse(read(sourcePath)));
validateSource(items);
const currentHome=read(homePath),archiveTemplate=read(archivePath);
const pageCount=Math.ceil(items.length/PAGE_SIZE);
const expectedHome=replaceGeneratedBlock(currentHome,startMarker,endMarker,homepageBody(items.slice(0,PAGE_SIZE)),"index.html");
const expectedArchives=new Map();
for(let page=1;page<=pageCount;page++){
  const pageItems=items.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  const file=page===1?archivePath:path.join(newsRoot,"page",String(page),"index.html");
  expectedArchives.set(file,archiveDocument(archiveTemplate,pageItems,page,pageCount));
}
const expectedPages=new Map(items.map(item=>[path.join(newsRoot,item.slug,"index.html"),detailPage(item)]));
const expectedRootDirs=[...items.map(item=>item.slug),...(pageCount>1?["page"]:[])].sort();
const actualDirs=fs.readdirSync(newsRoot,{withFileTypes:true}).filter(entry=>entry.isDirectory()).map(entry=>entry.name).sort();
const expectedRedirects=redirectsBody(items),expectedSitemap=sitemapBody(items,pageCount),expectedRobots=robotsBody();
if(checkOnly&&JSON.stringify(actualDirs)!==JSON.stringify(expectedRootDirs))fail("news directories do not match active records and pagination pages");
if(checkOnly){
  if(currentHome!==expectedHome)fail("generated homepage media block is out of sync");
  for(const [file,expected] of expectedArchives){
    if(!fs.existsSync(file))fail("generated news archive page missing: "+path.relative(root,file));
    if(read(file)!==expected)fail("generated news archive page is out of sync: "+path.relative(root,file));
  }
  for(const [file,expected] of expectedPages){
    if(!fs.existsSync(file))fail("generated news detail missing: "+path.relative(root,file));
    if(read(file)!==expected)fail("generated news detail is out of sync: "+path.relative(root,file));
  }
  for(const [file,expected] of [[redirectsPath,expectedRedirects],[sitemapPath,expectedSitemap],[robotsPath,expectedRobots]]){
    if(!fs.existsSync(file)||read(file)!==expected)fail("generated SEO/redirect file is missing or out of sync: "+path.basename(file));
  }
  console.log("NEWS GENERATION CHECK PASSED: "+items.length+" records, "+pageCount+" archive pages, redirects, sitemap and robots.txt");
  process.exit(0);
}
write(homePath,expectedHome);
for(const item of items)for(const oldSlug of item.legacySlugs||[])fs.rmSync(path.join(newsRoot,oldSlug),{recursive:true,force:true});
for(const [file,expected] of expectedArchives){fs.mkdirSync(path.dirname(file),{recursive:true});write(file,expected);}
const pageRoot=path.join(newsRoot,"page");
if(fs.existsSync(pageRoot)){
  for(const entry of fs.readdirSync(pageRoot,{withFileTypes:true})){
    if(entry.isDirectory()&&/^\d+$/.test(entry.name)&&Number(entry.name)>pageCount)fs.rmSync(path.join(pageRoot,entry.name),{recursive:true,force:true});
  }
  if(pageCount===1&&fs.readdirSync(pageRoot).length===0)fs.rmdirSync(pageRoot);
}
for(const [file,expected] of expectedPages){fs.mkdirSync(path.dirname(file),{recursive:true});write(file,expected);}
write(redirectsPath,expectedRedirects);write(sitemapPath,expectedSitemap);write(robotsPath,expectedRobots);
console.log("NEWS GENERATED: "+items.length+" records, "+pageCount+" archive pages, redirects, sitemap and robots.txt");
