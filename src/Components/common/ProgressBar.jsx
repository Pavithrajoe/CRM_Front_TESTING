import React, { useState } from "react";

const steps = [
  { label: "New", color: "#b0c4de" },        // blue-400
  { label: "Qualified", color: "#8fbc8f" },  // green-400
  { label: "Contacted", color: "#efcc00" },  // yellow-400
  { label: "Converted", color: "#edc9af " },  // red-400
];

export default function ProgressBar() {
  const [activeStep, setActiveStep] = useState(null); // No step selected initially

  return (
    <div className="w-full overflow-x-auto px-4">
      <div className="flex w-max items-center text-center space-x-[-45px] mx-auto lg:ms-[1075px]">
        {steps.map((step, index) => {
          const isFirst = index === 0;
          const isLast = index === steps.length - 1;
          const isActive = activeStep === step.label;

          const fill = isActive ? step.color : "#ddd";

          const path = isFirst
            ? "M1,0 H130 L150,20 L130,40 H0 Z"
            : isLast
            ? "M0,0 L20,20 L0,40 H130 L150,20 L130,0 Z"
            : "M0,0 L20,20 L0,40 H130 L150,20 L130,0 Z";

          return (
            <svg
              key={index}
              viewBox="0 0 150 40"
              preserveAspectRatio="xMidYMid meet"
              className="w-[180px] h-[40px] cursor-pointer z-10"
              onClick={() => setActiveStep(step.label)}
            >
              <path d={path} fill={fill} stroke="#bbb" />
              <text
                x="75"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#000"
                fontSize="14"
                fontFamily="Arial"
              >
                {step.label}
              </text>
            </svg>
          );
        })}
      </div>
    </div>
  );
}
