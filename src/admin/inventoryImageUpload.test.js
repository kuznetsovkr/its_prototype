import { beforeEach, expect, test, vi } from "vitest";
import api from "../api";
import { uploadInventoryImage, INVENTORY_UPLOAD_TIMEOUT_MS } from "./inventoryImageUpload";

vi.mock("../api", () => ({ default: { post: vi.fn() } }));
beforeEach(() => vi.resetAllMocks());
const photo = () => new File([new Uint8Array([1, 2, 3])], "clothing.png", { type: "image/png" });

test("warehouse photos use a dedicated timeout rather than the generic 10 seconds", async () => {
  api.post.mockResolvedValue({ data: { imageUrl: "/api/uploads/inventory/clothing.png" } });
  expect(await uploadInventoryImage(photo())).toBe("/api/uploads/inventory/clothing.png");
  const [path, data, config] = api.post.mock.calls[0];
  expect(path).toBe("/upload");
  expect(data.get("image").name).toBe("clothing.png");
  expect(config.timeout).toBe(INVENTORY_UPLOAD_TIMEOUT_MS);
  expect(config.timeout).toBe(120_000);
});

test("invalid, empty and oversized files are rejected before network calls", async () => {
  for (const file of [new File(["svg"], "image.svg", { type: "image/svg+xml" }),
    new File([], "empty.png", { type: "image/png" }),
    new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", { type: "image/png" })]) {
    await expect(uploadInventoryImage(file)).rejects.toThrow();
  }
  expect(api.post).not.toHaveBeenCalled();
});

test("server upload errors remain visible and an incomplete response is never treated as success", async () => {
  api.post.mockRejectedValueOnce(new Error("Достигнут лимит загрузки фотографий"));
  await expect(uploadInventoryImage(photo())).rejects.toThrow("Достигнут лимит");
  api.post.mockRejectedValueOnce(new Error("timeout of 120000ms exceeded"));
  await expect(uploadInventoryImage(photo())).rejects.toThrow("Проверьте соединение");
  for (const imageUrl of [undefined, "", "https://foreign.example/photo.png"]) {
    api.post.mockResolvedValueOnce({ data: { imageUrl } });
    await expect(uploadInventoryImage(photo())).rejects.toThrow("не подтвердил загрузку");
  }
});
