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
import PageLayout from './components/PageLayout';
import FakePayment from './pages/FakePayment';



const App = () => {
    return (
        <Router>
            <div className="App">
                <Header />
                    <main>
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/order" element={<PageLayout><OrderPage /></PageLayout>} />
                            <Route path="/embroidery" element={<PageLayout><EmbroideryPage /></PageLayout>} />
                            <Route path="/recipient" element={<PageLayout><RecipientDetails /></PageLayout>} />
                            <Route path="/thank-you" element={<PageLayout><ThankYouPage /></PageLayout>} />
                            <Route path="/profile" element={<PageLayout><ProfilePage /></PageLayout>} />
                            <Route path="/order-history" element={<PageLayout><OrderHistoryPage /></PageLayout>} />
                            <Route path="/works" element={<WorksPage/>} />
                            <Route path="/about" element={<PageLayout><AboutPage /></PageLayout>} />
                            <Route path="/faq" element={<PageLayout><DeliveryPage /></PageLayout>} />
                            <Route path="/size-guide" element={<PageLayout><SizeGuidePage /></PageLayout>} />
                            <Route path="/payment" element={<PageLayout><PaymentPage /></PageLayout>} />
                            <Route path="/fake-payment" element={<FakePayment />} />

                            {/* Админку можно оставить без layout-а, если она отдельная */}
                            <Route path="/admin/inventory" element={<PageLayout><AdminInventory /></PageLayout>} />
                        </Routes>
                    </main>
                <Footer />
            </div>
        </Router>
    );
};

export default App;
