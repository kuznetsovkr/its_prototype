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
  tabletMax = 1199,
}) => (
  <picture className={className ? `${className}-picture` : undefined}>
    {mobile && <source media="(max-width: 639px)" srcSet={mobile} />}
    {tablet && <source media={`(max-width: ${tabletMax}px)`} srcSet={tablet} />}
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
