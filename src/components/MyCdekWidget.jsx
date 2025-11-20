import { useEffect } from 'react';
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

const MyCdekWidget = ({ onAddressSelect, onRateSelect, productType }) => {
  const servicePath = process.env.REACT_APP_CDEK_SERVICE_URL || '/service.php';
  const ymapsKey    = process.env.REACT_APP_YMAPS_KEY;

  // LngLat
  const DEFAULT_CENTER = [92.868, 56.0106];
  const DEFAULT_ZOOM = 10;

  useEffect(() => {
    const t = setTimeout(() => {
      const typeName = resolveProductName(productType);
      const goodsKey = detectClothingKey(typeName);
      const goods = GOODS_PRESETS[goodsKey] || GOODS_PRESETS.default;

      const instance = new CDEKWidget({
        root: 'cdek-map',
        from: {
          country_code: 'RU',
          city: 'Красноярск',
          postal_code: 660135,
          code: 278,
          address: 'ул. 78-й Добровольческой бригады, 1',
        },
        apiKey: ymapsKey,
        canChoose: true,
        servicePath,
        hideFilters: { have_cashless:false, have_cash:false, is_dressing_room:false, type:false },
        hideDeliveryOptions: { office:false, door:false },
        debug: false,
        goods: [goods],
        defaultLocation: DEFAULT_CENTER,
        fixBounds: 'country',
        lang: 'rus',
        currency: 'RUB',
        tariffs: { office:[234,136,138], door:[233,137,139] },
        onChoose(delivery, rate, address) {
          onAddressSelect?.(address.name);
          onRateSelect?.(rate.delivery_sum);
        },
      });

      // Инициируем фокус на текущий регион и дергаем resize, чтобы карта корректно встала в контейнер
      instance.updateLocation(DEFAULT_CENTER, DEFAULT_ZOOM).catch(() => {});
      requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));

      return () => { try { instance?.destroy?.(); } catch {} };
    }, 0);

    return () => clearTimeout(t);
  }, [onAddressSelect, onRateSelect, servicePath, ymapsKey, productType]);

  return null; // рендерится в #cdek-map, сам виджет — внутри сторонней библиотеки
};

export default MyCdekWidget;
