import { expect, test } from "@playwright/test";

test.setTimeout(120_000);
// These tests exercise native video playback. A second, screen-recording video
// is unnecessary and makes Windows browser teardown expensive.
test.use({ video: "off" });
test.afterEach(async ({ page }) => {
  if (!page.isClosed()) await page.emulateMedia({ reducedMotion: "reduce" });
});

const openSocial = async (page, options = {}) => {
  if (options.viewport) await page.setViewportSize(options.viewport);
  await page.emulateMedia({ reducedMotion: options.reducedMotion || "no-preference" });
  await page.goto("/");
  const social = page.locator(".home-social");
  await expect(social).toBeAttached({ timeout: 15_000 });
  return social;
};
const showFeed = async (social) => {
  await social.locator(".home-social__feed").evaluate((element) => {
    element.scrollIntoView({ block: "center", behavior: "instant" });
  });
};
const expectPlaying = async (videos) => {
  await expect.poll(() => videos.evaluateAll((elements) => elements.every((video) => (
    !video.paused && video.readyState >= 2 && video.videoWidth === 240 && video.videoHeight === 240
  ))), { timeout: 15_000 }).toBe(true);
};
const expectPaused = async (videos) => {
  await expect.poll(() => videos.evaluateAll((elements) => elements.every((video) => video.paused))).toBe(true);
};

for (const viewport of [
  { name: "desktop", width: 1920, height: 1080, count: 5 },
  { name: "tablet", width: 820, height: 1180, count: 3 },
  { name: "mobile", width: 390, height: 844, count: 3 },
]) {
  test(`square social videos play inline and pause with keyboard: ${viewport.name}`, async ({ page }, testInfo) => {
    test.skip(viewport.name === "mobile"
      ? testInfo.project.name !== "mobile-chromium"
      : testInfo.project.name !== "desktop-chromium", "Use the matching device");
    const social = await openSocial(page, { viewport });
    const cards = social.locator(".home-social__item");
    await expect(cards).toHaveCount(viewport.count);
    await showFeed(social);
    const videos = social.locator("video");
    await expectPlaying(videos);
    const startTime = await videos.first().evaluate((video) => video.currentTime);
    await expect.poll(() => videos.first().evaluate((video) => video.currentTime)).toBeGreaterThan(startTime);
    for (const card of await cards.all()) {
      const box = await card.boundingBox();
      expect(Math.abs(box.width - box.height)).toBeLessThan(1);
      await expect(card.locator("video")).toHaveCSS("object-fit", "cover");
      await expect(card.locator("video")).toHaveAttribute("playsinline", "");
      expect(await card.locator("video").evaluate((video) => video.muted && video.loop)).toBe(true);
    }
    const pause = social.getByRole("button", { name: "Приостановить анимацию публикаций" });
    await pause.focus();
    await pause.press("Space");
    await expectPaused(videos);
    await expect(social.getByRole("button", { name: "Возобновить анимацию публикаций" })).toHaveAttribute("aria-pressed", "true");
    await social.screenshot({
      path: testInfo.outputPath(`social-${viewport.name}.png`),
      style: ".home-header, .home-header * { visibility: hidden !important; }",
    });
    await social.getByRole("button", { name: "Возобновить анимацию публикаций" }).press("Enter");
    await expectPlaying(videos);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    const actions = social.locator(".home-social__actions a");
    await expect(actions).toHaveCount(3);
    await expect(actions.nth(0)).toHaveAttribute("href", "https://t.me/itscstm");
    await expect(actions.nth(1)).toHaveAttribute("href", "https://www.instagram.com/i.tak_soydet");
    await expect(actions.nth(2)).toHaveAttribute("href", "https://vk.com/its.custom");
  });
}

test("videos are lazy, stop offscreen/with a hidden document, and honor a live reduced-motion change", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Check lifecycle once");
  const requests = [];
  page.on("request", (request) => { if (/social-\d{2}-[^/]+\.mp4/.test(request.url())) requests.push(request.url()); });
  const social = await openSocial(page);
  const videos = social.locator("video");
  expect(requests).toHaveLength(0);
  expect(await videos.evaluateAll((elements) => elements.every((video) => !video.getAttribute("src")))).toBe(true);
  await showFeed(social);
  await expectPlaying(videos);
  expect(new Set(requests).size).toBe(5);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expectPaused(videos);
  await showFeed(social);
  await expectPlaying(videos);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expectPaused(videos);
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expectPlaying(videos);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expectPaused(videos);
  await expect(videos.first()).toBeHidden();
  await expect(social.getByRole("button", { name: "Приостановить анимацию публикаций" })).toBeHidden();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expectPlaying(videos);
});

test("reduced motion shows real posters without any MP4 request", async ({ page }) => {
  const requests = [];
  page.on("request", (request) => { if (/social-\d{2}-[^/]+\.mp4/.test(request.url())) requests.push(request.url()); });
  const social = await openSocial(page, { reducedMotion: "reduce" });
  await showFeed(social);
  const posters = social.locator(".home-social__poster");
  await expect.poll(() => posters.evaluateAll((elements) => elements.every((image) => image.complete && image.naturalWidth === 240))).toBe(true);
  expect(requests).toHaveLength(0);
  await expectPaused(social.locator("video"));
  await expect(social.locator(".home-social__motion-toggle")).toBeHidden();
});

test("a failed video or blocked autoplay leaves the poster visible", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Check fallback once");
  await page.route("**/social-01-*.mp4", (route) => route.abort());
  await page.addInitScript(() => {
    const originalPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      if (this.src.includes("social-02-")) return Promise.reject(new DOMException("Autoplay blocked", "NotAllowedError"));
      return originalPlay.call(this);
    };
  });
  const social = await openSocial(page);
  await showFeed(social);
  for (const id of ["social-01", "social-02"]) {
    const card = social.locator(`[data-social-id="${id}"]`);
    await expect(card.locator("video")).toHaveCSS("opacity", "0");
    await expect.poll(() => card.locator("img").evaluate((image) => image.complete && image.naturalWidth === 240)).toBe(true);
  }
  await expectPlaying(social.locator('[data-social-id="social-03"] video'));
});
