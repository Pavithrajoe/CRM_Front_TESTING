import React, { useEffect, useState } from "react";

const getLeadHistory = () =>
  Promise.resolve([
    {
      id: 1,
      name: "Shivakumar",
      message: "Lead status changed to 'Contacted'",
      modifiedBy: "Harish Kumar",
      modifiedAt: "22 Dec 2025, 11:00 AM",
    },
    {
      id: 2,
      name: "Shivakumar",
      message: "Follow-up call scheduled.",
      modifiedBy: "Harish Kumar",
      modifiedAt: "22 Dec 2025, 11:30 AM",
    },
    {
      id: 3,
      name: "Shivakumar",
      message: "Proposal sent to client.",
      modifiedBy: "Harish Kumar",
      modifiedAt: "22 Dec 2025, 12:00 PM",
    },
  ]);

export default function LeadTimeline() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    getLeadHistory().then(setHistory);
  }, []);

  return (
    <div className="relative w-full h-[600px] overflow-y-auto px-6 py-10 bg-gray-50">
      <div className="relative w-full flex flex-col items-center">
        {history.map((entry, index) => {
          const isLeft = index % 2 === 0;
          const isLast = index === history.length - 1;

          return (
            <div key={entry.id} className="flex w-full relative min-h-[120px]">
              {/* Left card */}
              <div className="w-1/2 flex justify-end pr-6">
                {isLeft && (
                  <div className="bg-white border rounded-xl shadow p-4 w-80 z-10">
                    <h3 className="font-semibold">{entry.name}’s</h3>
                    <p className="text-sm text-gray-600 mt-1">{entry.message}</p>
                    <div className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                      <img
                        src={`https://ui-avatars.com/api/?name=${entry.modifiedBy.replace(
                          " ",
                          "+"
                        )}`}
                        alt="avatar"
                        className="w-5 h-5 rounded-full"
                      />
                      {entry.modifiedBy} modified at {entry.modifiedAt}
                    </div>
                  </div>
                )}
              </div>

              {/* Center timeline: dot + connector + dotted line */}
<div className="flex flex-col items-center w-0 relative">
  {/* Dot */}
  <div className="w-8 h-8 bg-black rounded-full border-2 border-white z-10 relative" />

  {/* Connector line */}
  <div
    className={`absolute top-[6px] h-0.5 w-[40px] bg-black ${
      isLeft ? "right-[calc(100%+12px)]" : "left-[calc(100%+12px)]"
    }`}
  />

  {/* Dotted line below dot */}
  {!isLast && (
    <div className="flex flex-col items-center mt-2 space-y-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="w-1 h-5 bg-black rounded-full opacity-60" />
      ))}
    </div>
  )}
</div>

              {/* Right card */}
              <div className="w-1/2 flex justify-start pl-6">
                {!isLeft && (
                  <div className="bg-white border rounded-xl shadow p-4 w-80 z-10">
                    <h3 className="font-semibold">{entry.name}’s</h3>
                    <p className="text-sm text-gray-600 mt-1">{entry.message}</p>
                    <div className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                      <img
                        src={`https://ui-avatars.com/api/?name=${entry.modifiedBy.replace(
                          " ",
                          "+"
                        )}`}
                        alt="avatar"
                        className="w-5 h-5 rounded-full"
                      />
                      {entry.modifiedBy} modified at {entry.modifiedAt}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
