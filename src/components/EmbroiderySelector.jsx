import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ReactComponent as CheckIcon } from "../images/Vector.svg";

// Detect clothing type by name (ru/en)
const detectClothingKey = (base) => {
  const raw = String(base || "").toLowerCase();
  const translit = raw
    .replace(/худи/g, "hudi") // hudi
    .replace(/свитшот/g, "svitshot") // svitshot
    .replace(/свит/g, "svit")
    .replace(/футбол/g, "futbol"); // futbolka
  const name = `${raw} ${translit}`;
  if (name.includes("hudi") || name.includes("hoodie")) return "hoodie";
  if (name.includes("svitshot") || name.includes("sweatshirt")) return "svitshot";
  if (name.includes("t-shirt") || name.includes("tshirt") || name.includes("tee") || name.includes("futbol")) return "tshirt";
  return "tshirt";
};

const priceMatrix = {
  Patronus: { tshirt: 8500, svitshot: 9500, hoodie: 10000 },
  Car: { tshirt: 6500, svitshot: 8000, hoodie: 8500 },
  petFace: { tshirt: 6000, svitshot: 7000, hoodie: 8000 },
};

const EmbroiderySelector = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedType, setSelectedType] = useState("Patronus");
  const [customText, setCustomText] = useState("");
  const [uploadedImage, setUploadedImage] = useState([]);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [patronusCount, setPatronusCount] = useState(1);
  const [petFaceCount, setPetFaceCount] = useState(1);
  const [customOption, setCustomOption] = useState({ image: false, text: false });
  const [customTextFont, setCustomTextFont] = useState("Arial");

  const { selectedClothing, selectedSize, selectedColor } = location.state || {};
  const clothingKey = detectClothingKey(selectedClothing);

  const calcPrice = (type) => {
    const base = priceMatrix[type]?.[clothingKey] ?? 0;
    if (type === "Patronus") return base + Math.max(0, patronusCount - 1) * 5000;
    if (type === "petFace") return base + Math.max(0, petFaceCount - 1) * 2000;
    return base;
  };

  const priceLabel = (type) => `${calcPrice(type)} ₽`;
  const hasFiles = uploadedImage.length > 0;
  const canProceed = Boolean(selectedType && hasFiles);
  const disabledHint = !hasFiles ? "Загрузите хотя бы одно изображение" : "";

  const MAX_MB = 5;
  const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

  const handleFileChange = (e) => {
    const incoming = Array.from(e.target.files);
    const limit = selectedType === "petFace" ? 5 : 10;

    setUploadedImage((prev) => {
      const makeKey = (f) => `${f.name}_${f.size}_${f.lastModified}`;
      const existingKeys = new Set(prev.map(makeKey));

      const accepted = [];
      const rejected = { dup: [], type: [], size: [] };

      for (const f of incoming) {
        const key = makeKey(f);
        if (existingKeys.has(key)) {
          rejected.dup.push(f.name);
          continue;
        }
        if (!ALLOWED_TYPES.includes(f.type)) {
          rejected.type.push(f.name);
          continue;
        }
        if (f.size > MAX_MB * 1024 * 1024) {
          rejected.size.push(f.name);
          continue;
        }
        accepted.push(f);
      }

      const remaining = Math.max(0, limit - prev.length);
      const toAdd = accepted.slice(0, remaining);
      const next = [...prev, ...toAdd];

      const msgs = [];
      if (rejected.dup.length)  msgs.push(`дубликаты: ${rejected.dup.join(", ")}`);
      if (rejected.type.length) msgs.push(`неподдерживаемый тип: ${rejected.type.join(", ")}`);
      if (rejected.size.length) msgs.push(`слишком большие (> ${MAX_MB} МБ): ${rejected.size.join(", ")}`);
      if (accepted.length > remaining) {
        msgs.push(`превышен лимит (${limit}). Добавлено файлов: ${toAdd.length}`);
      }
      setError(msgs.join(" ? "));

      return next;
    });
  };

  const handleRemoveImage = (index) => {
    setUploadedImage((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (!canProceed) return;
    navigate("/recipient", {
      state: {
        selectedType,
        customText,
        uploadedImage,
        comment,
        productType: selectedClothing,
        size: selectedSize,
        color: selectedColor,
        patronusCount,
        petFaceCount,
      },
    });
  };

  const textareaRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [comment]);

  useEffect(() => {
    // reset counters when switching type to avoid stale extra price
    setPatronusCount(1);
    setPetFaceCount(1);
    if (selectedType !== "custom") {
      setCustomOption({ image: false, text: false });
      setCustomText("");
      setCustomTextFont("Arial");
    }
  }, [selectedType]);

  const handleSelectType = (type) => {
    setSelectedType(type);
    setPatronusCount(1);
    setPetFaceCount(1);
  };

  return (
    <div className="containerExampleType">
      <div className="exampleImg"></div>

      <div className="containterType">
        <div className="selectorGroup">
            <p className="title">ВЫБЕРИТЕ ТИП ВЫШИВКИ</p>
          <div className="selector">
            <label className="selector__item">
              <input
                type="radio"
                name="embroideryType"
                value="Patronus"
                onChange={(e) => handleSelectType(e.target.value)}
                checked={selectedType === "Patronus"}
              />
              <span className="selector__custom">
                <CheckIcon className="selector__check" />
              </span>
              патронусы
              <span className="selector__price">{priceLabel("Patronus")}</span>
            </label>

            {selectedType === "Patronus" && (
              <div className="patronusCounter">
                <button
                  className="circleButton"
                  onClick={() => setPatronusCount((prev) => Math.max(1, prev - 1))}
                >
                    −
                </button>
                <span className="countValue">{patronusCount}</span>
                <button
                  className="circleButton"
                  onClick={() => setPatronusCount((prev) => Math.min(5, prev + 1))}
                >
                  +
                </button>
                <span className="limitText">*не более 5</span>
              </div>
            )}

            <label className="selector__item">
              <input
                type="radio"
                name="embroideryType"
                value="Car"
                onChange={(e) => handleSelectType(e.target.value)}
                checked={selectedType === "Car"}
              />
              <span className="selector__custom">
                <CheckIcon className="selector__check" />
              </span>
              автомобиль
              <span className="selector__price">{priceLabel("Car")}</span>
            </label>

            <label className="selector__item">
              <input
                type="radio"
                name="embroideryType"
                value="petFace"
                onChange={(e) => handleSelectType(e.target.value)}
                checked={selectedType === "petFace"}
              />
              <span className="selector__custom">
                <CheckIcon className="selector__check" />
              </span>
              вышивка мордочки питомца по фото
              <span className="selector__price">{priceLabel("petFace")}</span>
            </label>

            {selectedType === "petFace" && (
              <div className="patronusCounter">
                <button
                  className="circleButton"
                  onClick={() => setPetFaceCount((prev) => Math.max(1, prev - 1))}
                >
                  –
                </button>
                <span className="countValue">{petFaceCount}</span>
                <button
                  className="circleButton"
                  onClick={() => setPetFaceCount((prev) => Math.min(5, prev + 1))}
                >
                  +
                </button>
                <span className="limitText">*не более 5</span>
              </div>
            )}

            <label className="selector__item">
              <input
                type="radio"
                name="embroideryType"
                value="custom"
                onChange={(e) => handleSelectType(e.target.value)}
                checked={selectedType === "custom"}
              />
              <span className="selector__custom">
                <CheckIcon className="selector__check" />
              </span>
              другая
            </label>
          </div>
        </div>

        <div className="uploadBlock">
          <p className="title">
              {selectedType === "custom" ? "ВЫБЕРИТЕ ПРИНТ" : "ЗАГРУЗИТЕ ИЗОБРАЖЕНИЕ"}
          </p>

          {selectedType === "custom" && (
            <div className="selectorGroup">
              <div className="selector">
                <label className="selector__item">
                  <input
                    type="radio"
                    name="customImage"
                    checked={customOption.image}
                    onChange={(e) => setCustomOption((prev) => ({ ...prev, image: e.target.checked }))}
                  />
                  <span className="selector__custom">
                    <CheckIcon className="selector__check" />
                  </span>
                  изображение
                </label>

                <label className="selector__item" style={{ marginBottom: "10px" }}>
                  <input
                    type="checkbox"
                    checked={customOption.text}
                    onChange={(e) => setCustomOption((prev) => ({ ...prev, text: e.target.checked }))}
                  />
                  <span className="selector__custom">
                    <CheckIcon className="selector__check" />
                  </span>
                  надпись
                </label>
              </div>
            </div>
          )}

          {(selectedType !== "custom" || customOption.image) && (
            <>
              <div className="fileInputWrapper">
                <span className="fileLimitNote">*не более {selectedType === "petFace" ? 5 : 10} файлов</span>

                <label className="customFileButton">
                  Выберите файлы
                  <input
                    className="hiddenFileInput"
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              <ul className="file-list">
                {uploadedImage.map((file, index) => (
                  <li key={file.name + index} className="file-item">
                    <span className="file-name" title={file.name}>{file.name}</span>
                    <button
                      type="button"
                      className="icon-btn close-btn"
                      aria-label={`Удалить ${file.name}`}
                      onClick={() => handleRemoveImage(index)}
                    >
                      &times;
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {customOption.text && (
            <>
              <div className="customTextBlock">
                  <p className="title">ТЕКСТ ДЛЯ ВЫШИВКИ:</p>
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Введите надпись"
                  style={{ fontFamily: customTextFont }}
                />
              </div>

              <div className="fontSelectBlock">
                  <p className="title">ВЫБЕРИТЕ ШРИФТ:</p>
                <select value={customTextFont} onChange={(e) => setCustomTextFont(e.target.value)}>
                  <option value="Arial">Arial</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Comic Sans MS">Comic Sans MS</option>
                </select>
              </div>
            </>
          )}

          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>

        <div className="commentBlock">
            <p className="title">КОММЕНТАРИЙ:</p>
          <label>
            <textarea
              ref={textareaRef}
              className="autoTextarea"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
                placeholder="Напишите ваши пожелания, которые учтут наши дизайнеры"/>
          </label>
        </div>

        <div className="navigationButtons">
          <button
            className="confirmButton"
            onClick={handleNext}
            disabled={!canProceed}
            title={!canProceed ? "Загрузите хотя бы одно изображение" : undefined}
          >
            ПЕРЕЙТИ К ОФОРМЛЕНИЮ
          </button>

          <button className="backButton" onClick={() => navigate(-1)}>
            вернуться назад
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmbroiderySelector;