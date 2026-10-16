import { readFileSync } from "node:fs";
import { Buffer } from "node:buffer";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { homeAssets } from "../../images/home";
import { homeSocialItems, compactSocialItems } from "../../data/homeSocial";
import { socialLinks } from "../../data/homeContent";
import SocialSection from "./SocialSection";

vi.mock("./useScrollZoom", () => ({ default: () => null }));

describe("approved social animations", () => {
  it("contains five distinct silent MP4 files with fast-start metadata and WebP posters", () => {
    expect(homeSocialItems).toHaveLength(5);
    expect(new Set(homeSocialItems.map((item) => item.id)).size).toBe(5);
    let totalBytes = 0;
    for (const item of homeSocialItems) {
      expect(item.label).toBeTruthy();
      const video = readFileSync(new URL(`../../images/home/social/${item.id}.mp4`, import.meta.url));
      const poster = readFileSync(new URL(`../../images/home/social/${item.id}-poster.webp`, import.meta.url));
      expect(video.toString("ascii", 4, 8)).toBe("ftyp");
      const metadataOffset = video.readUInt32BE(0);
      expect(video.toString("ascii", metadataOffset + 4, metadataOffset + 8)).toBe("moov");
      expect(video.includes(Buffer.from("soun"))).toBe(false);
      expect(poster.subarray(0, 4).toString()).toBe("RIFF");
      expect(poster.subarray(8, 12).toString()).toBe("WEBP");
      totalBytes += video.length + poster.length;
    }
    expect(totalBytes).toBeLessThan(1_500_000);
  });

  it("preserves five desktop tiles and the same three compact tiles", () => {
    expect(homeAssets.desktop.social.items).toEqual(homeSocialItems);
    expect(compactSocialItems.map((item) => item.id)).toEqual(["social-02", "social-03", "social-04"]);
    expect(homeAssets.tablet.social.items).toEqual(compactSocialItems);
    expect(homeAssets.mobile.social.items).toEqual(compactSocialItems);
  });

  it("ends each loop with the moving clip instead of the source's frozen 15-second tail", () => {
    const durationBounds = [[6.1, 6.3], [4.5, 4.6], [4.0, 4.3], [3.0, 3.2], [4.0, 4.2]];
    for (const [index, item] of homeSocialItems.entries()) {
      const video = readFileSync(new URL(`../../images/home/social/${item.id}.mp4`, import.meta.url));
      const moov = video.readUInt32BE(0);
      const header = video.indexOf(Buffer.from("mvhd"), moov + 8);
      expect(header).toBeGreaterThan(moov);
      expect(video[header + 4]).toBe(0); // Version 0 movie header in these assets.
      const duration = video.readUInt32BE(header + 20) / video.readUInt32BE(header + 16);
      expect(duration, item.id).toBeGreaterThanOrEqual(durationBounds[index][0]);
      expect(duration, item.id).toBeLessThanOrEqual(durationBounds[index][1]);
    }
  });

  it.each(["desktop", "tablet", "mobile"])("renders posters without requesting video on initial %s render", (breakpoint) => {
    const items = homeAssets[breakpoint].social.items;
    const html = renderToStaticMarkup(<SocialSection items={items} />);
    expect(html.match(/<video /g)).toHaveLength(items.length);
    expect(html.match(/playsinline=""/g)).toHaveLength(items.length);
    expect(html.match(/preload="none"/g)).toHaveLength(items.length);
    expect(html.match(/loop=""/g)).toHaveLength(items.length);
    expect(html).not.toContain("autoplay=");
    expect(html).toContain("Приостановить анимацию публикаций");
    for (const item of items) {
      expect(html).toContain(`src="${item.poster}"`);
      expect(html).not.toContain(`src="${item.src}"`);
      expect(html).toContain(`aria-label="${item.label}"`);
    }
    for (const href of Object.values(socialLinks)) expect(html).toContain(`href="${href}"`);
  });
});
