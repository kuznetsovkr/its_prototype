import { useEffect } from 'react';
import CDEKWidget from '@cdek-it/widget';

const MyCdekWidget = ({ onAddressSelect, onRateSelect }) => {
  const servicePath = process.env.REACT_APP_CDEK_SERVICE_URL || '/service.php';
  const ymapsKey    = process.env.REACT_APP_YMAPS_KEY;

  useEffect(() => {
    // небольшая задержка — даём лейауту установиться (полезно для Safari)
    const t = setTimeout(() => {
      const instance = new CDEKWidget({
        root: 'cdek-map',
        from: { country_code:'RU', city:'Красноярск', postal_code:660135, code:278, address:'ул. 78-й Добровольческой Бригады, 1' },
        apiKey: ymapsKey,
        canChoose: true,
        servicePath,
        hideFilters: { have_cashless:false, have_cash:false, is_dressing_room:false, type:false },
        hideDeliveryOptions: { office:false, door:false },
        debug: false,
        goods: [{ width:10, height:10, length:10, weight:10 }],
        defaultLocation: [55.0415, 82.9346],
        lang: 'rus',
        currency: 'RUB',
        tariffs: { office:[234,136,138], door:[233,137,139] },
        onChoose(delivery, rate, address) {
          onAddressSelect?.(address.name);
          onRateSelect?.(rate.delivery_sum);
        },
      });

      // подстраховка: триггернуть ресайз после инициализации (Safari любит это)
      requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));

      return () => { try { instance?.destroy?.(); } catch {} };
    }, 0);

    return () => clearTimeout(t);
  }, [onAddressSelect, onRateSelect, servicePath, ymapsKey]);

  return null;
};

export default MyCdekWidget;
