import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useOrder } from "../context/OrderContext";
import { homeAssets, siteFooterAssets } from "../images/home";
import Header from "../components/Header";
import AboutSection from "../components/home/AboutSection";
import CustomersSection from "../components/home/CustomersSection";
import FaqSection from "../components/home/FaqSection";
import HeroSection from "../components/home/HeroSection";
import HomeFooter from "../components/home/HomeFooter";
import ProcessSection from "../components/home/ProcessSection";
import QuestionsSection from "../components/home/QuestionsSection";
import ReviewsSection from "../components/home/ReviewsSection";
import SocialSection from "../components/home/SocialSection";
import WorksSection from "../components/home/WorksSection";
import useHomeBreakpoint from "../components/home/useHomeBreakpoint";

const HomePage = () => {
  const navigate = useNavigate();
  const { resetOrder } = useOrder();
  const breakpoint = useHomeBreakpoint();
  const currentAssets = homeAssets[breakpoint];

  const handleOrder = useCallback(() => {
    resetOrder();
    navigate("/order");
  }, [navigate, resetOrder]);

  const heroAssets = {
    background: {
      desktop: homeAssets.desktop.hero.background,
      tablet: homeAssets.tablet.hero.background,
      mobile: homeAssets.mobile.hero.background,
    },
    subject: {
      desktop: homeAssets.desktop.hero.subject,
      tablet: homeAssets.tablet.hero.subject,
    },
    logo: {
      desktop: homeAssets.desktop.hero.logoMilk,
      tablet: homeAssets.tablet.hero.logoMilk,
      mobile: homeAssets.mobile.hero.logoGraphite,
    },
  };

  const aboutAssets = {
    primary: {
      desktop: homeAssets.desktop.about.photo,
      tablet: homeAssets.tablet.about.photo,
      mobile: homeAssets.mobile.about.photoLayers[0],
    },
    overlay: {
      mobile: homeAssets.mobile.about.photoLayers[1],
    },
  };

  const worksAssets = {
    desktopItems: homeAssets.desktop.works.items,
    compactItems: homeAssets.tablet.works.compactItems,
    expandedItems: homeAssets.tablet.works.expandedItems,
    mobileItems: homeAssets.mobile.works.items,
    headingAvatar: breakpoint === "desktop" ? homeAssets.desktop.works.headingAvatar : null,
    headingStickers: breakpoint === "desktop" ? homeAssets.desktop.works.headingStickers : [],
  };

  const customerAssets = {
    order: {
      desktop: homeAssets.desktop.customers.orderPhoto,
      tablet: homeAssets.tablet.customers.orderPhoto,
      mobile: homeAssets.mobile.customers.orderPhoto,
    },
    delivery: {
      desktop: homeAssets.desktop.customers.orderPhoto,
      tablet: homeAssets.tablet.customers.deliveryPhoto,
      mobile: homeAssets.mobile.customers.orderPhoto,
    },
  };

  const questionsAssets = {
    dogs: [0, 1].map((index) => ({
      desktop: homeAssets.desktop.questions.dogs[index],
      tablet: homeAssets.tablet.questions.dogs[index],
      mobile: homeAssets.mobile.questions.dogs[index],
    })),
  };

  const reviews = <ReviewsSection assets={currentAssets.reviews} breakpoint={breakpoint} />;
  const customers = <CustomersSection assets={customerAssets} />;

  return (
    <div className={`home-page home-page--${breakpoint}`} id="top">
      <Header onOrder={handleOrder} standalone={false} />
      <main className="home-main">
        <HeroSection assets={heroAssets} onOrder={handleOrder} />
        <AboutSection assets={aboutAssets} onOrder={handleOrder} />

        {breakpoint !== "tablet" && (
          <ProcessSection
            assets={{
              desktop: homeAssets.desktop.process.items,
              mobile: homeAssets.mobile.process.items,
              connector: homeAssets.desktop.process.connector,
            }}
            onOrder={handleOrder}
          />
        )}

        <WorksSection assets={worksAssets} breakpoint={breakpoint} onOrder={handleOrder} />

        {breakpoint === "mobile" ? (
          <>
            {customers}
            {reviews}
          </>
        ) : (
          <>
            {reviews}
            {customers}
          </>
        )}

        <FaqSection
          breakpoint={breakpoint}
          glow={breakpoint === "mobile" ? homeAssets.mobile.icons.faqGlow : null}
        />
        <QuestionsSection assets={questionsAssets} />
        <SocialSection items={currentAssets.social.items} />
      </main>
      <HomeFooter assets={siteFooterAssets.home} onOrder={handleOrder} />
    </div>
  );
};

export default HomePage;
