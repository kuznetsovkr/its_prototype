import { isCartId } from "./cartStorage";

export const CONSTRUCTOR_DRAFT_KEY = "its_constructor_draft_v1";
export const CONSTRUCTOR_DRAFT_TTL = 30 * 24 * 60 * 60 * 1000;
const conflictMessage = "Черновик изменён в другой вкладке. Автосохранение здесь приостановлено, чтобы не затереть изменения. Откройте оформление заново в новой вкладке.";
const storageMessage = "Не удалось сохранить черновик в браузере. Не закрывайте страницу, если хотите продолжить оформление; проверьте настройки хранения данных сайта.";
const text = (value, max) => typeof value === "string" ? value.slice(0, max) : "";
const count = (value, max) => Number.isInteger(value) && value >= 1 && value <= max ? value : 1;

// Explicit allowlist: no contacts, certificate codes, order tokens, prices,
// catalogue profiles, image bytes, blob URLs or server cart capabilities.
export const constructorSnapshot = (order, missingFiles = []) => {
  const clothing = order?.clothing;
  const selection = { type: text(clothing?.type, 120).trim(), color: text(clothing?.color, 120).trim(), size: text(clothing?.size, 30).trim() };
  if (!isCartId(order?.cartItemKey) || !selection.type || !selection.color || !selection.size) return null;
  const embroidery = order.embroidery || {};
  const type = ["Patronus", "Car", "petFace", "custom"].includes(embroidery.type) && embroidery.typeSelectionExplicit
    ? embroidery.type : "";
  const files = embroidery.uploadedImage?.length ? embroidery.uploadedImage : missingFiles;
  return {
    cartItemKey: order.cartItemKey,
    clothing: selection,
    embroidery: { type, typeSelectionExplicit: Boolean(type), customText: text(embroidery.customText, 2500),
      customTextFont: text(embroidery.customTextFont, 80) || "Arial", comment: text(embroidery.comment, 2500),
      patronusCount: count(embroidery.patronusCount, 4), petFaceCount: count(embroidery.petFaceCount, 5),
      customOption: { image: embroidery.customOption?.image === true, text: embroidery.customOption?.text === true } },
    uploadFiles: (Array.isArray(files) ? files : []).slice(0, 10).map((file) => ({
      name: text(file?.name, 255), size: Number.isSafeInteger(file?.size) && file.size >= 0 ? file.size : 0,
      lastModified: Number.isSafeInteger(file?.lastModified) && file.lastModified >= 0 ? file.lastModified : 0,
    })).filter((file) => file.name),
  };
};

export const createConstructorDraftStore = ({ storage, now = Date.now, newId = () => crypto.randomUUID() }) => {
  const read = () => {
    const raw = storage?.getItem(CONSTRUCTOR_DRAFT_KEY);
    if (!raw || raw.length > 25_000) return null;
    try {
      const record = JSON.parse(raw);
      if (record.version !== 1 || !isCartId(record.revision) || !Number.isSafeInteger(record.updatedAt)
        || record.updatedAt < 0 || record.expiresAt !== record.updatedAt + CONSTRUCTOR_DRAFT_TTL) return null;
      return { ...record, draft: record.draft ? constructorSnapshot(record.draft, record.draft.uploadFiles) : null };
    } catch { return null; }
  };
  let initial;
  try { initial = read(); } catch { initial = null; }
  let revision = initial?.revision || null;
  const draft = initial && initial.expiresAt > now() ? initial.draft : null;
  return {
    initialDraft: draft,
    initialExpired: Boolean(initial?.draft && initial.expiresAt <= now()),
    getRevision: () => revision,
    checkConflict: () => { try { return (read()?.revision || null) !== revision ? conflictMessage : ""; } catch { return storageMessage; } },
    save(order, missingFiles = []) {
      const next = order?.recipient?.savedOrder ? null : constructorSnapshot(order, missingFiles);
      try {
        const current = read();
        if ((current?.revision || null) !== revision) return { error: conflictMessage };
        if (!next && !current?.draft) return { error: "" };
        if (current && JSON.stringify(current.draft) === JSON.stringify(next)) return { error: "" };
        if (!storage) return { error: next ? storageMessage : "" };
        const updatedAt = now();
        const record = { version: 1, revision: newId(), updatedAt, expiresAt: updatedAt + CONSTRUCTOR_DRAFT_TTL, draft: next };
        // Keep a small tombstone after completion/removal: another open tab must
        // not resurrect the completed item from its stale in-memory state.
        storage.setItem(CONSTRUCTOR_DRAFT_KEY, JSON.stringify(record));
        revision = record.revision;
        return { error: "" };
      } catch { return { error: storageMessage }; }
    },
  };
};
