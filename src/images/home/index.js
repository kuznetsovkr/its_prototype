import desktopHeroBackground from './desktop/hero-background.webp';
import desktopHeroBackgroundAvif from './desktop/hero-background.avif';
import desktopHeroSubject from './desktop/hero-subject.webp';
import { brandLogos } from '../brand';
import desktopAboutPhoto from './desktop/about-photo.webp';
import desktopProcessStep01Photo from './desktop/process-step-01-clean.webp';
import desktopProcessStep02Photo from './desktop/process-step-02-clean.webp';
import desktopProcessStep03Photo from './desktop/process-step-03-clean.webp';
import desktopProcessStep04Photo from './desktop/process-step-04-clean.webp';
import desktopAboutPhotoThird from './desktop/about-photo-third.webp';
import desktopWorksHeadingSticker from './desktop/works-heading-sticker.png';
import desktopWorksHeadingAvatar from './desktop/works-heading-avatar.webp';
import desktopReviewsItem03 from './desktop/reviews-item-03.jpg';
import desktopReviewsItem02 from './desktop/reviews-item-02.webp';
import desktopReviewsItem01 from './desktop/reviews-item-01.webp';
import desktopReviewsItem04 from './desktop/reviews-item-04.jpg';
import desktopReviewsItem05 from './desktop/reviews-item-05.webp';
import desktopReviewsItem06 from './desktop/reviews-item-06.webp';
import desktopQuestionsDogTwo from './desktop/questions-dog-two.webp';
import desktopQuestionsDogOn from './desktop/questions-dog-on.webp';
import desktopFooterIllustration from './desktop/footer-illustration.webp';
import desktopProcessConnector from './desktop/process-connector.svg';
import desktopReviewsArrowPrevious from './desktop/reviews-arrow-previous.svg';
import desktopReviewsArrowNext from './desktop/reviews-arrow-next.svg';
import desktopReviewsPagination from './desktop/reviews-pagination.svg';
import desktopFooterGlow from './desktop/footer-glow.svg';
import desktopFooterTelegram from './desktop/footer-telegram.svg';
import desktopFooterVk from './desktop/footer-vk.svg';
import desktopFooterInstagram from './desktop/footer-instagram.svg';
import desktopFooterTelegramInternal from './desktop/footer-telegram-internal.svg';
import desktopFooterVkInternal from './desktop/footer-vk-internal.svg';
import desktopFooterInstagramInternal from './desktop/footer-instagram-internal.svg';
import tabletHeroBackground from './desktop/hero-background.webp';
import tabletHeroSubject from './tablet/hero-subject.webp';
import tabletAboutPhoto from './mobile/about-photo-layer-02.webp';
import tabletProcessConnector from './tablet/process-connector.svg';
import tabletFooterIllustration from './desktop/footer-illustration.webp';
import tabletReviewsItem03 from './desktop/reviews-item-03.jpg';
import tabletReviewsItem02 from './desktop/reviews-item-02.webp';
import tabletReviewsItem01 from './desktop/reviews-item-01.webp';
import tabletQuestionsDogOn from './desktop/questions-dog-on.webp';
import tabletQuestionsDogTwo from './desktop/questions-dog-two.webp';
import tabletFooterGlow from './tablet/footer-glow.svg';
import tabletFooterTelegram from './tablet/footer-telegram.svg';
import tabletFooterVk from './tablet/footer-vk.svg';
import tabletFooterInstagram from './tablet/footer-instagram.svg';
import mobileHeroBackground from './mobile/hero-background.webp';
import mobileAboutPhotoLayer01 from './desktop/about-photo.webp';
import mobileAboutPhotoLayer02 from './mobile/about-photo-layer-02.webp';
import mobileProcessStep01Photo from './desktop/process-step-01-clean.webp';
import mobileProcessStep02Photo from './desktop/process-step-02-clean.webp';
import mobileProcessStep03Photo from './desktop/process-step-03-clean.webp';
import mobileProcessStep04Photo from './desktop/process-step-04-clean.webp';
import mobileReviewsItem01 from './desktop/reviews-item-02.webp';
import mobileReviewsItem02 from './desktop/reviews-item-03.jpg';
import mobileQuestionsDogOn from './desktop/questions-dog-on.webp';
import mobileQuestionsDogTwo from './desktop/questions-dog-two.webp';
import mobileFooterIllustration from './desktop/footer-illustration.webp';
import mobileHeaderBag from './mobile/header-bag.svg';
import mobileMenuActiveDot from './mobile/menu-active-dot.svg';
import mobileMenuBag from './mobile/menu-bag.svg';
import mobileMenuInstagram from './mobile/menu-instagram.svg';
import mobileMenuTelegram from './mobile/menu-telegram.svg';
import mobileMenuVk from './mobile/menu-vk.svg';
import mobileFaqGlow from './mobile/faq-glow.svg';
import mobileFooterTelegram from './mobile/footer-telegram.svg';
import mobileFooterInstagram from './mobile/footer-instagram.svg';
import mobileFooterVk from './mobile/footer-vk.svg';
import mobileFooterGlow from './mobile/footer-glow.svg';

import { homeSocialItems, compactSocialItems } from '../../data/homeSocial';

const mobileAboutPhotoLayers = [mobileAboutPhotoLayer01, mobileAboutPhotoLayer02];

export const homeAssets = {
  desktop: {
    hero: {
      background: desktopHeroBackground,
      backgroundAvif: desktopHeroBackgroundAvif,
      subject: desktopHeroSubject,
      logoGraphite: brandLogos.header,
      logoMilk: brandLogos.cover,
    },
    about: {
      photo: desktopAboutPhoto,
      thirdPhoto: desktopAboutPhotoThird,
    },
    process: {
      items: [
        desktopProcessStep01Photo,
        desktopProcessStep02Photo,
        desktopProcessStep03Photo,
        desktopProcessStep04Photo,
      ],
      connector: desktopProcessConnector,
    },
    works: {
      headingStickers: [desktopWorksHeadingSticker, desktopWorksHeadingSticker],
      headingAvatar: desktopWorksHeadingAvatar,
    },
    reviews: {
      items: [desktopReviewsItem01, desktopReviewsItem02, desktopReviewsItem03, desktopReviewsItem04, desktopReviewsItem05, desktopReviewsItem06],
      previousArrow: desktopReviewsArrowPrevious,
      nextArrow: desktopReviewsArrowNext,
      pagination: desktopReviewsPagination,
    },
    questions: {
      dogs: [desktopQuestionsDogOn, desktopQuestionsDogTwo],
    },
    social: {
      items: homeSocialItems,
    },
    footer: {
      logoMilk: brandLogos.footer,
      illustration: desktopFooterIllustration,
      glow: desktopFooterGlow,
      telegram: desktopFooterTelegram,
      vk: desktopFooterVk,
      instagram: desktopFooterInstagram,
    },
    icons: {
      processConnector: desktopProcessConnector,
      reviewArrowPrevious: desktopReviewsArrowPrevious,
      reviewArrowNext: desktopReviewsArrowNext,
      reviewPagination: desktopReviewsPagination,
      telegram: desktopFooterTelegram,
      vk: desktopFooterVk,
      instagram: desktopFooterInstagram,
    },
  },
  tablet: {
    hero: {
      background: tabletHeroBackground,
      backgroundAvif: desktopHeroBackgroundAvif,
      subject: tabletHeroSubject,
      logoGraphite: brandLogos.header,
      logoMilk: brandLogos.cover,
    },
    about: {
      photo: tabletAboutPhoto,
    },
    process: {
      items: [
        desktopProcessStep01Photo,
        desktopProcessStep02Photo,
        desktopProcessStep03Photo,
        desktopProcessStep04Photo,
      ],
      connector: tabletProcessConnector,
    },
    reviews: {
      items: [tabletReviewsItem01, tabletReviewsItem02, tabletReviewsItem03, desktopReviewsItem04, desktopReviewsItem05, desktopReviewsItem06],
    },
    questions: {
      dogs: [tabletQuestionsDogOn, tabletQuestionsDogTwo],
    },
    social: {
      items: compactSocialItems,
    },
    footer: {
      logoMilk: brandLogos.footer,
      illustration: tabletFooterIllustration,
      glow: tabletFooterGlow,
      telegram: tabletFooterTelegram,
      vk: tabletFooterVk,
      instagram: tabletFooterInstagram,
    },
    icons: {
      footerGlow: tabletFooterGlow,
      telegram: tabletFooterTelegram,
      vk: tabletFooterVk,
      instagram: tabletFooterInstagram,
    },
  },
  mobile: {
    hero: {
      headerLogo: brandLogos.header,
      background: mobileHeroBackground,
      logoGraphite: brandLogos.header,
    },
    about: {
      photo: { layers: mobileAboutPhotoLayers },
      photoLayers: mobileAboutPhotoLayers,
      photoDesktopCrop: mobileAboutPhotoLayer01,
      photoMobileCrop: mobileAboutPhotoLayer02,
    },
    process: {
      items: [mobileProcessStep01Photo, mobileProcessStep02Photo, mobileProcessStep03Photo, mobileProcessStep04Photo],
    },
    reviews: {
      items: [mobileReviewsItem01, mobileReviewsItem02, desktopReviewsItem04, desktopReviewsItem05, desktopReviewsItem06],
    },
    questions: {
      dogs: [mobileQuestionsDogOn, mobileQuestionsDogTwo],
      faqGlow: mobileFaqGlow,
    },
    social: {
      items: compactSocialItems,
    },
    footer: {
      logoMilk: brandLogos.footer,
      illustration: mobileFooterIllustration,
      glow: mobileFooterGlow,
      telegram: mobileFooterTelegram,
      vk: mobileFooterVk,
      instagram: mobileFooterInstagram,
    },
    icons: {
      bag: mobileHeaderBag,
      faqGlow: mobileFaqGlow,
      footerGlow: mobileFooterGlow,
      telegram: mobileFooterTelegram,
      vk: mobileFooterVk,
      instagram: mobileFooterInstagram,
    },
  },
};

export const siteHeaderAssets = {
  desktopLogo: brandLogos.header,
  tabletLogo: brandLogos.header,
  mobileLogo: brandLogos.header,
  bag: homeAssets.mobile.icons.bag,
  menu: {
    activeDot: mobileMenuActiveDot,
    bag: mobileMenuBag,
    logo: brandLogos.header,
    instagram: mobileMenuInstagram,
    telegram: mobileMenuTelegram,
    vk: mobileMenuVk,
  },
};

const createFooterAssets = ({ instagram, telegram, vk }) => ({
  illustration: {
    desktop: homeAssets.desktop.footer.illustration,
    tablet: homeAssets.tablet.footer.illustration,
    mobile: homeAssets.mobile.footer.illustration,
  },
  glow: {
    desktop: homeAssets.desktop.footer.glow,
    tablet: homeAssets.tablet.footer.glow,
    mobile: homeAssets.mobile.footer.glow,
  },
  logo: {
    desktop: homeAssets.desktop.footer.logoMilk,
    tablet: homeAssets.tablet.footer.logoMilk,
    mobile: homeAssets.mobile.footer.logoMilk,
  },
  icons: {
    instagram: {
      desktop: instagram,
      tablet: homeAssets.tablet.footer.instagram,
      mobile: homeAssets.mobile.footer.instagram,
    },
    telegram: {
      desktop: telegram,
      tablet: homeAssets.tablet.footer.telegram,
      mobile: homeAssets.mobile.footer.telegram,
    },
    vk: {
      desktop: vk,
      tablet: homeAssets.tablet.footer.vk,
      mobile: homeAssets.mobile.footer.vk,
    },
  },
});

export const siteFooterAssets = {
  home: createFooterAssets({
    instagram: homeAssets.desktop.footer.instagram,
    telegram: homeAssets.desktop.footer.telegram,
    vk: homeAssets.desktop.footer.vk,
  }),
  internal: createFooterAssets({
    instagram: desktopFooterInstagramInternal,
    telegram: desktopFooterTelegramInternal,
    vk: desktopFooterVkInternal,
  }),
};

export default homeAssets;
