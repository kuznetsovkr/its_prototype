export const SITE_NAME = "И так сойдёт";
export const DEFAULT_SITE_URL = "https://its-site.ru";
export const OG_IMAGE_PATH = "/og-cover.webp";

export const SEO_ROUTES = Object.freeze({
  "/": Object.freeze({
    title: "И так сойдёт — кастомная вышивка на одежде",
    description: "Создаём футболки, свитшоты и худи с вышивкой по вашим фотографиям. Оформите индивидуальный заказ с доставкой СДЭК.",
    indexable: true,
    canonical: true,
  }),
  "/certificate": Object.freeze({
    title: "Подарочный сертификат — И так сойдёт",
    description: "Подарочный сертификат на индивидуальную вышивку от бренда «И так сойдёт».",
    indexable: false,
    canonical: true,
  }),
  "/order": Object.freeze({
    title: "Выбор изделия — И так сойдёт",
    description: "Выберите изделие, цвет и размер для индивидуальной вышивки.",
    indexable: false,
  }),
  "/embroidery": Object.freeze({
    title: "Настройка вышивки — И так сойдёт",
    description: "Выберите вид вышивки и загрузите изображения для заказа.",
    indexable: false,
  }),
  "/recipient": Object.freeze({
    title: "Оформление заказа — И так сойдёт",
    description: "Контактные данные, доставка и оплата индивидуального заказа.",
    indexable: false,
  }),
  "/thank-you": Object.freeze({
    title: "Спасибо за заказ — И так сойдёт",
    description: "Заказ принят. Информация о дальнейших шагах оформления.",
    indexable: false,
  }),
  "/payment-success": Object.freeze({
    title: "Оплата прошла успешно — И так сойдёт",
    description: "Подтверждение успешной оплаты заказа.",
    indexable: false,
  }),
  "/payment-fail": Object.freeze({
    title: "Оплата не завершена — И так сойдёт",
    description: "Информация о незавершённой оплате заказа.",
    indexable: false,
  }),
  "/admin": Object.freeze({
    title: "Вход в панель управления — И так сойдёт",
    description: "Служебная страница входа в панель управления.",
    indexable: false,
  }),
  "/admin/inventory": Object.freeze({
    title: "Панель управления — И так сойдёт",
    description: "Служебная панель управления каталогом.",
    indexable: false,
  }),
});

export const NOT_FOUND_SEO = Object.freeze({
  title: "Страница не найдена — И так сойдёт",
  description: "Такой страницы нет или она была перемещена.",
  indexable: false,
});

export const normalizeSeoPath = (value) => {
  const path = String(value || "/").split(/[?#]/, 1)[0] || "/";
  if (path === "/" || path === "/index.html") return "/";
  return path.replace(/\/+$/, "") || "/";
};

export const getSeoMetadata = (pathname) =>
  SEO_ROUTES[normalizeSeoPath(pathname)] || NOT_FOUND_SEO;

export const normalizeSiteUrl = (value = DEFAULT_SITE_URL) => {
  const url = new URL(value || DEFAULT_SITE_URL);
  if (url.protocol !== "https:" || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("VITE_SITE_URL must be an HTTPS origin without a path");
  }
  return url.origin;
};

export const getCanonicalUrl = (pathname, siteUrl = DEFAULT_SITE_URL) => {
  const metadata = getSeoMetadata(pathname);
  if (!metadata.canonical) return null;
  const path = normalizeSeoPath(pathname);
  return path === "/" ? `${normalizeSiteUrl(siteUrl)}/` : `${normalizeSiteUrl(siteUrl)}${path}`;
};

export const getRobotsDirective = (metadata, allowIndexing) =>
  allowIndexing && metadata.indexable
    ? "index, follow, max-image-preview:large"
    : "noindex, nofollow, noarchive";

export const buildRobotsTxt = ({ allowIndexing, siteUrl = DEFAULT_SITE_URL }) => {
  if (!allowIndexing) return "User-agent: *\nDisallow: /\n";
  return [
    "User-agent: *",
    "Allow: /",
    `Sitemap: ${normalizeSiteUrl(siteUrl)}/sitemap.xml`,
    "",
  ].join("\n");
};

export const buildSitemapXml = (siteUrl = DEFAULT_SITE_URL) => {
  const origin = normalizeSiteUrl(siteUrl);
  const urls = Object.entries(SEO_ROUTES)
    .filter(([, metadata]) => metadata.indexable)
    .map(([pathname]) => {
      const location = pathname === "/" ? `${origin}/` : `${origin}${pathname}`;
      return `  <url>\n    <loc>${location}</loc>\n  </url>`;
    });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
};
