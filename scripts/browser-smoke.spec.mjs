import { test, expect } from "playwright/test";

const BASE = "http://127.0.0.1:4173";
const matrix = [
  {name:"desktop", width:1440, height:900, menu:false},
  {name:"laptop", width:1280, height:800, menu:false},
  {name:"tablet portrait", width:820, height:1180, menu:true},
  {name:"tablet landscape", width:1024, height:768, menu:true, tabletLandscape:true},
  {name:"mobile", width:390, height:844, menu:true},
  {name:"mobile landscape", width:844, height:390, menu:true, mobileLandscape:true},
  {name:"small mobile", width:360, height:800, menu:true}
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
    await page.goBack();
    await page.waitForTimeout(50);
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
