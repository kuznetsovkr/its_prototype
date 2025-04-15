import React from "react";
import { ArcherContainer, ArcherElement } from "react-archer";


const steps = [
  { id: "step1", title: "Ваше фото" },
  { id: "step2", title: "Эскиз" },
  { id: "step3", title: "Вышивальный дизайн" },
  { id: "step4", title: "Готовый заказ" },
];

export default function Roadmap() {
  return (
    <div className="roadmap-wrapper">
      <ArcherContainer strokeColor="black">
        <div className="zigzag-grid">
          {steps.map((step, index) => {
            const hasNext = index < steps.length - 1;
            const isEven = index % 2 === 0;

            return (
              <React.Fragment key={step.id}>
                <div
                  className={`zigzag-item ${isEven ? "left" : "right"}`}
                >
                  <ArcherElement
                    id={step.id}
                    relations={
                      hasNext
                        ? [
                            {
                              targetId: steps[index + 1].id,
                              sourceAnchor: isEven ? "right" : "left",
                              targetAnchor: isEven ? "left" : "right",
                              style: {
                                strokeColor: "black",
                                strokeWidth: 2,
                                endMarker: true,
                                path: "curve",
                              },
                            },
                          ]
                        : []
                    }
                  >
                    <div className="step-box">
                      <div className="image-placeholder" />
                      <p>{step.title}</p>
                    </div>
                  </ArcherElement>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </ArcherContainer>
    </div>
  );
}
