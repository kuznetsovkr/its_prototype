import { useId, useState } from "react";


const HomeAccordion = ({
  allowMultiple = false,
  className = "",
  defaultOpenItemId = null,
  items = [],
  onChange,
  openItemId,
  renderIndicator,
}) => {
  const generatedId = useId().replace(/:/g, "");
  const [uncontrolledOpenId, setUncontrolledOpenId] = useState(defaultOpenItemId);
  const isControlled = openItemId !== undefined;
  const currentOpenId = isControlled ? openItemId : uncontrolledOpenId;
  const classes = ["home-accordion", className].filter(Boolean).join(" ");

  const currentOpenIds = allowMultiple
    ? new Set(Array.isArray(currentOpenId) ? currentOpenId : currentOpenId ? [currentOpenId] : [])
    : null;

  const toggleItem = (itemId) => {
    if (allowMultiple && !isControlled) {
      setUncontrolledOpenId((currentValue) => {
        const openIds = new Set(
          Array.isArray(currentValue) ? currentValue : currentValue ? [currentValue] : [],
        );
        const nextOpenId = openIds.has(itemId)
          ? [...openIds].filter((id) => id !== itemId)
          : [...openIds, itemId];

        onChange?.(nextOpenId);
        return nextOpenId;
      });
      return;
    }

    const nextOpenId = allowMultiple
      ? currentOpenIds.has(itemId)
        ? [...currentOpenIds].filter((id) => id !== itemId)
        : [...currentOpenIds, itemId]
      : currentOpenId === itemId ? null : itemId;

    if (!isControlled) {
      setUncontrolledOpenId(nextOpenId);
    }

    onChange?.(nextOpenId);
  };

  return (
    <div className={classes}>
      {items.map((item, index) => {
        const itemId = item.id ?? index;
        const isOpen = allowMultiple ? currentOpenIds.has(itemId) : currentOpenId === itemId;
        const buttonId = `home-accordion-${generatedId}-button-${index}`;
        const panelId = `home-accordion-${generatedId}-panel-${index}`;
        const itemClasses = [
          "home-accordion__item",
          isOpen ? "home-accordion__item--open" : "",
          item.disabled ? "home-accordion__item--disabled" : "",
        ].filter(Boolean).join(" ");

        return (
          <section className={itemClasses} key={itemId}>
            <h3 className="home-accordion__heading">
              <button
                aria-controls={panelId}
                aria-expanded={isOpen}
                className="home-accordion__trigger"
                disabled={item.disabled}
                id={buttonId}
                onClick={() => toggleItem(itemId)}
                type="button"
              >
                <span className="home-accordion__title">
                  {item.title ?? item.question}
                </span>
                <span aria-hidden="true" className="home-accordion__indicator">
                  {renderIndicator
                    ? renderIndicator({ isOpen, item })
                    : isOpen ? "−" : "+"}
                </span>
              </button>
            </h3>
            <div
              aria-labelledby={buttonId}
              className="home-accordion__panel"
              hidden={!isOpen}
              id={panelId}
              role="region"
            >
              <div className="home-accordion__content">
                {item.content ?? item.answer}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default HomeAccordion;
