import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthModal from "../AuthModal";
import { siteHeaderAssets } from "../images/home";
import HomeHeader from "./home/HomeHeader";

const orderFlowPaths = [
  "/order",
  "/embroidery",
  "/recipient",
  "/payment",
  "/fake-payment",
  "/payment-success",
  "/payment-fail",
  "/thank-you",
];

const Header = ({ onOrder: onOrderOverride, standalone = true }) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => Boolean(localStorage.getItem("token")),
  );
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(Boolean(localStorage.getItem("token")));
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
  };

  const handleProfile = () => {
    if (isAuthenticated) {
      navigate("/profile");
      return;
    }

    setIsAuthModalOpen(true);
  };

  const handleOrder = onOrderOverride || (() => navigate("/order"));
  const activeNavigationId = pathname.startsWith("/certificate")
    ? "certificate"
    : orderFlowPaths.some((path) => pathname.startsWith(path))
      ? "constructor"
      : undefined;

  return (
    <>
      <HomeHeader
        activeNavigationId={activeNavigationId}
        assets={siteHeaderAssets}
        navigationBase={standalone ? "/" : ""}
        onOrder={handleOrder}
        onProfile={handleProfile}
        standalone={standalone}
      />
      <AuthModal
        isAuthModalOpen={isAuthModalOpen}
        toggleAuthModal={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
};

export default Header;
