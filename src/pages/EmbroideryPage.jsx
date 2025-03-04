import React from 'react';
import { useLocation } from 'react-router-dom';
import ClothingSelector from "../components/ClothingSelector";
import EmbroiderySelector from "../components/EmbroiderySelector";

const EmbroideryPage = () => {
    const location = useLocation();
    const { selectedClothing, selectedSize } = location.state || {};

    return (
        <div className="container">
            <div className="wrapper">
                <div className="orderBlock">
                    <EmbroiderySelector/>
                </div>
            </div>
        </div>
    );
};

export default EmbroideryPage;
