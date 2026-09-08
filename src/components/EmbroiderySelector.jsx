import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IS_DEMO_MODE } from "../config/demoMode";
import EmbroideryDesktop from "../features/order/embroidery/EmbroideryDesktop";
import EmbroideryLegacy from "../features/order/embroidery/EmbroideryLegacy";
import { useEmbroiderySelection } from "../features/order/embroidery/useEmbroiderySelection";

const EmbroiderySelector = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const selection = useEmbroiderySelection();
  const {
    selectedType, setCustomText, setUploadedImage,
    comment, customOption, setCustomOption, canProceed, handleSelectType,
  } = selection;
  const [desktopTab, setDesktopTab] = useState(
    selectedType === "custom" && customOption.text ? "text" : "image"
  );
  const [desktopDetailsOpen, setDesktopDetailsOpen] = useState(false);

  useEffect(() => {
    const nextTab = selectedType === "custom" && customOption.text ? "text" : "image";
    setDesktopTab((currentTab) => currentTab === nextTab ? currentTab : nextTab);
  }, [selectedType, customOption.text]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [comment]);

  const handleNext = () => {
    if (canProceed) navigate("/recipient");
  };

  const handleDesktopImageTab = () => {
    setDesktopTab("image");
    setDesktopDetailsOpen(false);
    if (selectedType === "custom" && !customOption.image) {
      setCustomOption({ image: true, text: false });
      setCustomText("");
    }
  };

  const handleDesktopTextTab = () => {
    setDesktopTab("text");
    setDesktopDetailsOpen(false);
    handleSelectType("custom");
    setCustomOption({ image: false, text: true });
    setUploadedImage([]);
  };

  const handleDesktopType = (type) => {
    setDesktopTab("image");
    setDesktopDetailsOpen(false);
    handleSelectType(type);
    if (type === "custom") {
      setCustomOption({ image: true, text: false });
      setCustomText("");
    }
  };

  const handleDesktopNext = () => {
    if (desktopTab === "image" && !desktopDetailsOpen && !IS_DEMO_MODE) {
      if (selectedType === "custom" && !customOption.image) {
        setCustomOption({ image: true, text: false });
      }
      setDesktopDetailsOpen(true);
      return;
    }
    if (canProceed) {
      handleNext();
      return;
    }
    setDesktopDetailsOpen(true);
  };

  const isUploadStage = desktopTab === "image" && desktopDetailsOpen;
  const handleDesktopBack = () => {
    if (isUploadStage) {
      setDesktopDetailsOpen(false);
      return;
    }
    navigate(-1);
  };

  return (
    <>
      <EmbroideryDesktop
        selection={selection}
        desktopTab={desktopTab}
        desktopDetailsOpen={desktopDetailsOpen}
        isUploadStage={isUploadStage}
        fileInputRef={fileInputRef}
        onImageTab={handleDesktopImageTab}
        onTextTab={handleDesktopTextTab}
        onTypeSelect={handleDesktopType}
        onBack={handleDesktopBack}
        onNext={handleDesktopNext}
      />
      <EmbroideryLegacy selection={selection} navigate={navigate} textareaRef={textareaRef} />
    </>
  );
};

export default EmbroiderySelector;
