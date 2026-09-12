import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  DEFAULT_SITE_URL,
  OG_IMAGE_PATH,
  SITE_NAME,
  getCanonicalUrl,
  getRobotsDirective,
  getSeoMetadata,
  normalizeSeoPath,
} from "../../seo.config.mjs";

const SITE_URL = String(import.meta.env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, "");
const ALLOW_INDEXING = import.meta.env.VITE_ALLOW_INDEXING === "true";

const upsertMeta = (selector, attributes) => {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
};

const setCanonical = (url) => {
  const current = document.head.querySelector('link[rel="canonical"]');
  if (!url) {
    current?.remove();
    return;
  }
  const element = current || document.createElement("link");
  element.setAttribute("rel", "canonical");
  element.setAttribute("href", url);
  if (!current) document.head.appendChild(element);
};

const SeoMetadata = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const normalizedPath = normalizeSeoPath(pathname);
    const metadata = getSeoMetadata(normalizedPath);
    const canonicalUrl = getCanonicalUrl(normalizedPath, SITE_URL);
    const pageUrl = canonicalUrl || `${SITE_URL}${normalizedPath === "/" ? "/" : normalizedPath}`;
    const imageUrl = `${SITE_URL}${OG_IMAGE_PATH}`;

    document.title = metadata.title;
    upsertMeta('meta[name="description"]', { name: "description", content: metadata.description });
    upsertMeta('meta[name="robots"]', {
      name: "robots",
      content: getRobotsDirective(metadata, ALLOW_INDEXING),
    });
    upsertMeta('meta[property="og:locale"]', { property: "og:locale", content: "ru_RU" });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: "website" });
    upsertMeta('meta[property="og:site_name"]', { property: "og:site_name", content: SITE_NAME });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: metadata.title });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: metadata.description });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: pageUrl });
    upsertMeta('meta[property="og:image"]', { property: "og:image", content: imageUrl });
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: metadata.title });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: metadata.description });
    upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: imageUrl });
    setCanonical(canonicalUrl);
  }, [pathname]);

  return null;
};

export default SeoMetadata;
