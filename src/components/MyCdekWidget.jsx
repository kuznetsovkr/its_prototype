import { useEffect } from 'react';
import CDEKWidget from '@cdek-it/widget';

// Detect product type to pick dimensions/weight preset for delivery calc
const detectClothingKey = (base) => {
  const raw = String(base || '').toLowerCase();
  if (raw.includes('hoodie') || raw.includes('hudi')) return 'hoodie';
  if (raw.includes('sweatshirt') || raw.includes('svitshot')) return 'svitshot';
  if (raw.includes('t-shirt') || raw.includes('tshirt') || raw.includes('tee')) return 'tshirt';
  return 'hoodie';
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
  city: 'Krasnoyarsk',
  postal_code: 660135,
  code: 278,
  address: 'ul. 78 Dobrovolcheskoy Brigady, 1',
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

  // LngLat
  const DEFAULT_CENTER = [92.868, 56.0106];
  const DEFAULT_ZOOM = 10;

  useEffect(() => {
    const t = setTimeout(() => {
      const typeName = resolveProductName(productType);
      const goodsKey = detectClothingKey(typeName);
      const goods = GOODS_PRESETS[goodsKey] || GOODS_PRESETS.default;
      const goodsForApi = {
        ...goods,
        weight_grams: Math.round((goods.weight || 0) * 1000),
      };

      const instance = new CDEKWidget({
        root: 'cdek-map',
        from: FROM_LOCATION,
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
        onChoose(mode, selectedTariff, address) {
          const addressLabel = formatAddressLabel(address);
          onAddressSelect?.(addressLabel);
          onRateSelect?.(selectedTariff?.delivery_sum ?? selectedTariff?.total_sum ?? null);

          onCdekSelect?.({
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

      return () => { try { instance?.destroy?.(); } catch {} };
    }, 0);

    return () => clearTimeout(t);
  }, [onAddressSelect, onRateSelect, onCdekSelect, servicePath, ymapsKey, productType]);

  return null; // renders into #cdek-map via widget internals
};

export default MyCdekWidget;
