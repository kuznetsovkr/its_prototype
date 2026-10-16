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
    !video.paused && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight === video.videoWidth
  ))), { timeout: 15_000 }).toBe(true);
};
const expectPaused = async (videos) => {
  await expect.poll(() => videos.evaluateAll((elements) => elements.every((video) => video.paused))).toBe(true);
};

test("every social clip stays in motion across two complete loops", async ({ page }, testInfo) => {
  const mobile = Boolean(testInfo.project.use.isMobile);
  const social = await openSocial(page, { viewport: mobile
    ? { width: 390, height: 844 } : { width: 1920, height: 1080 } });
  await showFeed(social);
  const videos = social.locator("video");
  await expectPlaying(videos);
  // Sample the decoded image, not just currentTime: the old files kept playing
  // correctly while displaying a frozen final frame for another 9–12 seconds.
  const results = await videos.evaluateAll(async (elements) => {
    const started = performance.now();
    const states = elements.map((video) => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 32;
      return { video, context: canvas.getContext("2d", { willReadFrequently: true }),
        previous: null, lastTime: video.currentTime, loops: 0, lastMotion: started,
        maxStill: 0, paused: false };
    });
    const longestClip = Math.max(...elements.map((video) => video.duration));
    if (!Number.isFinite(longestClip) || longestClip > 7) throw new Error("Untrimmed social clip duration");
    // Observe actual loop boundaries rather than assuming media clocks match
    // wall-clock time exactly in every CI browser's native decoder.
    const deadline = longestClip * 4000 + 2000;
    while (!states.every((state) => state.loops >= 2) && performance.now() - started < deadline) {
      for (const state of states) {
        const { video, context } = state;
        if (video.currentTime < state.lastTime - 0.5) state.loops++;
        state.lastTime = video.currentTime;
        // A native loop seek can briefly report paused at the first frame.
        // The motion-gap assertion still catches a player stuck at that frame.
        state.paused ||= video.paused && video.currentTime >= 0.1;
        context.drawImage(video, 0, 0, 32, 32);
        const pixels = context.getImageData(0, 0, 32, 32).data;
        let difference = 0;
        if (state.previous) {
          for (let index = 0; index < pixels.length; index += 4) {
            difference += Math.abs(pixels[index] - state.previous[index])
              + Math.abs(pixels[index + 1] - state.previous[index + 1])
              + Math.abs(pixels[index + 2] - state.previous[index + 2]);
          }
          if (difference / (32 * 32 * 3) > 0.25) state.lastMotion = performance.now();
          state.maxStill = Math.max(state.maxStill, performance.now() - state.lastMotion);
        }
        state.previous = pixels;
      }
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    return states.map((state) => ({ id: state.video.parentElement.dataset.socialId,
      loops: state.loops, maxStill: state.maxStill, paused: state.paused }));
  });
  await testInfo.attach("social-loop-observations", { body: JSON.stringify(results, null, 2), contentType: "application/json" });
  for (const result of results) {
    expect(result.loops, JSON.stringify(result)).toBeGreaterThanOrEqual(2);
    expect(result.maxStill, JSON.stringify(result)).toBeLessThan(1000);
    expect(result.paused, JSON.stringify(result)).toBe(false);
  }
});

test("loop recovery restarts an unexpected native pause but respects the pause button", async ({ page }) => {
  const social = await openSocial(page);
  await showFeed(social);
  const videos = social.locator("video");
  await expectPlaying(videos);
  const rewind = () => videos.evaluateAll((elements) => elements.forEach((video) => {
    video.pause();
    video.currentTime = 0;
    video.dispatchEvent(new Event("seeking"));
    video.dispatchEvent(new Event("seeked"));
  }));
  await rewind();
  await expectPlaying(videos);
  await expect.poll(() => videos.evaluateAll((elements) => elements.every((video) => video.currentTime > 0.1))).toBe(true);
  await social.getByRole("button", { name: "Приостановить анимацию публикаций" }).click();
  await expectPaused(videos);
  await rewind();
  await expectPaused(videos);
  await expect(social.getByRole("button", { name: "Возобновить анимацию публикаций" })).toHaveAttribute("aria-pressed", "true");
});

for (const viewport of [
  { name: "desktop", width: 1920, height: 1080, count: 5 },
  { name: "tablet", width: 820, height: 1180, count: 3 },
  { name: "mobile", width: 390, height: 844, count: 3 },
]) {
  test(`square social videos play inline and pause with keyboard: ${viewport.name}`, async ({ page }, testInfo) => {
    test.skip(viewport.name === "mobile"
      ? testInfo.project.name !== "mobile-chromium"
      : testInfo.project.name !== "desktop-chromium", "Visual snapshots use Chromium; loop playback is checked in both engines");
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
    await videos.evaluateAll((elements) => elements.forEach((video) => {
      video.currentTime = 0;
      video.dispatchEvent(new Event("seeked"));
    }));
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

test("videos are lazy, stop offscreen/with a hidden document, and honor a live reduced-motion change", async ({ page, browserName }, testInfo) => {
  test.skip(Boolean(testInfo.project.use.isMobile), "Check lifecycle once per engine");
  const requests = [];
  page.on("request", (request) => { if (/social-\d{2}-[^/]+\.mp4/.test(request.url())) requests.push(request.url()); });
  const social = await openSocial(page);
  const videos = social.locator("video");
  expect(requests).toHaveLength(0);
  expect(await videos.evaluateAll((elements) => elements.every((video) => !video.getAttribute("src")))).toBe(true);
  await showFeed(social);
  await expectPlaying(videos);
  expect(await videos.evaluateAll((elements) => new Set(elements.map((video) => video.currentSrc)).size)).toBe(5);
  // WebKit's native media pipeline does not always surface these network events.
  if (browserName !== "webkit") expect(new Set(requests).size).toBe(5);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expectPaused(videos);
  await videos.evaluateAll((elements) => elements.forEach((video) => {
    video.currentTime = 0;
    video.dispatchEvent(new Event("seeked"));
  }));
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
  test.skip(Boolean(testInfo.project.use.isMobile), "Check fallback once per engine");
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
