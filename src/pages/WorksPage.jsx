import { useState } from 'react';
// Импортируем изображения
import img1 from "../images/works/1.jpg";
import img2 from "../images/works/2.jpg";
import img3 from "../images/works/3.jpg";
import img4 from "../images/works/4.jpg";
import img5 from "../images/works/5.jpg";
import img6 from "../images/works/6.jpg";
import img7 from "../images/works/7.jpg";
import img8 from "../images/works/8.jpg";
import img9 from "../images/works/9.jpg";
import img10 from "../images/works/10.jpg";
import img11 from "../images/works/2.jpg";
import img12 from "../images/works/3.jpg";
import img13 from "../images/works/1.jpg";
import img14 from "../images/works/2.jpg";
import img15 from "../images/works/3.jpg";


const items = [
  { id: 1, src: img1, size: 'large', description: 'Большая вышивка с цветами' },
  { id: 2, src: img2, size: 'small', description: 'Минималистичная геометрия' },
  { id: 3, src: img3, size: 'wide', description: 'Вышивка на рукаве' },
  { id: 4, src: img4, size: 'small',description: 'Винтажная композиция' },
  { id: 5, src: img5, size: 'large' },
  { id: 6, src: img6, size: 'small' },
  { id: 7, src: img7, size: 'wide' },
  { id: 8, src: img8, size: 'small' },
  { id: 9, src: img9, size: 'small' },
  { id: 10, src: img10, size: 'small' },
  { id: 11, src: img11, size: 'wide' },
  { id: 12, src: img12, size: 'small' },
  { id: 13, src: img13, size: 'large' },
  { id: 14, src: img14, size: 'small' },
  { id: 15, src: img15, size: 'wide' },
  { id: 16, src: img1, size: 'large', description: 'Большая вышивка с цветами' },
  { id: 17, src: img2, size: 'small', description: 'Минималистичная геометрия' },
  { id: 18, src: img3, size: 'wide', description: 'Вышивка на рукаве' },
  { id: 19, src: img4, size: 'small',description: 'Винтажная композиция' },
  { id: 20, src: img5, size: 'large' },
  { id: 21, src: img6, size: 'small' },
  { id: 22, src: img7, size: 'wide' },
  { id: 23, src: img8, size: 'small' },
  { id: 24, src: img9, size: 'large' },
  { id: 25, src: img10, size: 'small' },
  { id: 26, src: img11, size: 'wide' },
  { id: 27, src: img12, size: 'small' },
  { id: 28, src: img13, size: 'large' },
  { id: 29, src: img14, size: 'small' },
  { id: 30, src: img15, size: 'wide' },
  { id: 31, src: img1, size: 'large', description: 'Большая вышивка с цветами' },
  { id: 32, src: img2, size: 'small', description: 'Минималистичная геометрия' },
  { id: 33, src: img3, size: 'wide', description: 'Вышивка на рукаве' },
  { id: 34, src: img4, size: 'small',description: 'Винтажная композиция' },
  { id: 35, src: img5, size: 'large' },
  { id: 36, src: img6, size: 'small' },
  { id: 37, src: img7, size: 'wide' },
  { id: 38, src: img8, size: 'small' },
  { id: 39, src: img9, size: 'large' },
  { id: 40, src: img10, size: 'small' },
  { id: 41, src: img11, size: 'wide' },
  { id: 42, src: img12, size: 'small' },
  { id: 43, src: img13, size: 'large' },
  { id: 44, src: img14, size: 'small' },
  { id: 45, src: img15, size: 'wide' },
  { id: 46, src: img1, size: 'large', description: 'Большая вышивка с цветами' },
  { id: 47, src: img2, size: 'small', description: 'Минималистичная геометрия' },
  { id: 48, src: img3, size: 'wide', description: 'Вышивка на рукаве' },
  { id: 49, src: img4, size: 'small',description: 'Винтажная композиция' },
  { id: 50, src: img5, size: 'large' },
  { id: 51, src: img6, size: 'small' },
  { id: 52, src: img7, size: 'wide' },
  { id: 53, src: img8, size: 'small' },
  { id: 54, src: img9, size: 'large' },
  { id: 55, src: img10, size: 'small' },
  { id: 56, src: img11, size: 'wide' },
  { id: 57, src: img12, size: 'small' },
  { id: 58, src: img13, size: 'large' },
  { id: 59, src: img14, size: 'small' },
  { id: 60, src: img15, size: 'wide' },
  // и т.д.
];

const Gallery = () => {
  const [selected, setSelected] = useState(null);

  const openModal = (item) => setSelected(item);
  const closeModal = () => setSelected(null);

  return (
    <div className="gallery-scroll-container">
      <div className="grid-gallery">
        {items.map((item) => (
          <div key={item.id} className={`grid-item ${item.size}`} onClick={() => openModal(item)}>
            <img src={item.src} alt={`work-${item.id}`} />
          </div>
        ))}
      </div>

      {selected && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={selected.src} alt="selected" />
            <p>{selected.description}</p>
            <button className="close-btn" onClick={closeModal}>×</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
