import { useLocation, useNavigate } from "react-router-dom";
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
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleOrder = onOrderOverride || (() => navigate("/order"));
  const activeNavigationId = pathname.startsWith("/certificate")
    ? "certificate"
    : orderFlowPaths.some((path) => pathname.startsWith(path))
      ? "constructor"
      : undefined;

  return (
    <HomeHeader
      activeNavigationId={activeNavigationId}
      assets={siteHeaderAssets}
      mobileActiveNavigationId={pathname === "/" ? "about" : activeNavigationId}
      navigationBase={standalone ? "/" : ""}
      onOrder={handleOrder}
      standalone={standalone}
    />
  );
};

export default Header;
