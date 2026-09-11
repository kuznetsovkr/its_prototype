import { useLocation, useNavigate } from "react-router-dom";
import { siteHeaderAssets } from "../images/home";
import HomeHeader from "./home/HomeHeader";
import { isOrderFlowPath } from "../config/routes";

const Header = ({ onOrder: onOrderOverride, standalone = true }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleOrder = onOrderOverride || (() => navigate("/order"));
  const activeNavigationId = pathname.startsWith("/certificate")
    ? "certificate"
    : isOrderFlowPath(pathname)
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
