import React from 'react';
import { useNavigate } from 'react-router-dom';
import roadmap from "../images/roadmap.webp"

const HomePage = () => {
    const navigate = useNavigate();
    const handleOrder = () => {
        navigate('/order');
    };

    return (
        <div>
            <div id="main_block" className="container">
                <div className="wrapper">
                    <button className="main_block_order_button" onClick={handleOrder}>Сделать заказ</button>
                </div>
            </div>
            <div className="container">
                <div id="roadmap_block" className="wrapper">
                    <p class = "title">Этапы изготовления</p>
                    <img src={roadmap} alt="roadmap" />
                    <button className="roadmap_button" onClick={handleOrder}>Сделать заказ</button>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
