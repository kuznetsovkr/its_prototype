import { useEffect, useRef } from 'react';
import CDEKWidget from '@cdek-it/widget';

// Подбираем тип изделия и габариты/вес для расчета доставки
const detectClothingKey = (base) => {
  const raw = String(base || '').toLowerCase();
  if (raw.includes('худи') || raw.includes('hoodie') || raw.includes('hudi')) return 'hoodie';
  if (raw.includes('свитшот') || raw.includes('свит') || raw.includes('sweatshirt') || raw.includes('svitshot')) return 'svitshot';
  if (raw.includes('футбол') || raw.includes('t-shirt') || raw.includes('tshirt') || raw.includes('tee')) return 'tshirt';
  return 'hoodie'; // чуть завышаем по умолчанию, чтобы не занизить доставку
};

const resolveProductName = (productType) => {
  if (!productType) return '';
  if (typeof productType === 'string') return productType;
  if (typeof productType === 'object') {
    return productType.name || productType.type || '';
  }
  return '';
};

const GOODS_PRESETS = {
  hoodie:   { width: 35, height: 35, length: 7, weight: 0.8 },
  svitshot: { width: 35, height: 35, length: 7, weight: 0.8 },
  tshirt:   { width: 30, height: 20, length: 3, weight: 0.3 },
  default:  { width: 35, height: 35, length: 7, weight: 0.8 },
};

const FROM_LOCATION = {
  country_code: 'RU',
  city: 'Красноярск',
  postal_code: 660135,
  code: 278,
  address: 'ул. 78-й Добровольческой бригады, 1',
};

const DEFAULT_CITY = {
  code: 278,
  city: 'Красноярск',
  country_code: 'RU',
  postal_code: '660135',
};

const formatAddressLabel = (address) => {
  if (!address) return '';
  return (
    address.address ||
    address.formatted ||
    address.name ||
    address.location?.address ||
    ''
  );
};

const MyCdekWidget = ({ onAddressSelect, onRateSelect, onCdekSelect, productType }) => {
  const servicePath = process.env.REACT_APP_CDEK_SERVICE_URL || '/service.php';
  const ymapsKey    = process.env.REACT_APP_YMAPS_KEY;

  // keep latest callbacks without пересоздания виджета на каждое изменение state
  const addressRef = useRef(onAddressSelect);
  const rateRef = useRef(onRateSelect);
  const cdekRef = useRef(onCdekSelect);

  useEffect(() => { addressRef.current = onAddressSelect; }, [onAddressSelect]);
  useEffect(() => { rateRef.current = onRateSelect; }, [onRateSelect]);
  useEffect(() => { cdekRef.current = onCdekSelect; }, [onCdekSelect]);

  // LngLat
  const DEFAULT_CENTER = [92.868, 56.0106];
  const DEFAULT_ZOOM = 10;

  useEffect(() => {
    let instance;
    const t = setTimeout(() => {
      const typeName = resolveProductName(productType);
      const goodsKey = detectClothingKey(typeName);
      const goods = GOODS_PRESETS[goodsKey] || GOODS_PRESETS.default;
      const goodsForApi = {
        ...goods,
        weight_grams: Math.round((goods.weight || 0) * 1000),
      };

      instance = new CDEKWidget({
        root: 'cdek-map',
        from: FROM_LOCATION,
        apiKey: ymapsKey,
        canChoose: true,
        servicePath,
        hideFilters: { have_cashless:false, have_cash:false, is_dressing_room:false, type:false },
        // Оставляем только пункты выдачи (office), доставка до двери скрыта
        hideDeliveryOptions: { office: false, door: true },
        debug: false,
        goods: [goods],
        city: DEFAULT_CITY,           // предустанавливаем Красноярск
        defaultLocation: DEFAULT_CENTER,
        fixBounds: 'locality',        // ограничиваем область поиска границами населённого пункта
        lang: 'rus',
        currency: 'RUB',
        // Оставляем один тариф, чтобы пользователь не выбирал тарифы вручную
        tariffs: { office:[234], door:[] },
        onChoose(mode, selectedTariff, address) {
          const addressLabel = formatAddressLabel(address);
          addressRef.current?.(addressLabel);
          rateRef.current?.(selectedTariff?.delivery_sum ?? selectedTariff?.total_sum ?? null);

          cdekRef.current?.({
            mode,
            tariff: selectedTariff
              ? {
                  tariff_code: selectedTariff.tariff_code,
                  tariff_name: selectedTariff.tariff_name ?? selectedTariff.title ?? null,
                  delivery_sum: selectedTariff.delivery_sum ?? null,
                  total_sum: selectedTariff.total_sum ?? null,
                  period_min: selectedTariff.period_min ?? null,
                  period_max: selectedTariff.period_max ?? null,
                  currency: selectedTariff.currency ?? 'RUB',
                }
              : null,
            address,
            addressLabel,
            goods: [goodsForApi],
            from: FROM_LOCATION,
          });
        },
      });

      // Force initial centering and reflow the map container after mount
      instance.updateLocation(DEFAULT_CENTER, DEFAULT_ZOOM).catch(() => {});
      requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));

    }, 0);

    return () => {
      clearTimeout(t);
      try { instance?.destroy?.(); } catch {}
    };
  }, [servicePath, ymapsKey, productType]);

  return null; // renders into #cdek-map via widget internals
};

export default MyCdekWidget;
