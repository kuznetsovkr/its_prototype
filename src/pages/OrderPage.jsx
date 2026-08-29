import ClothingSelector from "../components/ClothingSelector";

const OrderPage = () => {
  return (
    <section className="orderPage" aria-labelledby="order-clothing-title">
      <div className="orderPage__stage">
        <div className="orderBlock orderBlock--clothing">
          <ClothingSelector />
        </div>
      </div>
    </section>
  );
};

export default OrderPage;
