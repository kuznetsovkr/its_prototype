const LayeredAsset = ({ layers = [], label, className = "" }) => (
  <div
    className={["home-layered-asset", className].filter(Boolean).join(" ")}
    role={label ? "img" : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : true}
  >
    {layers.filter(Boolean).map((source, index) => (
      <img
        className={`home-layered-asset__layer home-layered-asset__layer--${index + 1}`}
        src={source}
        alt=""
        loading="lazy"
        key={`${source}-${index}`}
      />
    ))}
  </div>
);

export default LayeredAsset;
