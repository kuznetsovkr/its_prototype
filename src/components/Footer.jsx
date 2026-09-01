import { useNavigate } from "react-router-dom";
import { siteFooterAssets } from "../images/home";
import HomeFooter from "./home/HomeFooter";

const Footer = () => {
  const navigate = useNavigate();

  return (
    <HomeFooter
      assets={siteFooterAssets.internal}
      navigationBase="/"
      onOrder={() => navigate("/order")}
      variant="internal"
    />
  );
};

export default Footer;
