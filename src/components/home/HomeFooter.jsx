import { homeNavigation, legalLinks, socialLinks } from "../../data/homeContent";
import ResponsiveAsset from "./ResponsiveAsset";

const HomeFooter = ({ assets, navigationBase = "", onOrder, variant = "home" }) => {
  const renderNavigationItem = (item) => {
    if (item.orderAction) {
      return <button type="button" onClick={onOrder} key={item.id}>{item.label}</button>;
    }

    const href = item.href.startsWith("#") ? `${navigationBase}${item.href}` : item.href;
    return <a href={href} key={item.id}>{item.label}</a>;
  };

  const socialItems = [
    { id: "instagram", label: "Instagram", href: socialLinks.instagram, icon: assets.icons.instagram },
    { id: "telegram", label: "Telegram", href: socialLinks.telegram, icon: assets.icons.telegram },
    { id: "vk", label: "ВКонтакте", href: socialLinks.vk, icon: assets.icons.vk },
  ];

  return (
    <footer className={`home-footer home-footer--${variant}`} id="contacts">
      <div className="home-footer__panel">
        <ResponsiveAsset
          desktop={assets.glow.desktop}
          tablet={assets.glow.tablet}
          mobile={assets.glow.mobile}
          alt=""
          className="home-footer__glow"
          tabletMax={1279}
        />
        <ResponsiveAsset
          desktop={assets.illustration.desktop}
          tablet={assets.illustration.tablet}
          mobile={assets.illustration.mobile}
          alt="Собака с иглой и нитью"
          className="home-footer__illustration"
          tabletMax={1279}
        />

        <nav className="home-footer__navigation" aria-label="Навигация в подвале">
          <strong>
            <span className="home-footer__desktop-label">Клиентам</span>
            <span className="home-footer__compact-label">Меню</span>
          </strong>
          {homeNavigation.map(renderNavigationItem)}
        </nav>

        <div className="home-footer__socials">
          <strong><span className="home-footer__desktop-label">Мы в </span>соцсетях</strong>
          <div className="home-footer__social-list">
            {socialItems.map((item) => (
              <a
                className={`home-footer__social-link home-footer__social-link--${item.id}`}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                aria-label={item.label}
                key={item.id}
              >
                <ResponsiveAsset
                  desktop={item.icon.desktop}
                  tablet={item.icon.tablet}
                  mobile={item.icon.mobile}
                  alt=""
                  className="home-footer__social-icon"
                  tabletMax={1279}
                />
                {item.id === "instagram" && <span className="home-footer__instagram-star" aria-hidden="true">*</span>}
              </a>
            ))}
          </div>
          <small>*проект Meta Platforms Inc., деятельность которой запрещена в РФ</small>
        </div>

        <ResponsiveAsset
          desktop={assets.logo.desktop}
          tablet={assets.logo.tablet}
          mobile={assets.logo.mobile}
          alt="И так сойдёт"
          className="home-footer__logo"
          tabletMax={1279}
        />

        <address className="home-footer__details">
          <span>ИП Чудаев Алексей Сергеевич</span>
          <span>ОГРНИП - 325246800001882</span>
          <span>ИНН -&nbsp; 242303420552</span>
        </address>
        <p className="home-footer__copyright">2026 “И так сойдёт”. Все права защищены</p>
      </div>

      <div className="home-footer__legal">
        {legalLinks.map((item) => <a href={item.href} key={item.href}>{item.label}</a>)}
        <span className="home-footer__legal-design">Дизайн сайта — Илья Погудин</span>
        <span className="home-footer__legal-development">
          Разработка сайта<span className="home-footer__compact-label"> — ............. ...............</span>
        </span>
      </div>
    </footer>
  );
};

export default HomeFooter;
