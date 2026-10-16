/* global document, window */
import { expect, test } from "@playwright/test";

test.setTimeout(120_000);

const approvedIds = [
  "tabby-cat", "mark-ii", "black-cat", "ginger-cat", "white-dog", "golden-retriever",
  "corgi-football", "corgi-pair", "merle-dog", "skyline", "black-dog-green", "chaser",
  "doberman", "shiba", "spaniel", "two-dogs", "volga", "black-dog-purple",
];
// Clean image-node exports supplied with the designer's October feedback.
// Raw embedded uploads have different proportions and must not replace these.
const repairedSizes = {
  "tabby-cat": { photo: [700, 700] },
  "mark-ii": { work: [700, 700] },
  "black-cat": { work: [700, 700] },
  "golden-retriever": { work: [700, 344] },
  "black-dog-green": { work: [700, 700] },
  "doberman": { work: [700, 700] },
};
const expectRepairedImage = async (button, id, kind) => {
  if (!repairedSizes[id]?.[kind]) return;
  const image = button.locator(`.home-work-card__image--${kind === "photo" ? "original" : "work"}`);
  expect(await image.evaluate(el => [el.naturalWidth, el.naturalHeight]), `${id} ${kind} uses the approved export`)
    .toEqual(repairedSizes[id][kind]);
  await expect(image).toHaveCSS("object-fit", "cover");
};
const openGallery = async (page, viewport) => {
  if (viewport) await page.setViewportSize(viewport);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const works = page.locator(".home-works");
  await works.locator(".home-works__more").click();
  await expect(works.locator(".home-work-card")).toHaveCount(18);
  return works;
};

const expectOriginal = async (button, id) => {
  await expect(button).toHaveClass(/is-showing-original/);
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await expect(button).toHaveAttribute("aria-busy", "false");
  const original = button.locator(".home-work-card__image--original");
  await expect(original).toHaveCSS("opacity", "1");
  await expect(original).toHaveCSS("object-fit", "cover");
  await expect(original).toHaveAttribute("src", new RegExp(`${id}-photo-[^/]+\\.webp$`));
  expect(await original.evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
};
const expectWork = async (button, id) => {
  await expect(button).not.toHaveClass(/is-showing-original/);
  await expect(button).toHaveAttribute("aria-pressed", "false");
  const work = button.locator(".home-work-card__image--work");
  await expect(work).toHaveCSS("opacity", "1");
  await expect(work).toHaveCSS("object-fit", "cover");
  await expect(work).toHaveAttribute("src", new RegExp(`${id}-work-[^/]+\\.webp$`));
};

for (const viewport of [
  { name: "desktop", width: 1920, height: 1080 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`all 18 approved pairs switch without empty images: ${viewport.name}`, async ({ page }, testInfo) => {
    test.skip(
      viewport.name === "mobile"
        ? testInfo.project.name !== "mobile-chromium"
        : testInfo.project.name !== "desktop-chromium",
      "Check each interaction in the matching device mode",
    );
    const works = await openGallery(page, viewport);
    const buttons = works.locator(".home-work-card");
    const ids = await buttons.evaluateAll((elements) => elements.map((element) => element.dataset.workId));
    expect(new Set(ids)).toEqual(new Set(approvedIds));

    for (const id of ids) {
      const button = works.locator(`[data-work-id="${id}"]`);
      await button.scrollIntoViewIfNeeded();
      await expect.poll(() => button.locator(".home-work-card__image--work")
        .evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
      await expectRepairedImage(button, id, "work");
      if (viewport.name === "mobile") {
        await button.tap();
      } else {
        await button.hover();
      }
      await expectOriginal(button, id);
      await expectRepairedImage(button, id, "photo");
      const fits = await button.evaluate((element) => {
        const card = element.getBoundingClientRect();
        const original = element.querySelector(".home-work-card__image--original").getBoundingClientRect();
        return original.left <= card.left + 1 && original.top <= card.top + 1
          && original.right >= card.right - 1 && original.bottom >= card.bottom - 1;
      });
      expect(fits, `${id} photo covers its slot`).toBe(true);
      if (viewport.name === "mobile") {
        await button.tap();
      } else {
        await page.mouse.move(0, 0);
      }
      await expectWork(button, id);
    }

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    await buttons.evaluateAll((elements) => {
      for (const element of elements) {
        element.querySelector(".home-work-card__image--work").style.opacity = "1";
        element.querySelector(".home-work-card__image--original").style.opacity = "0";
      }
    });
    await buttons.locator(".home-work-card__image--work").evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
    await works.screenshot({
      path: testInfo.outputPath(`works-${viewport.name}.png`),
      style: ".home-header, .home-header * { visibility: hidden !important; }",
    });
    // Visual-only contact sheet of the already-loaded original images, to
    // compare all design slots at once. This doesn't change application state.
    await buttons.evaluateAll((elements) => {
      for (const element of elements) {
        element.querySelector(".home-work-card__image--work").style.opacity = "0";
        element.querySelector(".home-work-card__image--original").style.opacity = "1";
      }
    });
    await buttons.locator(".home-work-card__image--original").evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
    await works.screenshot({
      path: testInfo.outputPath(`photos-${viewport.name}.png`),
      style: ".home-header, .home-header * { visibility: hidden !important; }",
    });
    await buttons.locator("img").evaluateAll((images) => images.forEach((image) => { image.style.opacity = ""; }));
    await works.locator(".home-works__more").click();
    await expect(buttons).toHaveCount(viewport.name === "mobile" ? 6 : 9);
  });
}

test("original photos aren't downloaded before interaction and hovering doesn't reload the cached photo", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Check network behavior once");
  const requested = [];
  page.on("request", (request) => {
    if (approvedIds.some((id) => request.url().includes(`/${id}-photo-`))) requested.push(request.url());
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.mouse.move(0, 0);
  const works = page.locator(".home-works");
  // Native clicking the reveal button can leave the mouse over a newly-added
  // card; that is a legitimate hover, not an upfront request. Expand without
  // moving the pointer for this specific network assertion.
  await works.locator(".home-works__more").evaluate((button) => button.click());
  await expect(works.locator(".home-work-card")).toHaveCount(18);
  await expect(works.locator(".home-work-card__image--original")).toHaveCount(0);
  expect(requested).toHaveLength(0);
  const button = works.locator('[data-work-id="tabby-cat"]');
  await button.hover();
  await expectOriginal(button, "tabby-cat");
  expect(requested).toHaveLength(1);
  await page.mouse.move(0, 0);
  await expectWork(button, "tabby-cat");
  await button.hover();
  await expectOriginal(button, "tabby-cat");
  expect(requested).toHaveLength(1);
});

test("keyboard Enter, Space, Escape and blur control the comparison", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Check native keyboard behavior once");
  const works = await openGallery(page);
  await page.mouse.move(0, 0);
  const button = works.locator('[data-work-id="tabby-cat"]');
  await button.focus();
  await expect(button).toBeFocused();
  await expectWork(button, "tabby-cat");
  await page.keyboard.press("Enter");
  await expectOriginal(button, "tabby-cat");
  await page.keyboard.press("Space");
  await expectWork(button, "tabby-cat");
  await page.keyboard.press("Enter");
  await expectOriginal(button, "tabby-cat");
  await page.keyboard.press("Escape");
  await expectWork(button, "tabby-cat");
  await page.keyboard.press("Space");
  await expectOriginal(button, "tabby-cat");
  await page.keyboard.press("Tab");
  await expectWork(button, "tabby-cat");
  await expect(works.locator('[data-work-id="mark-ii"]')).toBeFocused();
});

test("an original-photo error keeps the work visible and can be retried", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Check image failure once");
  let fail = true;
  await page.route("**/tabby-cat-photo-*.webp", (route) => fail ? route.abort("failed") : route.continue());
  const works = await openGallery(page);
  const button = works.locator('[data-work-id="tabby-cat"]');
  await button.hover();
  await expect(button.getByRole("status")).toContainText("Не удалось загрузить исходное фото");
  await expectWork(button, "tabby-cat");
  fail = false;
  await page.mouse.move(0, 0);
  await button.hover();
  await expectOriginal(button, "tabby-cat");
});

test("a slow original-photo response doesn't hide the finished work", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Check delayed image response once");
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  await page.route("**/tabby-cat-photo-*.webp", async (route) => {
    await gate;
    await route.continue();
  });
  const works = await openGallery(page);
  const button = works.locator('[data-work-id="tabby-cat"]');
  try {
    await button.hover();
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(button).not.toHaveClass(/is-showing-original/);
    await expect(button.locator(".home-work-card__image--work")).toHaveCSS("opacity", "1");
    release();
    await expectOriginal(button, "tabby-cat");
  } finally {
    release();
  }
});

test("the expanded mobile gallery fits its surface after rotation and at breakpoint boundaries", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Check the full width matrix once");
  const works = await openGallery(page);
  for (const width of [320, 639, 640, 1199, 1200, 2560]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(works.locator(".home-work-card")).toHaveCount(18);
    const fits = await works.evaluate((section) => {
      const surface = section.querySelector(".home-works__surface").getBoundingClientRect();
      const gallery = section.querySelector(".home-works__grid").getBoundingClientRect();
      const actions = section.querySelector(".home-works__actions").getBoundingClientRect();
      return gallery.left >= surface.left - 1 && gallery.right <= surface.right + 1
        && gallery.bottom <= actions.top + 1 && actions.bottom <= surface.bottom + 1;
    });
    expect(fits, `expanded gallery fits at ${width}px`).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
});

test("a mobile scroll gesture over a work doesn't toggle its image", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Use actual touch events");
  const works = await openGallery(page, { width: 390, height: 844 });
  const button = works.locator('[data-work-id="tabby-cat"]');
  await button.scrollIntoViewIfNeeded();
  const box = await button.boundingBox();
  const before = await page.evaluate(() => window.scrollY);
  const session = await page.context().newCDPSession(page);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let step = 1; step <= 6; step += 1) {
    await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y - step * 25 }] });
  }
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await session.detach();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before + 40);
  await expectWork(button, "tabby-cat");
});
