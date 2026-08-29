import { customerTabs } from "../../data/homeContent";
import ResponsiveAsset from "./ResponsiveAsset";
import { HomeTabs } from "./primitives";

const CustomersSection = ({ assets }) => {
  const tabs = customerTabs.map((tab) => {
    const photo = tab.id === "delivery" && assets.delivery.tablet
      ? assets.delivery
      : assets.order;

    return {
      id: tab.id,
      label: tab.label,
      content: (
        <div className="home-customers__content">
          <div className="home-customers__photo">
            <ResponsiveAsset
              desktop={photo.desktop}
              tablet={photo.tablet}
              mobile={photo.mobile}
              alt="Пример вышивки на изделии"
              className="home-customers__image"
            />
          </div>
          <div className="home-customers__copy">
            <h3>{tab.title}</h3>
            {tab.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </div>
      ),
    };
  });

  return (
    <section className="home-section home-customers" id="customers" aria-labelledby="home-customers-title">
      <div className="home-section__surface home-customers__surface">
        <div className="home-section__inner home-customers__inner">
          <h2 className="home-section__title" id="home-customers-title">клиентам</h2>
          <HomeTabs tabs={tabs} defaultActiveTabId="order" ariaLabel="Информация для клиентов" />
        </div>
      </div>
    </section>
  );
};

export default CustomersSection;
