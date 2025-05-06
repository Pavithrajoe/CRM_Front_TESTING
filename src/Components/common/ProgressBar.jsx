import React, { useState, useEffect } from "react";

const allSteps = [
  { label: "New", color: "#b0c4de" },
  { label: "Qualified", color: "#8fbc8f" },
  { label: "Contacted", color: "#efcc00" },
  { label: "Converted", color: "#edc9af" },
  { label: "Proposal", color: "#add8e6" },
  { label: "Negotiation", color: "#dda0dd" },
  { label: "Final Review", color: "#f08080" },
  { label: "Won", color: "#4BB543" },
];

export default function ProgressBar() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [groupStart, setGroupStart] = useState(0);

  useEffect(() => {
    if ((activeIndex + 1) % 4 === 0 && activeIndex < allSteps.length - 1) {
      setTimeout(() => {
        setGroupStart((prev) => prev + 4);
      }, 300);
    }
  }, [activeIndex]);

  const visibleSteps = allSteps.slice(groupStart, groupStart + 4);

  const handleStepClick = (stepLabel) => {
    const clickedIndex = allSteps.findIndex((step) => step.label === stepLabel);
    if (clickedIndex === activeIndex + 1) {
      setActiveIndex(clickedIndex);
    }
  };

  return (
    <div className="w-full overflow-hidden px-4">
      {/* Progress Steps */}
      <div className="flex flex-wrap gap-x-0 gap-y-2 sm:flex-nowrap sm:space-x-[-65px] sm:mx-auto lg:ms-[1025px]">
        {visibleSteps.map((step, idx) => {
          const globalIndex = groupStart + idx;
          const fill = globalIndex <= activeIndex ? step.color : "#ddd";

          const path =
            idx === 0
              ? "M1,0 H130 L150,20 L130,40 H0 Z"
              : idx === visibleSteps.length - 1
              ? "M0,0 L20,20 L0,40 H130 L150,20 L130,0 Z"
              : "M0,0 L20,20 L0,40 H130 L150,20 L130,0 Z";

          return (
            <svg
              key={step.label}
              viewBox="0 0 100 40"
              preserveAspectRatio="xMidYMid meet"
              className="w-[400px] h-[40px] cursor-pointer z-10"
              onClick={() => handleStepClick(step.label)}
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

      {/* Only show 🔥 next to "Won" */}
      {allSteps[activeIndex]?.label === "Won" && (
        <div className="text-xl flex items-center justify-center gap-2 mt-10 text-green-600 ms-[1050px] font-semibold">
          Won <span>🔥</span>
        </div>
      )}
    </div>
  );
}