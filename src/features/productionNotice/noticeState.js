export const ACKNOWLEDGEMENT_KEY = "its.production-notice.seen.v1";
const NOTICE_PATHS = new Set(["/", "/order", "/embroidery", "/recipient"]);

export const isNoticePage = (pathname) => NOTICE_PATHS.has(pathname.replace(/\/$/, "") || "/");
export const readAcknowledgement = (getStorage) => {
  try { return getStorage().getItem(ACKNOWLEDGEMENT_KEY) || ""; } catch { return ""; }
};
export const acknowledgeNotice = (getStorage, version) => {
  try { getStorage().setItem(ACKNOWLEDGEMENT_KEY, version); } catch { /* In-memory acknowledgement still works. */ }
};
export const isCurrentNotice = (notice, now = Date.now()) => Boolean(notice?.enabled && notice.text && notice.version &&
  (!notice.nextChangeAt || Date.parse(notice.nextChangeAt) > now));
