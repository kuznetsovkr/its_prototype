import React, { useState } from "react";

const faqs = [
  { id: 1, q: "Как оформить заказ?", a: "Добавьте товар в корзину, укажите данные получателя и способ доставки. После оплаты мы подтвердим заказ по SMS или email." },
  { id: 2, q: "Какие способы оплаты доступны?", a: "Можно оплатить банковской картой, через Apple/Google Pay или по счёту. Наличные — только при самовывозе." },
  { id: 3, q: "Сроки изготовления и доставки?", a: "Изготовление занимает 1–3 рабочих дня. Доставка по стране — от 2 до 7 дней в зависимости от региона и перевозчика." },
  { id: 4, q: "Можно ли изменить заказ после оформления?", a: "Да, в течение 2 часов после оформления. Свяжитесь с поддержкой и сообщите номер заказа." },
  { id: 5, q: "Как выбрать размер?", a: "Ориентируйтесь на таблицу размеров в карточке товара. Если сомневаетесь — берите на полразмера больше." },
  { id: 6, q: "Индивидуальная вышивка и надписи", a: "Мы делаем кастомные вышивки и надписи. Загрузите изображение или укажите текст на шаге оформления." },
  { id: 7, q: "Что делать, если товара нет в наличии?", a: "Нажмите «Сообщить о поступлении» — пришлём уведомление. Либо предложим схожие позиции." },
  { id: 8, q: "Как работает самовывоз?", a: "Самовывоз доступен из нашего пункта выдачи. Когда заказ будет готов, вы получите сообщение с адресом и графиком." },
  { id: 9, q: "Уход за изделием с вышивкой", a: "Стирайте при 30° на деликатном режиме, выворачивая изделие. Не гладьте вышивку напрямую — используйте проутюжильник." },
  { id: 10, q: "Как связаться с поддержкой?", a: "Пишите в чат на сайте или на почту support@example.com. Работаем ежедневно с 10:00 до 20:00." },
];
export default function FaqPage() {
  const [openId, setOpenId] = useState(faqs[0].id); 

  const toggle = (id) => {
    setOpenId((prev) => (prev === id ? null : id)); 
  };

  return (
    <section className="faq" aria-labelledby="faq-title">
      <div className="faq__container">
        <h1 id="faq-title" className="faq__title">Частые вопросы</h1>

        <ul className="accordion">
          {faqs.map(({ id, q, a }) => {
            const isOpen = id === openId;
            return (
              <li key={id} className={`accordion__item ${isOpen ? "is-open" : ""}`}>
                <button
                  className="accordion__header"
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${id}`}
                  id={`faq-header-${id}`}
                  onClick={() => toggle(id)}
                >
                  <span className="accordion__question">{q}</span>
                  <span className="accordion__chevron" aria-hidden="true" />
                </button>

                <div
                  id={`faq-panel-${id}`}
                  role="region"
                  aria-labelledby={`faq-header-${id}`}
                  className="accordion__panel"
                >
                  <div className="accordion__content">
                    <p>{a}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
