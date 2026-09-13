import { Link } from "react-router-dom";

const DOCUMENTS = {
  privacy: {
    number: "01",
    eyebrow: "обработка данных",
    title: "Политика конфиденциальности",
    description: "Здесь будет опубликована утверждённая политика обработки и защиты персональных данных.",
    sections: [
      "Сведения об операторе персональных данных",
      "Состав и цели обработки данных",
      "Правовые основания и сроки хранения",
      "Передача данных сервисам оплаты и доставки",
      "Права пользователя и порядок обращения",
      "Меры защиты и контактная информация",
    ],
    alternateHref: "/offer",
    alternateLabel: "Открыть публичную оферту",
  },
  offer: {
    number: "02",
    eyebrow: "условия заказа",
    title: "Публичная оферта",
    description: "Здесь будут опубликованы утверждённые условия заказа и продажи изделий с индивидуальной вышивкой.",
    sections: [
      "Сведения о продавце и область действия оферты",
      "Порядок оформления индивидуального заказа",
      "Стоимость, способы и момент оплаты",
      "Сроки изготовления и условия доставки",
      "Обмен и возврат персонализированных изделий",
      "Ответственность сторон и порядок обращений",
    ],
    alternateHref: "/privacy",
    alternateLabel: "Открыть политику конфиденциальности",
  },
};

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const LegalPlaceholderPage = ({ document }) => {
  const content = DOCUMENTS[document] || DOCUMENTS.privacy;

  return (
    <section className={`legalPage legalPage--${document}`} aria-labelledby="legal-page-title">
      <article className="legalPage__card">
        <header className="legalPage__intro">
          <span className="legalPage__number" aria-hidden="true">{content.number}</span>
          <p className="legalPage__eyebrow">
            <span>документ</span>
            {content.eyebrow}
          </p>
          <h1 className="legalPage__title" id="legal-page-title">{content.title}</h1>
          <p className="legalPage__description">{content.description}</p>
          <div className="legalPage__status">
            <i aria-hidden="true" />
            <span>Статус</span>
            <strong>на согласовании</strong>
          </div>
        </header>

        <div className="legalPage__content">
          <section className="legalPage__notice" aria-labelledby="legal-notice-title">
            <span className="legalPage__noticeMark" aria-hidden="true">!</span>
            <div>
              <p>временная страница</p>
              <h2 id="legal-notice-title">Документ готовится</h2>
              <span>
                Эта страница пока не содержит юридически утверждённого текста и не заменяет финальную редакцию документа. Мы опубликуем её после согласования с заказчиком и юристом.
              </span>
            </div>
          </section>

          <section className="legalPage__outline" aria-labelledby="legal-outline-title">
            <div className="legalPage__outlineHeading">
              <h2 id="legal-outline-title">Что появится на странице</h2>
              <span>{String(content.sections.length).padStart(2, "0")} разделов</span>
            </div>
            <ol>
              {content.sections.map((section, index) => (
                <li key={section}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p>{section}</p>
                </li>
              ))}
            </ol>
          </section>

          <div className="legalPage__actions">
            <Link className="legalPage__action legalPage__action--primary" to="/">
              <span>на главную</span>
              <ArrowIcon />
            </Link>
            <Link className="legalPage__action" to={content.alternateHref}>
              <span>{content.alternateLabel}</span>
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </article>
    </section>
  );
};

export default LegalPlaceholderPage;
