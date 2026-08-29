import EmbroiderySelector from "../components/EmbroiderySelector";

const EmbroideryPage = () => {
  return (
    <section className="embroideryPage" aria-labelledby="order-embroidery-title">
      <div className="embroideryPage__stage">
        <div className="orderBlock orderBlock--embroidery">
          <EmbroiderySelector />
        </div>
      </div>
    </section>
  );
};

export default EmbroideryPage;
