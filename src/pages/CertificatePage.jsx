import ResponsiveAsset from "../components/home/ResponsiveAsset";
import { certificateAssets } from "../images/certificate";

const CertificatePage = () => (
  <section className="certificatePage" aria-labelledby="certificate-page-title">
    <div className="certificatePage__stage">
      <article className="certificatePage__card">
        <h1 className="certificatePage__title" id="certificate-page-title">
          Сертификат
        </h1>

        <div className="certificatePage__visualSurface" aria-hidden="true">
          <div className="certificatePage__glow">
            <ResponsiveAsset
              desktop={certificateAssets.glow.desktop}
              tablet={certificateAssets.glow.tablet}
              mobile={certificateAssets.glow.mobile}
              alt=""
              className="certificatePage__glowImage"
              loading="eager"
              tabletMax={1279}
            />
          </div>
        </div>

        <div className="certificatePage__ticket certificatePage__ticket--darken">
          <ResponsiveAsset
            desktop={certificateAssets.ticket.desktop}
            tablet={certificateAssets.ticket.tablet}
            mobile={certificateAssets.ticket.mobile}
            alt="Подарочный сертификат"
            className="certificatePage__ticketImage"
            loading="eager"
            tabletMax={1279}
          />
        </div>
        <div className="certificatePage__ticket certificatePage__ticket--luminosity" aria-hidden="true">
          <ResponsiveAsset
            desktop={certificateAssets.ticket.desktop}
            tablet={certificateAssets.ticket.tablet}
            mobile={certificateAssets.ticket.mobile}
            alt=""
            className="certificatePage__ticketImage"
            loading="eager"
            tabletMax={1279}
          />
        </div>

        <section className="certificatePage__offer" aria-labelledby="certificate-offer-title">
          <h2 className="certificatePage__offerTitle" id="certificate-offer-title">
            Подарочный сертификат:
          </h2>
          <p className="certificatePage__amount">1000 Р</p>

          <span className="certificatePage__denominationLabel">Номинал</span>
          <div className="certificatePage__denomination" aria-label="Номинал сертификата: 1000 рублей">
            <span>1000</span>
            <span className="certificatePage__arrow" aria-hidden="true">
              <ResponsiveAsset
                desktop={certificateAssets.arrow.desktop}
                tablet={certificateAssets.arrow.tablet}
                mobile={certificateAssets.arrow.mobile}
                alt=""
                className="certificatePage__arrowImage"
                tabletMax={1279}
              />
            </span>
          </div>

          <button
            className="certificatePage__action"
            type="button"
            aria-describedby="certificate-action-status"
            disabled
          >
            Подарить сертификат
          </button>

          <p className="certificatePage__actionStatus" id="certificate-action-status">
            Покупка сертификатов будет подключена позже
          </p>

          <ul className="certificatePage__conditions">
            <li>Срок действия сертификата - 1 год</li>
            <li>Номинал от 1000 до 20 000 рублей</li>
            <li>Остаток средств можно потратить на следующую покупку</li>
          </ul>
        </section>
      </article>
    </div>
  </section>
);

export default CertificatePage;
