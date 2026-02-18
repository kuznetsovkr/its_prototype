import { useEffect, useRef } from "react";
import CDEKWidget from "@cdek-it/widget";

const FIXED_TARIFF_CODE = 136;
const DEFAULT_CENTER = [92.868, 56.0106];
const DEFAULT_ZOOM = 10;

const detectClothingKey = (base) => {
  const raw = String(base || "").toLowerCase();
  if (raw.includes("худи") || raw.includes("hoodie") || raw.includes("hudi")) return "hoodie";
  if (raw.includes("свитшот") || raw.includes("свит") || raw.includes("sweatshirt") || raw.includes("svitshot")) return "svitshot";
  if (raw.includes("футбол") || raw.includes("t-shirt") || raw.includes("tshirt") || raw.includes("tee")) return "tshirt";
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
  city: "Красноярск",
  postal_code: 660135,
  code: 278,
  address: "ул. 78-й Добровольческой бригады, 1",
};

const DEFAULT_CITY = {
  code: 278,
  city: "Красноярск",
  country_code: "RU",
  postal_code: "660135",
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
      tariff_name: "Склад-склад",
      delivery_sum: null,
      total_sum: null,
      period_min: null,
      period_max: null,
      currency: "RUB",
    };
  }

  return {
    tariff_code: tariff.tariff_code ?? fallbackCode,
    tariff_name: tariff.tariff_name ?? tariff.title ?? "Склад-склад",
    delivery_sum: tariff.delivery_sum ?? null,
    total_sum: tariff.total_sum ?? null,
    period_min: tariff.period_min ?? null,
    period_max: tariff.period_max ?? null,
    currency: tariff.currency ?? "RUB",
  };
};

const getWidgetStore = (widgetInstance, storeId) =>
  widgetInstance?.app?._context?.provides?.pinia?._s?.get?.(storeId);

const MyCdekWidget = ({ onAddressSelect, onRateSelect, onCdekSelect, productType }) => {
  const servicePath = process.env.REACT_APP_CDEK_SERVICE_URL || "/service.php";
  const ymapsKey = process.env.REACT_APP_YMAPS_KEY;

  const addressRef = useRef(onAddressSelect);
  const rateRef = useRef(onRateSelect);
  const cdekRef = useRef(onCdekSelect);
  const autoTariffRef = useRef(normalizeTariff(null));

  useEffect(() => { addressRef.current = onAddressSelect; }, [onAddressSelect]);
  useEffect(() => { rateRef.current = onRateSelect; }, [onRateSelect]);
  useEffect(() => { cdekRef.current = onCdekSelect; }, [onCdekSelect]);

  useEffect(() => {
    let instance;
    const unsubscribeWidgetListeners = [];

    const t = setTimeout(() => {
      const typeName = resolveProductName(productType);
      const goodsKey = detectClothingKey(typeName);
      const goods = GOODS_PRESETS[goodsKey] || GOODS_PRESETS.default;
      const goodsForApi = {
        ...goods,
        weight_grams: Math.round((goods.weight || 0) * 1000),
      };

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
        fixBounds: "country",
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
        },
      });

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

        if (coreStore.selectedTariff?.tariff_code === autoTariffRef.current.tariff_code) return;
        coreStore.$patch((state) => {
          state.selectedTariff = targetTariff;
        });
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
      unsubscribeWidgetListeners.forEach((unsubscribe) => {
        try { unsubscribe?.(); } catch {}
      });
      try { instance?.destroy?.(); } catch {}
    };
  }, [servicePath, ymapsKey, productType]);

  return null;
};

export default MyCdekWidget;
