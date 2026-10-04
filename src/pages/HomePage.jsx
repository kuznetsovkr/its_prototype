import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  const breakpoint = useHomeBreakpoint();
  const currentAssets = homeAssets[breakpoint];

  const handleOrder = useCallback(() => {
    navigate("/order");
  }, [navigate]);

  const heroAssets = {
    background: {
      desktop: homeAssets.desktop.hero.background,
      desktopAvif: homeAssets.desktop.hero.backgroundAvif,
      tablet: homeAssets.tablet.hero.background,
      tabletAvif: homeAssets.tablet.hero.backgroundAvif,
      mobile: homeAssets.mobile.hero.background,
    },
    subject: {
      desktop: homeAssets.desktop.hero.subject,
      tablet: homeAssets.tablet.hero.subject,
    },
    logo: {
      desktop: homeAssets.desktop.hero.logoMilk,
      tablet: homeAssets.tablet.hero.logoMilk,
      mobile: homeAssets.mobile.footer.logoMilk,
    },
  };

  const aboutPhotos = [
    { kind: "woman", src: homeAssets.mobile.about.photoLayers[1] },
    { kind: "dog", src: homeAssets.desktop.about.photo },
  ];

  const worksAssets = {
    initialItems: breakpoint === "desktop"
      ? homeAssets.desktop.works.items
      : breakpoint === "tablet"
        ? homeAssets.tablet.works.compactItems
        : homeAssets.mobile.works.items,
    additionalItems: currentAssets.works.additionalItems,
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

  const reviews = (
    <ReviewsSection key="reviews" assets={currentAssets.reviews} breakpoint={breakpoint} onOrder={handleOrder} />
  );
  const customers = <CustomersSection key="customers" assets={customerAssets} />;

  return (
    <div className={`home-page home-page--${breakpoint}`} id="top">
      <Header onOrder={handleOrder} standalone={false} />
      <main className="home-main">
        <HeroSection assets={heroAssets} onOrder={handleOrder} />
        <AboutSection photos={aboutPhotos} onOrder={handleOrder} />

        <ProcessSection
          assets={{
            desktop: homeAssets.desktop.process.items,
            tablet: homeAssets.tablet.process.items,
            mobile: homeAssets.mobile.process.items,
            connector: breakpoint === "tablet"
              ? homeAssets.tablet.process.connector
              : homeAssets.desktop.process.connector,
          }}
          onOrder={handleOrder}
        />

        <WorksSection assets={worksAssets} breakpoint={breakpoint} onOrder={handleOrder} />

        {/* Stable keys preserve tabs, review dialogs and focus when these sections swap positions. */}
        {breakpoint === "tablet" ? customers : reviews}
        {breakpoint === "tablet" ? reviews : customers}

        <FaqSection
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
