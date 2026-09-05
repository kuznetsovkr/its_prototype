import React, { useEffect, useLayoutEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CertificatePage from './pages/CertificatePage';
import OrderPage from './pages/OrderPage'; // Добавьте новый компонент для страницы заказа
import EmbroideryPage from './pages/EmbroideryPage';
import RecipientDetails from './pages/RecipientDetails';
import ThankYouPage from './pages/ThankYouPage';
import WorksPage from './pages/WorksPage';
import SizeGuidePage from './pages/SizeGuidePage';
import PaymentPage from './pages/PaymentPage';
import AdminInventory from "./admin/AdminInventory";
import PageLayout from './components/PageLayout';
import FakePayment from './pages/FakePayment';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFail from './pages/PaymentFail';
import { useOrder } from "./context/OrderContext";
import RequireAdmin from './components/RequireAdmin';
import AdminLoginPage from './pages/AdminLoginPage';

const OrderFlowReset = () => {
    const location = useLocation();
    const { resetOrder } = useOrder();

    useEffect(() => {
        const allowed = [
            "/order",
            "/embroidery",
            "/recipient",
            "/payment",
            "/fake-payment",
            "/payment-success",
            "/payment-fail",
            "/thank-you"
        ];
        const isOrderPath = allowed.some((p) => location.pathname.startsWith(p));
        if (!isOrderPath) {
            resetOrder();
        }
    }, [location.pathname, resetOrder]);

    return null;
};

const ScrollToTop = () => {
    const { pathname } = useLocation();

    useLayoutEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, [pathname]);

    return null;
};



const AppShell = () => {
    const { pathname } = useLocation();
    const isHomePage = pathname === '/';
    const isOrderPage = pathname === '/order';
    const isEmbroideryPage = pathname === '/embroidery';
    const isRecipientPage = pathname === '/recipient';
    const isCertificatePage = pathname === '/certificate';

    const routes = (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/certificate" element={<CertificatePage />} />
            <Route path="/order" element={<PageLayout><OrderPage /></PageLayout>} />
            <Route path="/embroidery" element={<PageLayout><EmbroideryPage /></PageLayout>} />
            <Route path="/recipient" element={<PageLayout><RecipientDetails /></PageLayout>} />
            <Route path="/thank-you" element={<PageLayout><ThankYouPage /></PageLayout>} />
            <Route path="/works" element={<WorksPage/>} />
            <Route path="/size-guide" element={<PageLayout><SizeGuidePage /></PageLayout>} />
            <Route path="/payment" element={<PageLayout><PaymentPage /></PageLayout>} />
            <Route path="/fake-payment" element={<FakePayment />} />
            <Route path="/payment-success" element={<PageLayout><PaymentSuccess /></PageLayout>} />
            <Route path="/payment-fail" element={<PageLayout><PaymentFail /></PageLayout>} />
            <Route path="/admin" element={<PageLayout><AdminLoginPage /></PageLayout>} />

            {/* Админку можно оставить без layout-а, если она отдельная */}
            <Route
              path="/admin/inventory"
              element={
                <RequireAdmin>
                  <PageLayout><AdminInventory /></PageLayout>
                </RequireAdmin>
              }
            />
        </Routes>
    );

    return (
            <div className={`App${isOrderPage ? ' App--order' : ''}${isEmbroideryPage ? ' App--embroidery' : ''}${isRecipientPage ? ' App--recipient' : ''}${isCertificatePage ? ' App--certificate' : ''}`}>
                {!isHomePage && <Header />}
                <ScrollToTop />
                <OrderFlowReset />
                {isHomePage ? routes : <main>{routes}</main>}
                {!isHomePage && <Footer />}
            </div>
    );
};

const App = () => {
    return (
        <Router>
            <AppShell />
        </Router>
    );
};

export default App;
