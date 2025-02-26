import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
    const navigate = useNavigate();
    const handleOrder = () => {
        navigate('/order');
    };

    return (
        <div id="main_block" className="container">
            <div className="wrapper">
                <button className="main_block_order_button" onClick={handleOrder}>Сделать заказ</button>
            </div>
        </div>
    );
};

export default HomePage;
