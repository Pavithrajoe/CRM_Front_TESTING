import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const steps = [
  { label: "New", path: "/history" },
  { label: "Qualified", path: "/comments" },
  { label: "non", path: "/remainders" },
  { label: "New", path: "/analytics" },

];

export default function ProgressBar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex text-center space-x-[-45px] ms-[1030px] ">
      {steps.map((step, index) => {
        const isFirst = index === 0;
        const isLast = index === steps.length - 1;
        const isActive = location.pathname === step.path;

        const fill = isActive ? "#3b82f6" : "#ddd";

        // Enlarged shape with smooth overlapping
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
            onClick={() => navigate(step.path)}
          >
            <path d={path} fill={fill} stroke="#bbb" />
            <text
              x="100"
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
  );
}
