import { useId, useRef, useState } from "react";


const getTabId = (tab, index) => tab.id ?? index;

const HomeTabs = ({
  activationMode = "automatic",
  activeTabId,
  ariaLabel = "Разделы",
  className = "",
  defaultActiveTabId,
  onChange,
  orientation = "horizontal",
  tabs = [],
}) => {
  const generatedId = useId().replace(/:/g, "");
  const tabRefs = useRef(new Map());
  const firstEnabledTab = tabs.find((tab) => !tab.disabled);
  const firstEnabledId = firstEnabledTab
    ? getTabId(firstEnabledTab, tabs.indexOf(firstEnabledTab))
    : null;
  const [uncontrolledActiveId, setUncontrolledActiveId] = useState(
    defaultActiveTabId ?? firstEnabledId,
  );
  const isControlled = activeTabId !== undefined;
  const requestedActiveId = isControlled ? activeTabId : uncontrolledActiveId;
  const requestedTabIsAvailable = tabs.some((tab, index) => (
    !tab.disabled && getTabId(tab, index) === requestedActiveId
  ));
  const selectedId = requestedTabIsAvailable ? requestedActiveId : firstEnabledId;
  const classes = ["home-tabs", className].filter(Boolean).join(" ");

  const selectTab = (nextId) => {
    if (nextId === selectedId) {
      return;
    }

    if (!isControlled) {
      setUncontrolledActiveId(nextId);
    }

    onChange?.(nextId);
  };

  const handleKeyDown = (event, currentId) => {
    const enabledTabs = tabs
      .map((tab, index) => ({ ...tab, resolvedId: getTabId(tab, index) }))
      .filter((tab) => !tab.disabled);
    const currentIndex = enabledTabs.findIndex((tab) => tab.resolvedId === currentId);
    const isPreviousKey = orientation === "vertical"
      ? event.key === "ArrowUp"
      : event.key === "ArrowLeft";
    const isNextKey = orientation === "vertical"
      ? event.key === "ArrowDown"
      : event.key === "ArrowRight";
    let nextIndex = null;

    if (isPreviousKey) {
      nextIndex = (currentIndex - 1 + enabledTabs.length) % enabledTabs.length;
    } else if (isNextKey) {
      nextIndex = (currentIndex + 1) % enabledTabs.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = enabledTabs.length - 1;
    } else if (
      activationMode === "manual"
      && (event.key === "Enter" || event.key === " ")
    ) {
      event.preventDefault();
      selectTab(currentId);
      return;
    }

    if (nextIndex === null || currentIndex === -1 || enabledTabs.length === 0) {
      return;
    }

    event.preventDefault();
    const nextId = enabledTabs[nextIndex].resolvedId;
    tabRefs.current.get(nextId)?.focus();

    if (activationMode === "automatic") {
      selectTab(nextId);
    }
  };

  return (
    <div className={classes}>
      <div
        aria-label={ariaLabel}
        aria-orientation={orientation}
        className="home-tabs__list"
        role="tablist"
      >
        {tabs.map((tab, index) => {
          const tabId = getTabId(tab, index);
          const isActive = tabId === selectedId;
          const triggerId = `home-tabs-${generatedId}-tab-${index}`;
          const panelId = `home-tabs-${generatedId}-panel-${index}`;

          return (
            <button
              aria-controls={panelId}
              aria-selected={isActive}
              className={[
                "home-tabs__tab",
                isActive ? "home-tabs__tab--active" : "",
              ].filter(Boolean).join(" ")}
              disabled={tab.disabled}
              id={triggerId}
              key={tabId}
              onClick={() => selectTab(tabId)}
              onKeyDown={(event) => handleKeyDown(event, tabId)}
              ref={(element) => {
                if (element) {
                  tabRefs.current.set(tabId, element);
                } else {
                  tabRefs.current.delete(tabId);
                }
              }}
              role="tab"
              tabIndex={isActive ? 0 : -1}
              type="button"
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="home-tabs__panels">
        {tabs.map((tab, index) => {
          const tabId = getTabId(tab, index);
          const isActive = tabId === selectedId;
          const triggerId = `home-tabs-${generatedId}-tab-${index}`;
          const panelId = `home-tabs-${generatedId}-panel-${index}`;

          return (
            <div
              aria-labelledby={triggerId}
              className="home-tabs__panel"
              hidden={!isActive}
              id={panelId}
              key={tabId}
              role="tabpanel"
              tabIndex={isActive ? 0 : -1}
            >
              {tab.content}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HomeTabs;
