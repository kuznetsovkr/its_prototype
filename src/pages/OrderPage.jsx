import React from 'react';
import ClothingSelector from "../components/ClothingSelector";

const OrderPage = () => {
    return (
        <div className="container">
            <div className="wrapper">
                <div className="orderBlock">
                    <ClothingSelector/>
                </div>
            </div>
        </div>
    );
};

export default OrderPage;
