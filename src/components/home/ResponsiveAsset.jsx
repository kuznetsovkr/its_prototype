import { MEDIA_QUERIES } from "../../config/breakpoints";

const ResponsiveAsset = ({
  desktop,
  tablet,
  mobile,
  alt = "",
  className,
  loading = "lazy",
  fetchPriority,
  width,
  height,
}) => (
  <picture className={className ? `${className}-picture` : undefined}>
    {mobile && <source media={MEDIA_QUERIES.mobile} srcSet={mobile} />}
    {tablet && <source media={MEDIA_QUERIES.tabletMax} srcSet={tablet} />}
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
