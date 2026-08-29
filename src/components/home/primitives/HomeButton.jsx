import { forwardRef } from "react";


const HomeButton = forwardRef(({
  as,
  block = false,
  children,
  className = "",
  disabled = false,
  href,
  onClick,
  size = "medium",
  type,
  variant = "primary",
  ...restProps
}, ref) => {
  const Element = as || (href ? "a" : "button");
  const isButton = Element === "button";
  const classes = [
    "home-button",
    `home-button--${variant}`,
    `home-button--${size}`,
    block ? "home-button--block" : "",
    disabled ? "home-button--disabled" : "",
    className,
  ].filter(Boolean).join(" ");

  const handleClick = (event) => {
    if (disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    onClick?.(event);
  };

  const elementProps = {
    ...restProps,
    className: classes,
    onClick: handleClick,
    ref,
  };

  if (isButton) {
    elementProps.disabled = disabled;
    elementProps.type = type || "button";
  } else {
    if (href) {
      elementProps.href = href;
    }

    if (disabled) {
      elementProps["aria-disabled"] = true;
      elementProps.tabIndex = -1;
    }
  }

  return <Element {...elementProps}>{children}</Element>;
});

HomeButton.displayName = "HomeButton";

export default HomeButton;
