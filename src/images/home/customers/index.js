import order from "./order.webp";
import orderMobile from "./order-mobile.webp";
import delivery from "./delivery.webp";
import deliveryMobile from "./delivery-mobile.webp";
import care from "./care.webp";
import careMobile from "./care-mobile.webp";
import returns from "./returns.webp";
import returnsMobile from "./returns-mobile.webp";
import wholesale from "./wholesale.webp";
import wholesaleMobile from "./wholesale-mobile.webp";

// The same approved photo is used at every breakpoint; compact sources are
// larger because mobile autoscale can make the square wider than on desktop.
export const customerAssets = {
  order: { desktop: order, tablet: order, mobile: orderMobile },
  delivery: { desktop: delivery, tablet: delivery, mobile: deliveryMobile },
  care: { desktop: care, tablet: care, mobile: careMobile },
  returns: { desktop: returns, tablet: returns, mobile: returnsMobile },
  wholesale: { desktop: wholesale, tablet: wholesale, mobile: wholesaleMobile },
};
