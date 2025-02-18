import React from "react";
import Masonry from "react-masonry-css";
import "./WorksPage.css";

// Импортируем изображения
import img1 from "../images/works/1.jpg";
import img2 from "../images/works/2.jpg";
import img3 from "../images/works/3.jpg";
import img4 from "../images/works/1.jpg";
import img5 from "../images/works/2.jpg";
import img6 from "../images/works/3.jpg";
import img7 from "../images/works/1.jpg";
import img8 from "../images/works/2.jpg";
import img9 from "../images/works/3.jpg";
import img10 from "../images/works/1.jpg";
import img11 from "../images/works/2.jpg";
import img12 from "../images/works/3.jpg";
import img13 from "../images/works/1.jpg";
import img14 from "../images/works/2.jpg";
import img15 from "../images/works/3.jpg";

// Создаём массив изображений (можно дублировать)
const images = [img1, img2, img3, img4, img5,img6, img7, img8, img9, img10,img11, img12, img13, img14, img15];

// Если изображений мало — дублируем, чтобы заполнить экран
const repeatedImages = [...images, ...images, ...images];

const Works = () => {
  return (
    <div className="works">
      <h1>Примеры работ</h1>
      <Masonry
        breakpointCols={{
          default: 4, // 4 колонки по умолчанию
          1200: 3, // 3 колонки при ширине экрана <1200px
          768: 2,  // 2 колонки при ширине <768px
          480: 1,  // 1 колонка при ширине <480px
        }}
        className="masonry-grid"
        columnClassName="masonry-grid_column"
      >
        {repeatedImages.map((src, index) => (
          <div key={index} className="masonry-item">
            <img src={src} alt={`Work ${index + 1}`} />
          </div>
        ))}
      </Masonry>
    </div>
  );
};

export default Works;
