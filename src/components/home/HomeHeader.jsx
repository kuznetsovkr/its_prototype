import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  homeNavigation,
  mobileMenuNavigation,
  socialLinks,
} from "../../data/homeContent";
import ResponsiveAsset from "./ResponsiveAsset";

const focusableSelector = "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])";

const focusVisibleHeaderControl = () => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const controls = Array.from(document.querySelectorAll(".home-header__burger, .home-header__logo"));
      const target = controls.find((element) => (
        getComputedStyle(element).display !== "none"
        && getComputedStyle(element).visibility !== "hidden"
        && element.getClientRects().length > 0
      ));

      target?.focus({ preventScroll: true });
    });
  });
};

const HomeHeader = ({
  activeNavigationId,
  assets,
  mobileActiveNavigationId,
  navigationBase = "",
  onOrder,
  standalone = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const headerRef = useRef(null);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);
  const shouldRestoreTriggerFocusRef = useRef(true);
  const { key: locationKey } = useLocation();
  const previousLocationKeyRef = useRef(locationKey);

  useEffect(() => {
    if (previousLocationKeyRef.current === locationKey) return;

    previousLocationKeyRef.current = locationKey;

    if (isOpen) {
      setIsOpen(false);
    }
  }, [isOpen, locationKey]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    const header = headerRef.current;
    const menu = menuRef.current;
    const trigger = triggerRef.current;
    const focusable = menu ? Array.from(menu.querySelectorAll(focusableSelector)) : [];
    const page = header?.closest(".home-page, .App");
    const backgroundElements = [
      header?.querySelector(".home-header__bar"),
      ...(page ? Array.from(page.children).filter((element) => element !== header) : []),
    ].filter(Boolean);
    const backgroundState = backgroundElements.map((element) => ({
      element,
      ariaHidden: element.getAttribute("aria-hidden"),
      hadAriaHidden: element.hasAttribute("aria-hidden"),
      hadInert: element.hasAttribute("inert"),
    }));
    let focusFrame = 0;

    backgroundElements.forEach((element) => {
      element.setAttribute("aria-hidden", "true");
      element.setAttribute("inert", "");
    });
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const focusFirstMenuItem = () => {
      const first = focusable[0];

      if (first && getComputedStyle(first).visibility !== "hidden" && first.getClientRects().length > 0) {
        first.focus();
        return;
      }

      focusFrame = requestAnimationFrame(focusFirstMenuItem);
    };

    focusFrame = requestAnimationFrame(focusFirstMenuItem);

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        shouldRestoreTriggerFocusRef.current = true;
        setIsOpen(false);
        return;
      }

      if (event.key !== "Tab" || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!menu?.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 640) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
      backgroundState.forEach(({
        element,
        ariaHidden,
        hadAriaHidden,
        hadInert,
      }) => {
        if (hadAriaHidden) {
          element.setAttribute("aria-hidden", ariaHidden);
        } else {
          element.removeAttribute("aria-hidden");
        }

        if (hadInert) {
          element.setAttribute("inert", "");
        } else {
          element.removeAttribute("inert");
        }
      });

      if (shouldRestoreTriggerFocusRef.current) {
        const triggerIsVisible = trigger?.isConnected && getComputedStyle(trigger).display !== "none";
        const headerLogo = header?.querySelector(".home-header__logo");
        const focusTarget = triggerIsVisible ? trigger : headerLogo;

        if (focusTarget?.isConnected) focusTarget.focus({ preventScroll: true });
        else focusVisibleHeaderControl();
      }

      shouldRestoreTriggerFocusRef.current = true;
    };
  }, [isOpen]);

  const openMenu = () => {
    shouldRestoreTriggerFocusRef.current = true;
    setIsOpen(true);
  };

  const closeMenu = ({ restoreFocus = true } = {}) => {
    shouldRestoreTriggerFocusRef.current = restoreFocus;
    setIsOpen(false);
  };

  const closeMenuForNavigation = () => {
    closeMenu({ restoreFocus: false });
    focusVisibleHeaderControl();
  };

  const renderNavItem = (item, mobile = false) => {
    const baseClassName = mobile ? "home-header__mobile-link" : "home-header__link";
    const currentActiveNavigationId = mobile ? mobileActiveNavigationId : activeNavigationId;
    const isActive = currentActiveNavigationId === item.id;
    const className = `${baseClassName} ${baseClassName}--${item.id}${isActive ? " is-active" : ""}`;
    const content = mobile ? (
      <>
        {isActive && (
          <img
            className="home-header__mobile-link-dot"
            src={assets.menu.activeDot}
            alt=""
            aria-hidden="true"
            width="6"
            height="6"
          />
        )}
        <span>{item.label}</span>
      </>
    ) : item.label;

    if (item.orderAction) {
      return (
        <button
          className={className}
          key={item.id}
          type="button"
          aria-current={isActive ? "page" : undefined}
          onClick={() => {
            if (mobile) closeMenuForNavigation();
            onOrder();
          }}
        >
          {content}
        </button>
      );
    }

    if (item.href.startsWith("/")) {
      return (
        <Link
          className={className}
          key={item.id}
          to={item.href}
          aria-current={isActive ? "page" : undefined}
          onClick={mobile ? closeMenuForNavigation : undefined}
        >
          {content}
        </Link>
      );
    }

    return (
      <a
        className={className}
        href={item.href.startsWith("#") ? `${navigationBase}${item.href}` : item.href}
        key={item.id}
        aria-current={isActive ? "page" : undefined}
        onClick={mobile ? closeMenuForNavigation : undefined}
      >
        {content}
      </a>
    );
  };

  return (
    <header
      className={`home-header${standalone ? " home-header--standalone" : ""}${isOpen ? " home-header--menu-open" : ""}`}
      ref={headerRef}
    >
      <div className="home-header__bar">
        <button
          ref={triggerRef}
          className="home-header__burger"
          type="button"
          aria-label="Открыть меню"
          aria-expanded={isOpen}
          aria-controls="home-mobile-menu"
          onClick={openMenu}
        >
          <span />
          <span />
          <span />
        </button>

        {standalone ? (
          <Link className="home-header__logo" to="/" aria-label="И так сойдёт — на главную">
            <ResponsiveAsset
              desktop={assets.desktopLogo}
              tablet={assets.tabletLogo}
              mobile={assets.mobileLogo}
              alt=""
              className="home-header__logo-image"
              loading="eager"
              tabletMax={1279}
            />
          </Link>
        ) : (
          <a className="home-header__logo" href="#top" aria-label="И так сойдёт — на главную">
            <ResponsiveAsset
              desktop={assets.desktopLogo}
              tablet={assets.tabletLogo}
              mobile={assets.mobileLogo}
              alt=""
              className="home-header__logo-image"
              loading="eager"
              tabletMax={1279}
            />
          </a>
        )}

        <nav className="home-header__navigation" aria-label="Навигация по главной странице">
          {homeNavigation.map((item) => renderNavItem(item))}
        </nav>

        <button className="home-header__order" type="button" onClick={onOrder}>
          Сделать заказ
        </button>

        <div className="home-header__mobile-actions">
          <button
            type="button"
            aria-label="Избранное"
            className="home-header__icon-link"
            disabled
          >
            <img src={assets.heart} alt="" width="24" height="24" />
          </button>
          <button type="button" aria-label="Перейти к заказу" className="home-header__icon-link" onClick={onOrder}>
            <img src={assets.bag} alt="" width="24" height="24" />
          </button>
        </div>
      </div>

      <div
        id="home-mobile-menu"
        className={`home-header__menu ${isOpen ? "is-open" : ""}`}
        aria-hidden={!isOpen}
        aria-label="Мобильное меню"
        aria-modal={isOpen}
        role="dialog"
        ref={menuRef}
      >
        <div className="home-header__menu-panel">
          <Link
            className="home-header__menu-logo"
            to="/"
            aria-label="И так сойдёт — на главную"
            onClick={closeMenuForNavigation}
          >
            <img src={assets.menu.logo} alt="" width="100" height="44" />
          </Link>

          <button
            className="home-header__menu-bag"
            type="button"
            aria-label="Перейти к заказу"
            onClick={() => {
              closeMenuForNavigation();
              onOrder();
            }}
          >
            <img src={assets.menu.bag} alt="" width="20" height="19" />
          </button>

          <nav className="home-header__mobile-navigation" aria-label="Мобильная навигация">
            {mobileMenuNavigation.map((item) => renderNavItem(item, true))}
          </nav>

          <div className="home-header__menu-socials" role="group" aria-label="Социальные сети">
            <a
              className="home-header__menu-social-link"
              href={socialLinks.telegram}
              target="_blank"
              rel="noreferrer"
              aria-label="Telegram"
            >
              <img src={assets.menu.telegram} alt="" width="30" height="30" />
            </a>
            <a
              className="home-header__menu-social-link"
              href={socialLinks.instagram}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
            >
              <img src={assets.menu.instagram} alt="" width="30" height="30" />
            </a>
            <a
              className="home-header__menu-social-link"
              href={socialLinks.vk}
              target="_blank"
              rel="noreferrer"
              aria-label="ВКонтакте"
            >
              <img src={assets.menu.vk} alt="" width="30" height="30" />
            </a>
          </div>

          <button
            className="home-header__mobile-order"
            type="button"
            onClick={() => {
              closeMenuForNavigation();
              onOrder();
            }}
          >
            Сделать заказ
          </button>

          <p className="home-header__menu-copyright">
            2026 “И так сойдёт”. Все права защищены
          </p>
        </div>

        <button
          className="home-header__menu-dismiss"
          type="button"
          aria-label="Закрыть меню"
          onClick={() => closeMenu()}
        />
      </div>
    </header>
  );
};

export default HomeHeader;
