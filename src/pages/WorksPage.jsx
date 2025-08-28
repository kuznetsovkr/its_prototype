import React from "react";

const ratios = [
  "3/2", "1/1", "4/5", "16/9", "9/16", "5/4",
  "4/3", "3/4", "2/3", "1/1", "3/2", "2/1",
  "21/9", "9/10", "5/7", "7/5", "1/2", "2/1",
];

export default function WorksGallery() {
  return (
    <section className="works works--hairline">
      <div className="works__grid" aria-label="Галерея примеров работ">
        {ratios.map((ar, i) => (
          <div
            key={i}
            className="works__item"
            style={{ "--ar": ar }}
            role="img"
            aria-label={`Пример работы ${i + 1} (заглушка)`}
          />
        ))}
      </div>
    </section>
  );
}
