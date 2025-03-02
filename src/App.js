import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import OrderPage from './pages/OrderPage'; // Добавьте новый компонент для страницы заказа
import EmbroideryPage from './pages/EmbroideryPage';
import RecipientDetails from './pages/RecipientDetails';
import ThankYouPage from './pages/ThankYouPage';
import ProfilePage from './pages/ProfilePage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import WorksPage from './pages/WorksPage';
import AboutPage from './pages/AboutPage';
import DeliveryPage from './pages/DeliveryPage';
import SizeGuidePage from './pages/SizeGuidePage';
import PaymentPage from './pages/PaymentPage';
import AdminInventory from "./admin/AdminInventory";

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
                        <Route path="/thank-you" element={<ThankYouPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/order-history" element={<OrderHistoryPage />} />
                        <Route path="/works" element={<WorksPage />} />
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/delivery" element={<DeliveryPage />} />
                        <Route path="/size-guide" element={<SizeGuidePage />} />
                        <Route path="/payment" element={<PaymentPage />} />
                        <Route path="/admin/inventory" element={<AdminInventory />} />
                    </Routes>
                </main>
                <Footer />
            </div>
        </Router>
    );
};

export default App;
