import { promises as fs } from "node:fs";
import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import {
  DEFAULT_SITE_URL,
  OG_IMAGE_PATH,
  SEO_ROUTES,
  SITE_NAME,
  buildRobotsTxt,
  buildSitemapXml,
  getCanonicalUrl,
  getRobotsDirective,
  getSeoMetadata,
  normalizeSeoPath,
  normalizeSiteUrl,
} from "./seo.config.mjs";

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll('"', "&quot;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

const renderSeoBlock = ({ pathname, siteUrl, allowIndexing }) => {
  const normalizedPath = normalizeSeoPath(pathname);
  const metadata = getSeoMetadata(normalizedPath);
  const canonicalUrl = getCanonicalUrl(normalizedPath, siteUrl);
  const pageUrl = canonicalUrl || (normalizedPath === "/" ? `${siteUrl}/` : `${siteUrl}${normalizedPath}`);
  const imageUrl = `${siteUrl}${OG_IMAGE_PATH}`;
  const robots = getRobotsDirective(metadata, allowIndexing);
  const tags = [
    `    <title>${escapeHtml(metadata.title)}</title>`,
    `    <meta name="description" content="${escapeHtml(metadata.description)}" />`,
    `    <meta name="robots" content="${escapeHtml(robots)}" />`,
    `    <meta property="og:locale" content="ru_RU" />`,
    `    <meta property="og:type" content="website" />`,
    `    <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />`,
    `    <meta property="og:title" content="${escapeHtml(metadata.title)}" />`,
    `    <meta property="og:description" content="${escapeHtml(metadata.description)}" />`,
    `    <meta property="og:url" content="${escapeHtml(pageUrl)}" />`,
    `    <meta property="og:image" content="${escapeHtml(imageUrl)}" />`,
    `    <meta property="og:image:type" content="image/webp" />`,
    `    <meta property="og:image:width" content="1200" />`,
    `    <meta property="og:image:height" content="630" />`,
    `    <meta property="og:image:alt" content="Одежда с индивидуальной вышивкой «И так сойдёт»" />`,
    `    <meta name="twitter:card" content="summary_large_image" />`,
    `    <meta name="twitter:title" content="${escapeHtml(metadata.title)}" />`,
    `    <meta name="twitter:description" content="${escapeHtml(metadata.description)}" />`,
    `    <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />`,
  ];
  if (canonicalUrl) {
    tags.push(`    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`);
  }
  return `    <!-- seo:start -->\n${tags.join("\n")}\n    <!-- seo:end -->`;
};

const applySeoBlock = (html, options) => {
  const pattern = /\s*<!-- seo:start -->[\s\S]*?<!-- seo:end -->/;
  if (!pattern.test(html)) throw new Error("SEO marker block is missing from index.html");
  return html.replace(pattern, `\n${renderSeoBlock(options)}`);
};

const seoAssetsPlugin = ({ siteUrl, allowIndexing }) => {
  let outputDirectory;
  return {
    name: "its-seo-assets",
    enforce: "post",
    configResolved(config) {
      outputDirectory = path.resolve(config.root, config.build.outDir);
    },
    transformIndexHtml: {
      order: "post",
      handler(html, context) {
        return applySeoBlock(html, {
          pathname: context.path || "/",
          siteUrl,
          allowIndexing,
        });
      },
    },
    async closeBundle() {
      const indexPath = path.join(outputDirectory, "index.html");
      const baseHtml = await fs.readFile(indexPath, "utf8");
      for (const pathname of Object.keys(SEO_ROUTES).filter((item) => item !== "/")) {
        const routeDirectory = path.join(outputDirectory, ...pathname.slice(1).split("/"));
        await fs.mkdir(routeDirectory, { recursive: true });
        await fs.writeFile(
          path.join(routeDirectory, "index.html"),
          applySeoBlock(baseHtml, { pathname, siteUrl, allowIndexing }),
          "utf8"
        );
      }
      await fs.writeFile(
        path.join(outputDirectory, "404.html"),
        applySeoBlock(baseHtml, { pathname: "/404", siteUrl, allowIndexing }),
        "utf8"
      );
      await fs.writeFile(
        path.join(outputDirectory, "robots.txt"),
        buildRobotsTxt({ allowIndexing, siteUrl }),
        "utf8"
      );
      await fs.writeFile(path.join(outputDirectory, "sitemap.xml"), buildSitemapXml(siteUrl), "utf8");
    },
  };
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const siteUrl = normalizeSiteUrl(
    process.env.VITE_SITE_URL || env.VITE_SITE_URL || DEFAULT_SITE_URL
  );
  const allowIndexing =
    String(process.env.VITE_ALLOW_INDEXING ?? env.VITE_ALLOW_INDEXING) === "true";
  if (allowIndexing && new URL(siteUrl).hostname !== "its-site.ru") {
    throw new Error("Indexing can only be enabled for its-site.ru");
  }

  return {
    plugins: [react(), seoAssetsPlugin({ siteUrl, allowIndexing })],
    envPrefix: ["VITE_", "REACT_APP_"],
    server: {
      port: 3000,
    },
    preview: {
      port: 3000,
    },
    build: {
      outDir: "build",
      // The CDEK SDK is a pre-bundled third-party module. It is isolated in an
      // on-demand chunk and only downloaded when the pickup-point map is opened.
      chunkSizeWarningLimit: 700,
    },
    test: {
      environment: "node",
    },
  };
});
