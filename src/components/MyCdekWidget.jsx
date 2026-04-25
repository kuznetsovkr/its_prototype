import { useEffect, useRef } from "react";
import CDEKWidget from "@cdek-it/widget";
import { API_BASE } from "../api";

const FIXED_TARIFF_CODE = 136;
const DEFAULT_CENTER = [92.868, 56.0106];
const DEFAULT_ZOOM = 10;
const INFO_POPUP_KEY = "info";

const detectClothingKey = (base) => {
  const raw = String(base || "").toLowerCase();
  if (raw.includes("С…СѓРґРё") || raw.includes("hoodie") || raw.includes("hudi")) return "hoodie";
  if (raw.includes("СЃРІРёС‚С€РѕС‚") || raw.includes("СЃРІРёС‚") || raw.includes("sweatshirt") || raw.includes("svitshot")) return "svitshot";
  if (raw.includes("С„СѓС‚Р±РѕР»") || raw.includes("t-shirt") || raw.includes("tshirt") || raw.includes("tee")) return "tshirt";
  return "hoodie";
};

const resolveProductName = (productType) => {
  if (!productType) return "";
  if (typeof productType === "string") return productType;
  if (typeof productType === "object") {
    return productType.name || productType.type || "";
  }
  return "";
};

const GOODS_PRESETS = {
  hoodie: { width: 35, height: 35, length: 7, weight: 0.8 },
  svitshot: { width: 35, height: 35, length: 7, weight: 0.8 },
  tshirt: { width: 30, height: 20, length: 3, weight: 0.3 },
  default: { width: 35, height: 35, length: 7, weight: 0.8 },
};

const FROM_LOCATION = {
  country_code: "RU",
  city: "РљСЂР°СЃРЅРѕСЏСЂСЃРє",
  postal_code: 660135,
  code: 278,
  address: "СѓР». 78-Р№ Р”РѕР±СЂРѕРІРѕР»СЊС‡РµСЃРєРѕР№ Р±СЂРёРіР°РґС‹, 1",
};

const DEFAULT_CITY = {
  code: 278,
  city: "РљСЂР°СЃРЅРѕСЏСЂСЃРє",
  country_code: "RU",
  postal_code: "660135",
};

const LOOPBACK_HOSTS = ["localhost", "127.0.0.1", "::1"];

const isLoopbackUrl = (value) => {
  if (!value) return false;
  try {
    const parsed = new URL(value, window.location.origin);
    return LOOPBACK_HOSTS.includes(parsed.hostname);
  } catch {
    return false;
  }
};

const shouldAvoidLoopback = () => !LOOPBACK_HOSTS.includes(window.location.hostname);

const normalizeBase = (value) => String(value || "").replace(/\/+$/, "");

const deriveServicePathFromApiBase = (apiBase) => {
  const normalized = normalizeBase(apiBase);
  if (!normalized || normalized === "/api") return "/service.php";

  try {
    const parsed = new URL(normalized, window.location.origin);
    const pathWithoutApiSuffix = parsed.pathname.replace(/\/api$/i, "");
    const basePath = pathWithoutApiSuffix === "/" ? "" : pathWithoutApiSuffix;
    return `${parsed.origin}${basePath}/service.php`;
  } catch {
    if (normalized.startsWith("/")) {
      const localPath = normalized.replace(/\/api$/i, "");
      return `${localPath}/service.php`;
    }
    return "/service.php";
  }
};

const resolveServicePath = () => {
  const configuredServicePath = String(process.env.REACT_APP_CDEK_SERVICE_URL || "").trim();
  const fallbackServicePath = deriveServicePathFromApiBase(API_BASE);

  if (!configuredServicePath) return fallbackServicePath;

  if (shouldAvoidLoopback() && isLoopbackUrl(configuredServicePath)) {
    return fallbackServicePath;
  }

  if (!shouldAvoidLoopback() && isLoopbackUrl(configuredServicePath) && isLoopbackUrl(fallbackServicePath)) {
    try {
      const configuredUrl = new URL(configuredServicePath, window.location.origin);
      const fallbackUrl = new URL(fallbackServicePath, window.location.origin);
      if (configuredUrl.port && fallbackUrl.port && configuredUrl.port !== fallbackUrl.port) {
        return fallbackServicePath;
      }
    } catch {}
  }

  return configuredServicePath;
};

const YMAPS_LAYER_ERROR_SIGNATURES = [
  "YMapDefaultSchemeLayer is not a constructor",
  "YMapDefaultFeaturesLayer is not a constructor",
];
const MAP_ERROR_TEXT = "Карта СДЭК не загрузилась. Проверьте REACT_APP_YMAPS_KEY для JS API v3.";

const isYmapsLayerConstructorError = (reason) => {
  const message = String(reason?.message || reason || "");
  return YMAPS_LAYER_ERROR_SIGNATURES.some((signature) => message.includes(signature));
};

const setMapErrorMessage = (message) => {
  const root = document.getElementById("cdek-map");
  if (!root) return;
  root.innerHTML = `<div class="cdek-map__error">${message}</div>`;
};

const clearMapErrorMessage = () => {
  const root = document.getElementById("cdek-map");
  if (!root) return;
  const errorNode = root.querySelector(".cdek-map__error");
  if (errorNode) {
    errorNode.remove();
  }
};

const formatAddressLabel = (address) => {
  if (!address) return "";
  return (
    address.address ||
    address.formatted ||
    address.name ||
    address.location?.address ||
    ""
  );
};

const normalizeTariff = (tariff, fallbackCode = FIXED_TARIFF_CODE) => {
  if (!tariff) {
    return {
      tariff_code: fallbackCode,
      tariff_name: "РЎРєР»Р°Рґ-СЃРєР»Р°Рґ",
      delivery_sum: null,
      total_sum: null,
      period_min: null,
      period_max: null,
      currency: "RUB",
    };
  }

  return {
    tariff_code: tariff.tariff_code ?? fallbackCode,
    tariff_name: tariff.tariff_name ?? tariff.title ?? "РЎРєР»Р°Рґ-СЃРєР»Р°Рґ",
    delivery_sum: tariff.delivery_sum ?? null,
    total_sum: tariff.total_sum ?? null,
    period_min: tariff.period_min ?? null,
    period_max: tariff.period_max ?? null,
    currency: tariff.currency ?? "RUB",
  };
};

const getWidgetStore = (widgetInstance, storeId) =>
  widgetInstance?.app?._context?.provides?.pinia?._s?.get?.(storeId);

const closeInfoPopup = (widgetInstance) => {
  const coreStore = getWidgetStore(widgetInstance, "core");
  if (!coreStore?.openedPopups?.[INFO_POPUP_KEY]) return;

  if (typeof coreStore.togglePopup === "function") {
    coreStore.togglePopup(INFO_POPUP_KEY);
    return;
  }

  if (typeof coreStore.$patch === "function") {
    coreStore.$patch((state) => {
      if (state.openedPopups?.[INFO_POPUP_KEY]) {
        state.openedPopups[INFO_POPUP_KEY] = false;
      }
    });
  }
};

const MyCdekWidget = ({ onAddressSelect, onRateSelect, onCdekSelect, productType }) => {
  const servicePath = resolveServicePath();
  const ymapsKey = String(process.env.REACT_APP_YMAPS_KEY || "")
    .trim()
    .replace(/^['"]|['"]$/g, "");

  const addressRef = useRef(onAddressSelect);
  const rateRef = useRef(onRateSelect);
  const cdekRef = useRef(onCdekSelect);
  const autoTariffRef = useRef(normalizeTariff(null));
  const hasLoggedMapErrorRef = useRef(false);

  useEffect(() => { addressRef.current = onAddressSelect; }, [onAddressSelect]);
  useEffect(() => { rateRef.current = onRateSelect; }, [onRateSelect]);
  useEffect(() => { cdekRef.current = onCdekSelect; }, [onCdekSelect]);

  useEffect(() => {
    let instance;
    const unsubscribeWidgetListeners = [];

    hasLoggedMapErrorRef.current = false;

    const reportMapError = (reason) => {
      if (hasLoggedMapErrorRef.current) return;
      hasLoggedMapErrorRef.current = true;
      setMapErrorMessage(MAP_ERROR_TEXT);
      console.error("[CDEK] Widget map init error:", reason);
      console.error(
        "[CDEK] Проверьте ключ REACT_APP_YMAPS_KEY (доступ к Yandex Maps JS API v3 и разрешенный localhost/127.0.0.1 в ограничениях ключа)."
      );
    };

    const handleUnhandledRejection = (event) => {
      if (isYmapsLayerConstructorError(event.reason)) {
        reportMapError(event.reason);
      }
    };
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    const t = setTimeout(() => {
      if (!ymapsKey) {
        reportMapError(new Error("REACT_APP_YMAPS_KEY is empty"));
        return;
      }

      clearMapErrorMessage();

      const typeName = resolveProductName(productType);
      const goodsKey = detectClothingKey(typeName);
      const goods = GOODS_PRESETS[goodsKey] || GOODS_PRESETS.default;
      const goodsForApi = {
        ...goods,
        weight_grams: Math.round((goods.weight || 0) * 1000),
      };

      try {
        instance = new CDEKWidget({
          root: "cdek-map",
          from: FROM_LOCATION,
          apiKey: ymapsKey,
          canChoose: true,
          servicePath,
          hideFilters: { have_cashless: false, have_cash: false, is_dressing_room: false, type: false },
          hideDeliveryOptions: { office: false, door: true },
          debug: false,
          goods: [goods],
          city: DEFAULT_CITY,
          defaultLocation: DEFAULT_CENTER,
          fixBounds: null,
          lang: "rus",
          currency: "RUB",
          tariffs: { office: [FIXED_TARIFF_CODE], door: [] },
          onChoose(mode, selectedTariff, address) {
            const normalizedTariff = normalizeTariff(selectedTariff || autoTariffRef.current);
            autoTariffRef.current = normalizedTariff;

            const addressLabel = formatAddressLabel(address);
            addressRef.current?.(addressLabel);
            rateRef.current?.(normalizedTariff.delivery_sum ?? normalizedTariff.total_sum ?? null);

            cdekRef.current?.({
              mode,
              tariff: normalizedTariff,
              address,
              addressLabel,
              goods: [goodsForApi],
              from: FROM_LOCATION,
            });

            closeInfoPopup(instance);
          },
        });
      } catch (error) {
        reportMapError(error);
        return;
      }

      const coreStore = getWidgetStore(instance, "core");
      const mapStore = getWidgetStore(instance, "map");

      const autoSelectTariff = () => {
        if (!coreStore || !mapStore) return;
        if (coreStore.mode !== "office" || !mapStore.exactOffice) return;

        const tariffsForOffice = mapStore.exactOffice?.type === "POSTAMAT"
          ? coreStore.tariffs?.pickup
          : coreStore.tariffs?.office;
        if (!Array.isArray(tariffsForOffice) || tariffsForOffice.length === 0) return;

        const targetTariff =
          tariffsForOffice.find((tariff) => Number(tariff?.tariff_code) === FIXED_TARIFF_CODE) ||
          tariffsForOffice[0];
        if (!targetTariff) return;

        autoTariffRef.current = normalizeTariff(targetTariff);

        if (
          coreStore.selectedTariff?.tariff_code === autoTariffRef.current.tariff_code &&
          coreStore.selected
        ) return;
        coreStore.$patch((state) => {
          state.selectedTariff = targetTariff;
          state.selected = true;
        });
        closeInfoPopup(instance);
      };

      if (coreStore?.$subscribe && mapStore?.$subscribe) {
        unsubscribeWidgetListeners.push(coreStore.$subscribe(() => autoSelectTariff()));
        unsubscribeWidgetListeners.push(mapStore.$subscribe(() => autoSelectTariff()));
        autoSelectTariff();
      }

      instance.updateLocation(DEFAULT_CENTER, DEFAULT_ZOOM).catch(() => {});
      requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    }, 0);

    return () => {
      clearTimeout(t);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      unsubscribeWidgetListeners.forEach((unsubscribe) => {
        try { unsubscribe?.(); } catch {}
      });
      try { instance?.destroy?.(); } catch {}
    };
  }, [servicePath, ymapsKey, productType]);

  return null;
};

export default MyCdekWidget;


