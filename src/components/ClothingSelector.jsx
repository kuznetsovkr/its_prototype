import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ReactComponent as CheckIcon } from '../images/Vector.svg'



const ClothingSelector = () => {
  const navigate = useNavigate();

  const [inventory, setInventory] = useState([]); // Данные склада
  const [selectedClothing, setSelectedClothing] = useState(""); // Выбранный тип
  const [selectedColor, setSelectedColor] = useState(""); // Выбранный цвет
  const [selectedSize, setSelectedSize] = useState(""); // Выбранный размер
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const [selectedInnerType, setSelectedInnerType] = useState(""); // начёс или нет
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [gender, setGender] = useState("men"); // "men" или "women"

  // Загружаем склад
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/inventory");
        const data = response.data;
        setInventory(data);
  
        // Выбираем первый доступный тип одежды
        const firstType = [...new Set(data.map(item => item.productType))][0];
        if (firstType) {
          setSelectedClothing(firstType);
        }
  
      } catch (err) {
        console.error("Ошибка загрузки склада:", err);
      }
    };
    fetchInventory();
  }, []);
  
  //  Получаем уникальные типы одежды
  const availableTypes = [...new Set(inventory.map(item => item.productType))];

  //  Доступные цвета для выбранного типа
  const availableColors = [...new Set(inventory
    .filter(item => item.productType === selectedClothing)
    .map(item => item.color)
  )];

  //  Доступные размеры для выбранного типа и цвета
  const availableSizes = inventory
    .filter(item => item.productType === selectedClothing && item.color === selectedColor)
    .reduce((sizes, item) => {
      if (!sizes.includes(item.size)) sizes.push(item.size);
      return sizes;
    }, []);

  //  Обновляем выбранный цвет (по умолчанию первый доступный)
  useEffect(() => {
    if (availableColors.length > 0) {
      setSelectedColor(availableColors[0]);
    } else {
      setSelectedColor("");
    }
  }, [selectedClothing]);

  //  Обновляем выбранный размер (по умолчанию первый доступный)
  useEffect(() => {
    // Если доступных размеров нет, сбрасываем выбор
    if (availableSizes.length === 0) {
      setSelectedSize("");
    }
  }, [selectedColor]);

  useEffect(() => {
    if (selectedClothing !== "Худи") {
      setSelectedInnerType("");
    }
  }, [selectedClothing]);

  const handleConfirm = () => {
    if (selectedSize) {
      navigate("/embroidery", {
        state: { selectedClothing, selectedSize, selectedColor, selectedInnerType }
      });
    }
  };

  return (
     <>
     
      <div className="blockClothingSelector">
        {/* Левая часть: изображение товара */}
        <div className="clothing-block">
          <div className="image-wrapper">
            {selectedClothing && selectedColor ? (
              <img
                src={`http://localhost:5000${inventory.find(item => item.productType === selectedClothing && item.color === selectedColor)?.imageUrl || "placeholder.png"}`}
                alt={selectedClothing}
                className="clotheImage"
              />
            ) : (
              <img src="placeholder.png" alt="Выберите одежду" className="clotheImage" />
            )}
          </div>
        </div>


        {/* Правая часть */}
        <div className="blockSelection">

          <div className="selectorGroup">
            <p className="title">ТИП ИЗДЕЛИЯ:</p>
            <div className="selectorType">
              {availableTypes.map(type => (
                <label className="selectorType__item" key={type}>
                  <input
                    type="radio"
                    name="clothing"
                    value={type}
                    checked={selectedClothing === type}
                    onChange={(e) => setSelectedClothing(e.target.value)}
                  />
                  <span className="selectorType__custom">
                      <CheckIcon className="selectorType__check" />
                  </span>
                  {type}
                </label>
              ))}
            </div>
            {selectedClothing === "Худи" && (
                <div className="selectorType  selectorType--inner">
                  {["с начёсом", "без начёса"].map(inner => (
                    <label className="selectorType__item" key={inner}>
                      <input
                        type="radio"
                        name="innerType"
                        value={inner}
                        checked={selectedInnerType === inner}
                        onChange={(e) => setSelectedInnerType(e.target.value)}
                      />
                      <span className="selectorType__custom">
                        <CheckIcon className="selectorType__check" />
                      </span>
                      {inner}
                    </label>
                  ))}
                </div>
            )}
          </div>
          
          <div className="selectorGroup">
            <p className="title">ЦВЕТ:</p>
            <div className="colorSelector">
              {availableColors.map(color => (
                <div
                  key={color}
                  className={`colorSquare ${selectedColor === color ? "active" : ""}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>

          {/* Выбор размера */}
          <div className="selectorGroup">
            <p className="title">РАЗМЕР:</p>
            <div className="sizeSelector">
              {sizes.map(size => (
                <label className="sizeSelector__item" key={size}>
                  <input
                    type="radio"
                    name="size"
                    value={size}
                    checked={selectedSize === size}
                    onChange={(e) => setSelectedSize(e.target.value)}
                  />
                  <span className="sizeSelector__box">{size}</span>
                </label>
              ))}
            </div>
            <div className="tableSize" onClick={() => setShowSizeModal(true)}>
              таблица размеров
            </div>
          </div>

          <button
            className="confirmButton"
            onClick={handleConfirm}
            disabled={!selectedSize}
          >
            ПЕРЕЙТИ К ВЫШИВКЕ
          </button>
        </div>
      </div>

      {showSizeModal && (
        <div className="modalOverlay" onClick={() => setShowSizeModal(false)}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <button
                className={gender === "men" ? "active" : ""}
                onClick={() => setGender("men")}
              >
                Мужчины
              </button>
              <button
                className={gender === "women" ? "active" : ""}
                onClick={() => setGender("women")}
              >
                Женщины
              </button>
            </div>

            <div className="sizeTable">
              {/* Пример таблицы. Заменишь на свои данные при необходимости */}
              {gender === "men" ? (
                <table>
                  <thead>
                    <tr><th>Размер</th><th>Грудь</th><th>Талия</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>S</td><td>88–92</td><td>76–80</td></tr>
                    <tr><td>M</td><td>92–96</td><td>80–84</td></tr>
                    <tr><td>L</td><td>96–100</td><td>84–88</td></tr>
                  </tbody>
                </table>
              ) : (
                <table>
                  <thead>
                    <tr><th>Размер</th><th>Грудь</th><th>Талия</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>S</td><td>84–88</td><td>64–68</td></tr>
                    <tr><td>M</td><td>88–92</td><td>68–72</td></tr>
                    <tr><td>L</td><td>92–96</td><td>72–76</td></tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
     </>
  );
};

export default ClothingSelector;