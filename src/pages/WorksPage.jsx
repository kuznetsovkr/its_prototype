import React from 'react';
import './WorksPage.css';

const Works = () => {
    return (
        <div className="works">
            <h1>Примеры работ</h1>
            <div className="gallery">
                <div className="work-item">
                    <img src="https://via.placeholder.com/150" alt="Work 1" />
                    <p>Описание работы 1</p>
                </div>
                <div className="work-item">
                    <img src="https://via.placeholder.com/150" alt="Work 2" />
                    <p>Описание работы 2</p>
                </div>
                <div className="work-item">
                    <img src="https://via.placeholder.com/150" alt="Work 3" />
                    <p>Описание работы 3</p>
                </div>
            </div>
        </div>
    );
};

export default Works;
