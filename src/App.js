import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import OrderPage from './pages/OrderPage'; // Добавьте новый компонент для страницы заказа
import EmbroideryPage from './pages/EmbroideryPage';
import RecipientDetails from './pages/RecipientDetails';

const App = () => {
    return (
        <Router>
            <div className="App">
                <Header />
                <main>
                    <Routes>
                        {/* Главная страница */}
                        <Route path="/" element={<HomePage />} />

                        {/* Страница заказа */}
                        <Route path="/order" element={<OrderPage />} />
                        <Route path="/embroidery" element={<EmbroideryPage />} />
                        <Route path="/recipient" element={<RecipientDetails />} />
                    </Routes>
                </main>
                <Footer />
            </div>
        </Router>
    );
};

export default App;
