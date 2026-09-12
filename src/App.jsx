import { lazy, Suspense, useEffect, useLayoutEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import PageLayout from './components/PageLayout';
import { useOrder } from "./context/OrderContext";
import RequireAdmin from './components/RequireAdmin';
import RouteLoader from './components/RouteLoader';
import SeoMetadata from './components/SeoMetadata';
import { isOrderFlowPath } from './config/routes';

const loadHomePage = () => import('./pages/HomePage');
const loadCertificatePage = () => import('./pages/CertificatePage');
const loadOrderPage = () => import('./pages/OrderPage');
const loadEmbroideryPage = () => import('./pages/EmbroideryPage');
const loadRecipientDetails = () => import('./pages/RecipientDetails');
const loadThankYouPage = () => import('./pages/ThankYouPage');
const loadAdminInventory = () => import('./admin/AdminInventory');
const loadPaymentSuccess = () => import('./pages/PaymentSuccess');
const loadPaymentFail = () => import('./pages/PaymentFail');
const loadAdminLoginPage = () => import('./pages/AdminLoginPage');
const loadNotFoundPage = () => import('./pages/NotFoundPage');

const HomePage = lazy(loadHomePage);
const CertificatePage = lazy(loadCertificatePage);
const OrderPage = lazy(loadOrderPage);
const EmbroideryPage = lazy(loadEmbroideryPage);
const RecipientDetails = lazy(loadRecipientDetails);
const ThankYouPage = lazy(loadThankYouPage);
const AdminInventory = lazy(loadAdminInventory);
const PaymentSuccess = lazy(loadPaymentSuccess);
const PaymentFail = lazy(loadPaymentFail);
const AdminLoginPage = lazy(loadAdminLoginPage);
const NotFoundPage = lazy(loadNotFoundPage);

const primaryRouteImports = [
    loadHomePage,
    loadCertificatePage,
    loadOrderPage,
    loadEmbroideryPage,
    loadRecipientDetails,
    loadThankYouPage,
];

const RoutePreloader = () => {
    useEffect(() => {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        const shouldSkip = connection?.saveData || ['slow-2g', '2g'].includes(connection?.effectiveType);

        if (shouldSkip) return undefined;

        let idleCallbackId;
        const preloadTimer = window.setTimeout(() => {
            const preload = () => {
                primaryRouteImports.forEach((loadRoute) => {
                    loadRoute().catch(() => undefined);
                });
            };

            if ('requestIdleCallback' in window) {
                idleCallbackId = window.requestIdleCallback(preload, { timeout: 2000 });
            } else {
                preload();
            }
        }, 1200);

        return () => {
            window.clearTimeout(preloadTimer);
            if (idleCallbackId !== undefined && 'cancelIdleCallback' in window) {
                window.cancelIdleCallback(idleCallbackId);
            }
        };
    }, []);

    return null;
};

const OrderFlowReset = () => {
    const location = useLocation();
    const { resetOrder } = useOrder();

    useEffect(() => {
        if (!isOrderFlowPath(location.pathname)) {
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
    const isAdminPage = pathname.startsWith('/admin');

    const routes = (
        <Suspense fallback={<RouteLoader />}>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/certificate" element={<CertificatePage />} />
                <Route path="/order" element={<PageLayout><OrderPage /></PageLayout>} />
                <Route path="/embroidery" element={<PageLayout><EmbroideryPage /></PageLayout>} />
                <Route path="/recipient" element={<PageLayout><RecipientDetails /></PageLayout>} />
                <Route path="/thank-you" element={<PageLayout><ThankYouPage /></PageLayout>} />
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
                <Route path="*" element={<PageLayout><NotFoundPage /></PageLayout>} />
            </Routes>
        </Suspense>
    );

    return (
            <div className={`App${isOrderPage ? ' App--order' : ''}${isEmbroideryPage ? ' App--embroidery' : ''}${isRecipientPage ? ' App--recipient' : ''}${isCertificatePage ? ' App--certificate' : ''}${isAdminPage ? ' App--admin' : ''}`}>
                {!isHomePage && <Header />}
                <SeoMetadata />
                <ScrollToTop />
                <OrderFlowReset />
                <RoutePreloader />
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
