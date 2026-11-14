import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import api from "../../api";
import { isCurrentNotice } from "./noticeState";

const NoticeContext = createContext({ notice: null, refresh: () => {} });

export const ProductionNoticeProvider = ({ children }) => {
  const [notice, setNotice] = useState(null);
  const requestRef = useRef(null);
  const refresh = useCallback(async () => {
    if (requestRef.current) return;
    const controller = new AbortController();
    requestRef.current = controller;
    try {
      const { data } = await api.get("/production-notice", { signal: controller.signal });
      if (!controller.signal.aborted) setNotice(isCurrentNotice(data) ? data : null);
    } catch {
      // Don't replace server data with guessed dates when the API is unavailable.
      if (!controller.signal.aborted) setNotice(null);
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
    }
  }, []);

  useEffect(() => {
    refresh();
    const recheck = () => { if (document.visibilityState === "visible") refresh(); };
    const timer = window.setInterval(recheck, 60_000);
    window.addEventListener("focus", recheck);
    document.addEventListener("visibilitychange", recheck);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", recheck);
      document.removeEventListener("visibilitychange", recheck);
      requestRef.current?.abort();
      requestRef.current = null;
    };
  }, [refresh]);

  useEffect(() => {
    if (!notice?.nextChangeAt) return undefined;
    const delay = Math.max(0, Date.parse(notice.nextChangeAt) - Date.now());
    // Auto periods are at most 17 days long, below the browser's timer limit.
    const timer = window.setTimeout(() => { setNotice(null); refresh(); }, delay);
    return () => window.clearTimeout(timer);
  }, [notice, refresh]);

  return <NoticeContext.Provider value={{ notice, refresh }}>{children}</NoticeContext.Provider>;
};

export const useProductionNotice = () => useContext(NoticeContext);
