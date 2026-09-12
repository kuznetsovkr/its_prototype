import { MEDIA_QUERIES } from "../../config/breakpoints";

const ResponsiveAsset = ({
  desktop,
  desktopAvif,
  tablet,
  tabletAvif,
  mobile,
  mobileAvif,
  alt = "",
  className,
  loading = "lazy",
  fetchPriority,
  width,
  height,
}) => (
  <picture className={className ? `${className}-picture` : undefined}>
    {mobileAvif && <source media={MEDIA_QUERIES.mobile} srcSet={mobileAvif} type="image/avif" />}
    {mobile && <source media={MEDIA_QUERIES.mobile} srcSet={mobile} />}
    {tabletAvif && <source media={MEDIA_QUERIES.tabletMax} srcSet={tabletAvif} type="image/avif" />}
    {tablet && <source media={MEDIA_QUERIES.tabletMax} srcSet={tablet} />}
    {desktopAvif && <source srcSet={desktopAvif} type="image/avif" />}
    <img
      src={desktop || tablet || mobile}
      alt={alt}
      className={className}
      loading={loading}
      fetchPriority={fetchPriority}
      width={width}
      height={height}
    />
  </picture>
);

export default ResponsiveAsset;
