import React from "react";

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



const Works = () => {
  // Пример массива картинок
  const images = [img1, img2, img3, img4, img5,img6, img7, img8, img9, img10,img11, img12, img13, img14, img15];

  return (
    <div className="works-page">
      <h1>Примеры работ</h1>
      <div className="gallery">
        {images.map((imgSrc, i) => (
          <div className="gallery-item" key={i}>
            <img src={imgSrc} alt={`Work ${i + 1}`} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Works;
