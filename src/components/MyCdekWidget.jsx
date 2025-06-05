import { useEffect, useRef } from 'react';
import CDEKWidget from '@cdek-it/widget';

const MyCdekWidget = ({ onAddressSelect, onRateSelect }) => {
  const widgetContainerRef = useRef(null);
  const cdekWidgetInstance = useRef(null);

  useEffect(() => {
    cdekWidgetInstance.current = new CDEKWidget({
      from: {
        country_code: 'RU',
        city: 'Красноярск',
        postal_code: 660135,
        code: 278,
        address: "ул. 78-й Добровольческой Бригады, 1",
      },
      root: 'cdek-map',
      apiKey: '310f9193-b426-4cdd-8e65-b03ac33526fa',
      canChoose: true,
      servicePath: 'http://localhost:8080/service.php',
      hideFilters: {
        have_cashless: false,
        have_cash: false,
        is_dressing_room: false,
        type: false,
      },
      hideDeliveryOptions: {
        office: false,
        door: false,
      },
      debug: false,
      goods: [
        {
          width: 10,
          height: 10,
          length: 10,
          weight: 10,
        },
      ],
      defaultLocation: [55.0415, 82.9346],
      lang: 'rus',
      currency: 'RUB',
      tariffs: {
        office: [234, 136, 138],
        door: [233, 137, 139],
      },
      onReady() {
        console.log('Виджет загружен');
      },
      onCalculate(rates, address) {
      },
      onChoose(delivery, rate, address) {
        console.log(rate);
        console.log(address);
        if (onAddressSelect) {
          onAddressSelect(address.name);
        }
        if (onRateSelect) {
          onRateSelect(rate.delivery_sum);
        }
      },
    });

    return () => {
      if (cdekWidgetInstance.current) {
        cdekWidgetInstance.current = null;
      }
    };
  }, [onAddressSelect, onRateSelect]);

  return (
    <div>
      <h1>Пример CDEK-виджета</h1>
      <div
        ref={widgetContainerRef}
        style={{
          border: '1px solid #ccc',
          padding: '10px',
          minHeight: '400px',
        }}
      />
    </div>
  );
};

export default MyCdekWidget;
