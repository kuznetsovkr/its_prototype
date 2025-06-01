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
                    <button className="main_block_order_button" onClick={handleOrder}>СДЕЛАТЬ ЗАКАЗ</button>
                </div>
            </div>
            <div className="container">
                <div id="roadmap_block" className="wrapper">
                </div>
            </div>
        </div>
    );
};

export default HomePage;
