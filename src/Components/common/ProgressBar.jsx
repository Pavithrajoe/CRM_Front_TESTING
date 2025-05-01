import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const steps = [
  { label: "New", path: "/history" },
  { label: "New", path: "/comments" },
  { label: "New", path: "/remainders" },
  { label: "New", path: "/analytics" },
  { label: "New", path: "/assigned" },
];

export default function ProgressBar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex items-center space-x-[-16px]">
      {steps.map((step, index) => {
        const isFirst = index === 0;
        const isLast = index === steps.length - 1;
        const isActive = location.pathname === step.path;

        const fill = isActive ? "#3b82f6" : "#ddd"; // Blue if active

        const path = isFirst
          ? "M0,20 a20,20 0 0 1 20,-20 H80 L100,20 L80,40 H20 a20,20 0 0 1 -20,-20 Z"
          : isLast
          ? "M0,20 L20,0 H80 a20,20 0 0 1 20,20 a20,20 0 0 1 -20,20 H20 Z"
          : "M0,20 L20,0 H80 L100,20 L80,40 H20 Z";

        return (
          <svg
            key={index}
            width="100"
            height="40"
            viewBox="0 0 100 40"
            onClick={() => navigate(step.path)}
            className="cursor-pointer z-10"
          >
            <path d={path} fill={fill} stroke="#bbb" />
            <text
              x="50"
              y="25"
              textAnchor="middle"
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
