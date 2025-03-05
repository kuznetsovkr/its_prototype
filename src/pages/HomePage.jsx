import React from 'react';
import { useNavigate } from 'react-router-dom';

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
                <div className="wrapper">
                    <section className="production-steps">
                        <h2>Этапы изготовления</h2>

                        <div className="step">
                        <h3>Шаг 1</h3>
                        <p>Получение и анализ вашего заказа.</p>
                        </div>

                        <div className="step">
                        <h3>Шаг 2</h3>
                        <p>Подготовка макета вышивки согласно вашим пожеланиям.</p>
                        </div>

                        <div className="step">
                        <h3>Шаг 3</h3>
                        <p>Утверждение макета и финальные правки дизайна.</p>
                        </div>

                        <div className="step">
                        <h3>Шаг 4</h3>
                        <p>Подбор и подготовка материалов к вышивке.</p>
                        </div>

                        <div className="step">
                        <h3>Шаг 5</h3>
                        <p>Непосредственно процесс вышивки на выбранном изделии.</p>
                        </div>

                        <div className="step">
                        <h3>Шаг 6</h3>
                        <p>Контроль качества и упаковка готового изделия.</p>
                        </div>

                        <div className="step">
                        <h3>Шаг 7</h3>
                        <p>Отправка заказа и уведомление клиента о доставке.</p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
