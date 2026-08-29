import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { homeNavigation } from "../../data/homeContent";
import ResponsiveAsset from "./ResponsiveAsset";

const focusableSelector = "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])";

const HomeHeader = ({ assets, onOrder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const headerRef = useRef(null);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);
  const shouldRestoreTriggerFocusRef = useRef(true);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const header = headerRef.current;
    const menu = menuRef.current;
    const trigger = triggerRef.current;
    const focusable = menu ? Array.from(menu.querySelectorAll(focusableSelector)) : [];
    const page = header?.closest(".home-page");
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
        shouldRestoreTriggerFocusRef.current = false;
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
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
        trigger?.focus({ preventScroll: true });
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

  const renderNavItem = (item, mobile = false) => {
    const className = mobile ? "home-header__mobile-link" : "home-header__link";

    if (item.orderAction) {
      return (
        <button
          className={className}
          key={item.id}
          type="button"
          onClick={() => {
            closeMenu({ restoreFocus: false });
            onOrder();
          }}
        >
          {item.label}
        </button>
      );
    }

    return (
      <a
        className={className}
        href={item.href}
        key={item.id}
        onClick={mobile ? () => closeMenu({ restoreFocus: false }) : undefined}
      >
        {item.label}
      </a>
    );
  };

  return (
    <header className="home-header" ref={headerRef}>
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

        <a className="home-header__logo" href="#top" aria-label="И так сойдёт — на главную">
          <ResponsiveAsset
            desktop={assets.desktopLogo}
            tablet={assets.tabletLogo}
            mobile={assets.mobileLogo}
            alt=""
            className="home-header__logo-image"
            loading="eager"
          />
        </a>

        <nav className="home-header__navigation" aria-label="Навигация по главной странице">
          {homeNavigation.map((item) => renderNavItem(item))}
        </nav>

        <button className="home-header__order" type="button" onClick={onOrder}>
          Сделать заказ
        </button>

        <div className="home-header__mobile-actions">
          <Link to="/profile" aria-label="Перейти в профиль" className="home-header__icon-link">
            <img src={assets.heart} alt="" width="24" height="24" />
          </Link>
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
      >
        <div className="home-header__menu-panel" ref={menuRef}>
          <button className="home-header__menu-close" type="button" aria-label="Закрыть меню" onClick={() => closeMenu()}>
            <span aria-hidden="true">×</span>
          </button>
          <nav className="home-header__mobile-navigation" aria-label="Мобильная навигация">
            {homeNavigation.map((item) => renderNavItem(item, true))}
          </nav>
          <button
            className="home-header__mobile-order"
            type="button"
            onClick={() => {
              closeMenu({ restoreFocus: false });
              onOrder();
            }}
          >
            Сделать заказ
          </button>
        </div>
      </div>
    </header>
  );
};

export default HomeHeader;
