import EmbroiderySelector from "../components/EmbroiderySelector";
import ConstructorDraftNotice from "../features/cart/ConstructorDraftNotice";

const EmbroideryPage = () => {
  return (
    <section className="embroideryPage" aria-labelledby="order-embroidery-title">
      <ConstructorDraftNotice />
      <div className="embroideryPage__stage">
        <div className="orderBlock orderBlock--embroidery">
          <EmbroiderySelector />
        </div>
      </div>
    </section>
  );
};

export default EmbroideryPage;
