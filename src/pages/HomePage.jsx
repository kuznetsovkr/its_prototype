import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useOrder } from "../context/OrderContext";
import to2 from "../images/lines/Line1_2.svg";
import to3 from "../images/lines/Line2_3.svg";
import to4 from "../images/lines/Line3_4.svg";
import to5 from "../images/lines/Line4_5.svg";

const HomePage = () => {
    const navigate = useNavigate();
    const { resetOrder } = useOrder();
    const handleOrder = () => {
        resetOrder();
        navigate('/order');
    };

    useEffect(() => {
    const observer = new IntersectionObserver(
        entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            } else {
            entry.target.classList.remove('visible');
            }
        });
        },
        { threshold: 0.2 }
    );

    const allAnimated = document.querySelectorAll('.step, .arrow');
    allAnimated.forEach(el => observer.observe(el));
    

    return () => observer.disconnect();
    }, []);

    return (
        <div>
            <div id="main_block" className="container">
                <div className="wrapper">
                    <button className="main_block_order_button" onClick={handleOrder}>СДЕЛАТЬ ЗАКАЗ</button>
                </div>
            </div>
            <div className="container">
                <div className="wrapper">
                    <div className="roadmap">
                        <div className="titleRoadmap">
                            <p className="titleFirstColumn" >КАК</p>
                            <div className="titleSecondColumn">
                                <p className="titleDo">СДЕЛАТЬ</p>
                                <p className="titleOrder">ЗАКАЗ?</p>
                            </div>
                        </div>
                        <section className="steps">
                            <div className="step" id="step-1">
                                <div className="firstRow">
                                    <div className="number">1.</div>
                                    <div className="text">
                                        <p className="nameStep">ВАША ИДЕЯ</p>
                                        <div className="descriptionStep">отправка фото или рисунка с вашей идеей</div>
                                    </div>
                                </div>
                                <div className="image-placeholder"></div>
                            </div>

                            <div className="step" id="step-2">
                                <div className="firstRow">
                                    <div className="number">2.</div>
                                    <div className="text">
                                        <p className="nameStep">ЭСКИЗ</p>
                                        <div className="descriptionStep">отрисовка эскиза по вашей идее</div>
                                    </div>
                                </div>
                                <div className="image-placeholder"></div>
                            </div>
                           
                            <div className="step" id="step-3">
                                <div className="firstRow">
                                    <div className="number">3.</div>
                                    <div className="text">
                                        <p className="nameStep">ВЫШИВАЛЬНЫЙ ДИЗАЙН</p>
                                        <div className="descriptionStep">подготовка макета по эскизу</div>
                                    </div>
                                </div>
                                <div className="image-placeholder"></div>
                            </div>
                      
                            <div className="step" id="step-4">
                                <div className="firstRow">
                                    <div className="number">4.</div>
                                    <div className="text">
                                        <p className="nameStep">ГОТОВЫЙ ВАРИАНТ</p>
                                        <div className="descriptionStep">оформление финального варианта</div>
                                    </div>
                                </div>
                                <div className="image-placeholder"></div>
                            </div>
                   
                            <div className="step" id="step-5">
                                <div className="firstRow">
                                    <div className="number">5.</div>
                                    <div className="text">
                                        <p className="nameStep">ОТПРАВКА</p>
                                        <div className="descriptionStep">отправка готового заказа</div>
                                    </div>
                                </div>
                                <div className="image-placeholder"></div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
