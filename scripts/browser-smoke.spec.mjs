import { test, expect } from "playwright/test";

const BASE = "http://127.0.0.1:4173";
const matrix = [
  {name:"desktop", width:1440, height:900, menu:false},
  {name:"laptop", width:1280, height:800, menu:false},
  {name:"tablet portrait", width:820, height:1180, menu:true},
  {name:"tablet landscape", width:1024, height:768, menu:true, tabletLandscape:true},
  {name:"mobile", width:390, height:844, menu:true},
  {name:"mobile landscape", width:844, height:390, menu:true, mobileLandscape:true},
  {name:"small mobile", width:360, height:800, menu:true},
  {name:"large mobile", width:412, height:915, menu:true}
];

test("homepage responsive and navigation smoke matrix", async ({browser}) => {
  test.setTimeout(90000);
  for (const device of matrix) {
    const context = await browser.newContext({viewport:{width:device.width,height:device.height}});
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    page.on("console", message => { if (message.type() === "error") pageErrors.push(message.text()); });

    await page.goto(BASE + "/", {waitUntil:"networkidle"});
    await expect(page.locator("main#top")).toBeVisible();
    await expect(page.locator("main#top > section")).toHaveCount(8);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href","https://montpets.com/");
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content","梦宠数智｜宠物全生命周期大数据认证平台");
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content","summary_large_image");
    const organization = await page.locator('script[type="application/ld+json"]').evaluate(el => JSON.parse(el.textContent));
    expect(organization["@type"]).toBe("Organization");
    expect(organization.name).toBe("辽宁梦宠数智科技有限公司");
    await expect(page.locator(".contact-action")).toHaveAttribute("href","https://weixin.qq.com/r/mp/CSDF3RDEkE3vrVS_93Ub");
    await expect(page.locator("body")).not.toContainText("唯一官方授权");
    await expect(page.locator("body")).not.toContainText("国家级数字基础设施");
    await expect(page.locator("#about")).toContainText("一宠一芯一档一码");
    await expect(page.locator("#ability")).toContainText("一宠一芯一档一码");
    const heroMediaContract = await page.locator(".hero-image-frame img").evaluate(async img => {
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d", {willReadFrequently:true});
      ctx.drawImage(img, 0, 0);
      const rgba = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let nonBlank = 0, alphaNonZero = 0;
      for (let i=0;i<rgba.length;i+=4) {
        if (rgba[i] || rgba[i+1] || rgba[i+2]) nonBlank++;
        if (rgba[i+3]) alphaNonZero++;
      }
      return {naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,complete:img.complete,nonBlank,alphaNonZero,total:canvas.width*canvas.height};
    });
    expect(heroMediaContract.complete, device.name + " Hero loaded").toBeTruthy();
    expect(heroMediaContract.naturalWidth, device.name + " Hero natural width").toBe(1256);
    expect(heroMediaContract.naturalHeight, device.name + " Hero natural height").toBe(471);
    expect(heroMediaContract.nonBlank, device.name + " Hero decoded pixels").toBeGreaterThan(heroMediaContract.total * 0.05);
    expect(heroMediaContract.alphaNonZero, device.name + " Hero opaque pixels").toBe(heroMediaContract.total);
    expect(await page.locator(".hero-image-frame img").getAttribute("src"), device.name + " Hero PNG source").toContain("hero.png?v=20261008-r162");
    const heroMetrics = await page.locator(".hero-media").evaluate(media => {
      const frame = media.querySelector(".hero-image-frame");
      const img = media.querySelector(".hero-image-frame img");
      const mediaRect = media.getBoundingClientRect();
      const frameRect = frame.getBoundingClientRect();
      const imgRect = img.getBoundingClientRect();
      return {
        mediaWidth: mediaRect.width,
        frameWidth: frameRect.width,
        imgWidth: imgRect.width,
        imgHeight: imgRect.height,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight
      };
    });
    expect(heroMetrics.naturalWidth, device.name + " Hero natural width").toBe(1256);
    expect(heroMetrics.naturalHeight, device.name + " Hero natural height").toBe(471);
    expect(heroMetrics.frameWidth / heroMetrics.mediaWidth, device.name + " Hero frame occupancy").toBeGreaterThanOrEqual(0.98);
    expect(heroMetrics.imgWidth / heroMetrics.frameWidth, device.name + " Hero image occupancy").toBeGreaterThanOrEqual(0.95);
    const naturalRatio = heroMetrics.naturalWidth / heroMetrics.naturalHeight;
    const renderedRatio = heroMetrics.imgWidth / heroMetrics.imgHeight;
    expect(Math.abs(renderedRatio - naturalRatio), device.name + " Hero image crop ratio").toBeLessThanOrEqual(0.03);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, device.name + " horizontal overflow").toBeLessThanOrEqual(1);

    if (device.menu) {
      const toggle = page.locator(".nav-menu-toggle");
      const menu = page.locator("#site-menu");
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await expect(menu).toHaveClass(/is-open/);
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe("hidden");
      await page.keyboard.press("Escape");
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      expect(await page.evaluate(() => document.activeElement?.matches(".nav-menu-toggle"))).toBeTruthy();
    }

    const mediaLink = device.menu ? page.locator('.nav-menu .menu-media-link') : page.locator('.nav-links .nav-media-link');
    if (device.menu) {
      await page.locator(".nav-menu-toggle").click();
      await expect(page.locator("#site-menu")).toHaveClass(/is-open/);
    }
    await expect(mediaLink, device.name + " media navigation visibility").toBeVisible();
    await expect(mediaLink, device.name + " media navigation destination").toHaveAttribute("href", "/news/");
    await mediaLink.click();
    await expect(page).toHaveURL(BASE + "/news/");
    await expect(page.locator("h1")).toHaveText("媒体报道");
    await page.goto(BASE + "/", {waitUntil:"networkidle"});

    const aboutLink = device.menu ? page.locator('.nav-menu [data-nav-id="about"]') : page.locator('.nav-links [data-nav-id="about"]');
    if (device.menu) {
      await page.locator(".nav-menu-toggle").click();
      await expect(page.locator("#site-menu")).toHaveClass(/is-open/);
    }
    await aboutLink.click();
    await expect(page).toHaveURL(/#about$/);
    const aboutTop = await page.locator("#about-anchor").evaluate(el => el.getBoundingClientRect().top);
    const expectedOffset = await page.locator(".site-header").evaluate(el => el.getBoundingClientRect().height + 12);
    expect(Math.abs(aboutTop - expectedOffset), device.name + " about anchor/header offset").toBeLessThanOrEqual(8);

    const positionLink = device.menu ? page.locator('.nav-menu [data-nav-id="position"]') : page.locator('.nav-links [data-nav-id="position"]');
    if (device.menu) {
      await page.locator(".nav-menu-toggle").click();
      await expect(page.locator("#site-menu")).toHaveClass(/is-open/);
    }
    await positionLink.click();
    await expect(page).toHaveURL(/#position$/);
    if (!device.menu) {
      const back = page.waitForURL(/#about$/, {timeout:3000});
      await page.evaluate(() => history.back());
      await back;
      expect(await page.locator('[data-nav-id="about"].is-active').count()).toBeGreaterThan(0);
    }
    await page.goto(BASE + "/", {waitUntil:"networkidle"});
    await expect(page).toHaveURL(BASE + "/");
    expect(await page.locator("[data-nav-id].is-active").count()).toBe(0);

    if (device.tabletLandscape) {
      const columns = await page.locator(".hero-grid").evaluate(el => getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length);
      expect(columns, "tablet landscape Hero columns").toBe(2);
    }
    if (device.mobileLandscape) {
      const fontSize = await page.locator(".hero-lead").evaluate(el => parseFloat(getComputedStyle(el).fontSize));
      expect(fontSize, "mobile landscape Hero lead font size").toBeGreaterThanOrEqual(14);
    }

    expect(pageErrors, device.name + " browser errors").toEqual([]);
    await context.close();
  }
});

test("404 is styled and accessible", async ({page}) => {
  await page.goto(BASE + "/404.html", {waitUntil:"networkidle"});
  await expect(page.locator(".error-card")).toBeVisible();
  await expect(page.locator("h1")).toHaveText("这条路还没有内容");
  await expect(page.locator(".error-logo img")).toHaveAttribute("src", "/assets/brand/brand.svg?v=20261006-r150");
});


test("media homepage limit and archive pagination", async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto(BASE + "/", {waitUntil:"networkidle"});
  await expect(page.locator(".media-card")).toHaveCount(6);
  const allMedia = page.locator(".media-more-link");
  await expect(allMedia).toBeVisible();
  await expect(allMedia).toHaveAttribute("href","/news/");

  await page.goto(BASE + "/news/", {waitUntil:"networkidle"});
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href","https://montpets.com/news/");
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content","website");
  await expect(page.locator(".news-list-card")).toHaveCount(6);
  await expect(page.locator(".news-list-card h2").first()).toContainText("宠物险悄悄涨价，谁在收割养宠人？");
  await expect(page.locator(".news-pagination [aria-current='page']")).toHaveText("1");
  const next = page.locator(".news-pagination a[rel='next']");
  await expect(next).toHaveAttribute("href","/news/page/2/");
  await next.click();
  await expect(page).toHaveURL(BASE + "/news/page/2/");
  await expect(page.locator(".news-list-card")).toHaveCount(4);
  await expect(page.locator(".news-pagination [aria-current='page']")).toHaveText("2");
  await expect(page.locator(".news-pagination a[rel='prev']")).toHaveAttribute("href","/news/");
  await expect(page.locator("h2").first()).toContainText("一只宠物凭什么要有");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow,"mobile archive pagination horizontal overflow").toBeLessThanOrEqual(1);
});


test("audience choices lead to the matching service details", async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto(BASE + "/", {waitUntil:"networkidle"});
  await expect(page.locator('.nav-links [data-nav-id="about"]')).toHaveText("企业简介");
  await expect(page.locator('.nav-menu [data-nav-id="about"] b')).toHaveText("企业简介");
  await expect(page.locator('.footer-nav a[href="#about"]')).toHaveText("企业简介");
  const audience = page.locator(".audience-entry");
  await expect(audience).toBeVisible();
  const style = await audience.evaluate(el => {
    const computed = getComputedStyle(el);
    return {color:computed.color,backgroundColor:computed.backgroundColor,backgroundImage:computed.backgroundImage,kickerColor:getComputedStyle(el.querySelector(".audience-kicker")).color,numberColor:getComputedStyle(el.querySelector(".audience-grid span")).color};
  });
  expect(style.color).toBe("rgb(73, 55, 42)");
  expect(style.backgroundImage).toContain("linear-gradient");
  expect(style.backgroundColor).not.toBe("rgb(32, 26, 22)");
  expect(style.kickerColor).toBe("rgb(161, 78, 29)");
  expect(style.numberColor).toBe("rgb(128, 96, 71)");

  const destinations = [
    ["繁育企业","#service-breeding"],
    ["销售服务企业","#service-sales"],
    ["食品用品企业","#service-food"],
    ["保险、运输企业","#service-insurance"],
    ["医疗、美容、养护、服装等企业","#service-medical"],
    ["面向监管机构","#service-regulatory"],
    ["面向养宠人","#service-pet-owners"]
  ];
  await expect(page.locator(".audience-grid a")).toHaveCount(destinations.length);
  for (let index=0;index<destinations.length;index++) {
    const [label,target] = destinations[index];
    const link = page.locator(".audience-grid a").nth(index);
    await expect(link).toContainText(label);
    await expect(link).toHaveAttribute("href",target);
    await expect(page.locator(target)).toHaveCount(1);
    await link.click();
    await expect(page).toHaveURL(new RegExp(target.replace("#","\\#")+"$"));
    await expect(page.locator(target)).toBeVisible();
  }

  await page.goto(BASE + "/", {waitUntil:"networkidle"});
  await expect(page.locator(".hero-actions .btn-primary")).toHaveText("合作咨询");
  await expect(page.locator(".hero-actions .btn-primary")).toHaveAttribute("href","#contact");
  await expect(page.locator(".hero-actions .btn-secondary")).toHaveText("查看平台能力");
  await expect(page.locator(".hero-actions .btn-secondary")).toHaveAttribute("href","#ability");
});


test("editorial homepage hierarchy across desktop, tablet and mobile", async ({browser}) => {
  const viewports = [
    {name:"desktop",width:1440,height:900,columns:2},
    {name:"tablet",width:820,height:1180,columns:2},
    {name:"mobile",width:390,height:844,columns:1}
  ];
  for (const viewport of viewports) {
    const context = await browser.newContext({viewport:{width:viewport.width,height:viewport.height}});
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(BASE + "/", {waitUntil:"networkidle"});
    await expect(page.locator('link[href*="editorial-refinement.css"]')).toHaveCount(1);
    await expect(page.locator(".feature-card")).toHaveCount(6);
    await expect(page.locator(".value-card")).toHaveCount(6);
    await expect(page.locator(".ability-card")).toHaveCount(4);
    await expect(page.locator(".media-card")).toHaveCount(6);
    const metrics = await page.evaluate(() => {
      const columns = selector => getComputedStyle(document.querySelector(selector)).gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length;
      const style = selector => {
        const el = document.querySelector(selector);
        const css = getComputedStyle(el);
        return {
          radius:css.borderRadius,
          shadow:css.boxShadow,
          background:css.backgroundColor,
          borderTop:css.borderTopWidth,
          borderBottom:css.borderBottomWidth
        };
      };
      return {
        featureColumns:columns(".feature-grid"),
        valueColumns:columns(".value-grid"),
        abilityColumns:columns("#ability .ability-stack"),
        feature:style(".feature-card"),
        value:style(".value-card"),
        ability:style(".ability-card"),
        media:style(".media-card"),
        heroOrbit:style(".hero-orbit")
      };
    });
    expect(metrics.featureColumns, viewport.name + " feature columns").toBe(viewport.columns);
    expect(metrics.valueColumns, viewport.name + " value columns").toBe(viewport.columns);
    expect(metrics.abilityColumns, viewport.name + " capability columns").toBe(viewport.columns);
    for (const selector of ["feature","value","ability","media"]) {
      expect(metrics[selector].radius, viewport.name + " " + selector + " card radius").toBe("0px");
      expect(metrics[selector].shadow, viewport.name + " " + selector + " card shadow").toBe("none");
    }
    expect(metrics.feature.borderTop, viewport.name + " feature top border").toBe("0px");
    expect(metrics.feature.borderBottom, viewport.name + " feature editorial rule").toBe("1px");
    expect(metrics.value.borderTop, viewport.name + " value top border").toBe("0px");
    expect(metrics.value.borderBottom, viewport.name + " value editorial rule").toBe("1px");
    await expect(page.locator(".media-title").first()).toHaveText("宠物险悄悄涨价，谁在收割养宠人？");
    await expect(page.locator("#contact")).toContainText("共建宠物数字化服务生态网络");
    expect(errors, viewport.name + " page errors").toEqual([]);
    await context.close();
  }
});
