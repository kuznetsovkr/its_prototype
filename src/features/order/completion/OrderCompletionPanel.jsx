import { socialLinks } from "../../../data/homeContent";
import instagramIcon from "../../../images/order/result/instagram.svg";
import telegramIcon from "../../../images/order/result/telegram.svg";
import vkIcon from "../../../images/order/result/vk.svg";

const contacts = [
  { label: "Instagram", href: socialLinks.instagram, icon: instagramIcon },
  { label: "Telegram", href: socialLinks.telegram, icon: telegramIcon },
  { label: "ВКонтакте", href: socialLinks.vk, icon: vkIcon },
];

const OrderCompletionPanel = ({ content, titleRef }) => (
  <div className={`thx__content${content.manual ? " thx__content--manual" : ""}`}>
    <h1 ref={titleRef} id="thx-title" className="thx__title" tabIndex={-1}>{content.title}</h1>
    <div className="thx__text">
      {content.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
    </div>
    <div className="thx__contacts">
      <p>Связаться с нами:</p>
      <nav className="thx__socialLinks" aria-label="Связаться с нами">
        {contacts.map(({ label, href, icon }) => (
          <a className="thx__socialLink" key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} — связаться с нами`}>
            <img src={icon} alt="" />
          </a>
        ))}
      </nav>
    </div>
  </div>
);

export default OrderCompletionPanel;
