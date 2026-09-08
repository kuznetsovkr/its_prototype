import { lazy, Suspense, useEffect, useLayoutEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import PageLayout from './components/PageLayout';
import { useOrder } from "./context/OrderContext";
import RequireAdmin from './components/RequireAdmin';

const HomePage = lazy(() => import('./pages/HomePage'));
const CertificatePage = lazy(() => import('./pages/CertificatePage'));
const OrderPage = lazy(() => import('./pages/OrderPage'));
const EmbroideryPage = lazy(() => import('./pages/EmbroideryPage'));
const RecipientDetails = lazy(() => import('./pages/RecipientDetails'));
const ThankYouPage = lazy(() => import('./pages/ThankYouPage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const AdminInventory = lazy(() => import('./admin/AdminInventory'));
const FakePayment = lazy(() => import('./pages/FakePayment'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const PaymentFail = lazy(() => import('./pages/PaymentFail'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));

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
        <Suspense fallback={<div className="route-loading" role="status">Загрузка…</div>}>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/certificate" element={<CertificatePage />} />
                <Route path="/order" element={<PageLayout><OrderPage /></PageLayout>} />
                <Route path="/embroidery" element={<PageLayout><EmbroideryPage /></PageLayout>} />
                <Route path="/recipient" element={<PageLayout><RecipientDetails /></PageLayout>} />
                <Route path="/thank-you" element={<PageLayout><ThankYouPage /></PageLayout>} />
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
        </Suspense>
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

