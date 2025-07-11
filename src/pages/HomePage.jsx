import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import to2 from "../images/lines/Line1_2.svg";
import to3 from "../images/lines/Line2_3.svg";
import to4 from "../images/lines/Line3_4.svg";
import to5 from "../images/lines/Line4_5.svg";

const HomePage = () => {
    const navigate = useNavigate();
    const handleOrder = () => {
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
                        <section class="steps">
                            <div class="step" id="step-1">
                                <div class="firstRow">
                                    <div class="number">1.</div>
                                    <div class="text">
                                        <p class="nameStep">ВАША ИДЕЯ</p>
                                        <div class="descriptionStep">отправка фото или рисунка с вашей идеей</div>
                                    </div>
                                </div>
                                <div class="image-placeholder"></div>
                            </div>

                            <div class="step" id="step-2">
                                <div class="firstRow">
                                    <div class="number">2.</div>
                                    <div class="text">
                                        <p class="nameStep">ЭСКИЗ</p>
                                        <div class="descriptionStep">отрисовка эскиза по вашей идее</div>
                                    </div>
                                </div>
                                <div class="image-placeholder"></div>
                            </div>
                           
                            <div class="step" id="step-3">
                                <div class="firstRow">
                                    <div class="number">3.</div>
                                    <div class="text">
                                        <p class="nameStep">ВЫШИВАЛЬНЫЙ ДИЗАЙН</p>
                                        <div class="descriptionStep">подготовка макета по эскизу</div>
                                    </div>
                                </div>
                                <div class="image-placeholder"></div>
                            </div>
                      
                            <div class="step" id="step-4">
                                <div class="firstRow">
                                    <div class="number">4.</div>
                                    <div class="text">
                                        <p class="nameStep">ГОТОВЫЙ ВАРИАНТ</p>
                                        <div class="descriptionStep">оформление финального варианта</div>
                                    </div>
                                </div>
                                <div class="image-placeholder"></div>
                            </div>
                   
                            <div class="step" id="step-5">
                                <div class="firstRow">
                                    <div class="number">5.</div>
                                    <div class="text">
                                        <p class="nameStep">ОТПРАВКА</p>
                                        <div class="descriptionStep">отправка готового заказа</div>
                                    </div>
                                </div>
                                <div class="image-placeholder"></div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
