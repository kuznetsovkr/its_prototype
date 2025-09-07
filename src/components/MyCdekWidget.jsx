import { useEffect } from 'react';
import CDEKWidget from '@cdek-it/widget';

const MyCdekWidget = ({ onAddressSelect, onRateSelect }) => {
  const servicePath = process.env.REACT_APP_CDEK_SERVICE_URL || '/service.php';

  useEffect(() => {
    const instance = new CDEKWidget({
      root: 'cdek-map',
      from: {
        country_code: 'RU',
        city: 'Красноярск',
        postal_code: 660135,
        code: 278,
        address: 'ул. 78-й Добровольческой Бригады, 1',
      },
      apiKey: '310f9193-b426-4cdd-8e65-b03ac33526fa',
      canChoose: true,
      servicePath, // ← больше не localhost
      hideFilters: { have_cashless: false, have_cash: false, is_dressing_room: false, type: false },
      hideDeliveryOptions: { office: false, door: false },
      debug: false,
      goods: [{ width: 10, height: 10, length: 10, weight: 10 }],
      defaultLocation: [55.0415, 82.9346],
      lang: 'rus',
      currency: 'RUB',
      tariffs: { office: [234, 136, 138], door: [233, 137, 139] },
      onChoose(delivery, rate, address) {
        onAddressSelect?.(address.name);
        onRateSelect?.(rate.delivery_sum);
      },
    });

    return () => {
      try { instance?.destroy?.(); } catch {}
      const el = document.getElementById('cdek-map');
      if (el) el.innerHTML = '';
    };
  }, [onAddressSelect, onRateSelect, servicePath]);

  // важное: даём корневой контейнер для виджета
  return <div id="cdek-map" style={{ minHeight: 420 }} />;
};

export default MyCdekWidget;
