// import React, { useEffect, useState } from "react";
// import { ENDPOINTS } from "../api/constraints";

// // Map activity types to colors for timeline dots and lines
// const activityColors = {
//   lead_created: "#28a745", // green
//   follow_up: "#fd7e14", // orange
//   proposal_sent: "#007bff", // blue
//   comment_added: "#ffc107", // yellow
//   assigned_to_user: "#6f42c1", // purple
//   default: "#28a745", // green (fallback)
// };

// // Helper function to get activity-specific messages
// const getActivityMessage = (activity) => {
//   const { activitytype, data, user, performedbyid, activitytimestamp } = activity;
//   const userName = user?.cFull_name || `User ${performedbyid || 'System'}`;
  
//   // Format the activity date in DD/MM/YYYY format
//   const activityDate = new Date(activitytimestamp).toLocaleDateString("en-GB", {
//     day: "2-digit",
//     month: "numeric",
//     year: "numeric"
//   });

//   const personalizeMessage = (msg) =>
//     typeof msg === "string" ? msg.replace(`User ${performedbyid}`, userName).replace(`${performedbyid}`, userName) : msg;

//   switch (activitytype) {
//     case "lead_created":
//       return personalizeMessage(data?.newStatus) || `Lead created by ${userName} on ${activityDate}`;
//     case "follow_up":
//       return `Follow-up scheduled by ${userName} on ${activityDate}`;
//     case "proposal_sent":
//       return `Proposal sent to the client by ${userName} on ${activityDate}`;
//     case "comment_added":
//       return personalizeMessage(data?.newStatus) || `Comment added by ${userName} on ${activityDate}`;
//     case "assigned_to_user":
//       if (typeof data?.newStatus === "string" && data.newStatus.includes("[object Object]")) {
//         return `Lead assigned by ${userName} on ${activityDate}`;
//       }
//       return personalizeMessage(data?.newStatus) || `Lead assigned by ${userName} on ${activityDate}`;
//     default:
//       return (
//         personalizeMessage(data?.newStatus) ||
//         `${activitytype.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} by ${userName} on ${activityDate}`
//       );
//   }
// };
// // Helper: Get color for a given activity type, fallback to default
// const getActivityColor = (type) => activityColors[type] || activityColors.default;

// export default function LeadTimeline({ leadId }) {
//   const [history, setHistory] = useState([]);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true); // Added loading state

//   const fetchActivityLog = async () => {
//     setLoading(true); // Set loading true when fetching starts
//     try {
//       const token = localStorage.getItem("token");
//       const response = await fetch(
//         `${ENDPOINTS.BASE_URL_IS}/lead-activity-log/${leadId}`,
//         {
//           headers: {
//             "Content-Type": "application/json",
//             ...(token && { Authorization: `Bearer ${token}` }),
//           },
//         }
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || `Failed to fetch activity log (Status: ${response.status})`);
//       }

//       const data = await response.json();
//       // Sort in descending order (newest first)
//       const sortedHistory = data.sort(
//         (a, b) => new Date(b.activitytimestamp) - new Date(a.activitytimestamp)
//       );

//       setHistory(sortedHistory);
//     } catch (err) {
//       console.error("Fetch Error:", err);
//       setError(err.message || "Unable to fetch timeline data");
//     } finally {
//       setLoading(false); // Set loading false when fetching ends (success or error)
//     }
//   };

//   useEffect(() => {
//     if (leadId) {
//       fetchActivityLog();
//     } else {
//       setHistory([]); // Clear history if leadId is not provided
//       setLoading(false);
//     }
//   }, [leadId]);

//   return (
//     <div className="relative  w-full px-4 py-10 bg-gradient-to-br from-gray-50 to-gray-100">
//       {/* Container for timeline content - ensures centering and max width */}
//       <div className=" h-[130vh] mx-auto"> 
//         <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">Lead Activity Timeline</h2>
        
//         {loading && (
//           <div className="text-center text-gray-500 text-lg">Loading activity history...</div>
//         )}

//         {error && !loading && (
//           <div className="text-red-700 bg-red-100 rounded-lg px-6 py-3 text-sm shadow-md w-full max-w-md mx-auto text-center">
//             {error}
//           </div>
//         )}

//         {!error && !loading && history.length === 0 && (
//           <div className="text-gray-500 text-sm italic text-center py-4">No activity found for this lead.</div>
//         )}
//         <div className="flex flex-col  items-center space-y-8 h-full overflow-y-auto">
//           {history.map((entry, index) => {
//             const isLeft = index % 2 === 0;
//             const isLast = index === history.length - 1;
//             const message = getActivityMessage(entry);
//             const performedBy = entry.user?.cFull_name || `User ${entry.performedbyid || "System"}`;
//             const date = new Date(entry.activitytimestamp);
//             const humanReadable = date.toLocaleString("en-GB", {
//               day: "numeric",
//               month: "numeric",
//               year: "numeric",
//               hour: "numeric",
//               minute: "2-digit",
//               hour12: true,
//             }).toUpperCase(); // Converts 'am'/'pm' to 'AM'/'PM'

//             const color = getActivityColor(entry.activitytype);

//             return (
//               <div
//                 key={entry.id || index}
//                 className="flex w-full relative min-h-[170px]" // ms-[-100px] removed to ensure centering
//                 aria-label={`Timeline event: ${message}`}
//               >
//                 {/* Left content column */}
//                 <div className="w-1/2 flex justify-end pr-8">
//                   {isLeft && (
//                     <article
//                       className="bg-white shadow-md shadow-gray-600 rounded-3xl p-6 w-96 hover:shadow-xl transition-shadow duration-300"
//                       role="region"
//                       aria-live="polite"
//                     >
//                       <h3
//                         className="text-lg font-semibold text-gray-900 mb-1"
//                         style={{ color }}
//                       >
//                         Activity
//                       </h3>
//                       <p className="text-gray-700 text-base whitespace-pre-wrap break-words">{message}</p>
//                       {/* <p className="text-gray-700 text-base truncate">{message}</p> */}
//                       <footer className="mt-4 flex items-center space-x-3 text-sm text-gray-500">
//                       <img
//                         src={`https://ui-avatars.com/api/?name=${encodeURIComponent(performedBy)}`}
//                         alt={`Avatar of ${performedBy}`}
//                         className="w-7 h-7 rounded-full shadow-sm border border-gray-300"
//                         loading="lazy"
//                       />
//                       <time dateTime={date.toISOString()}>{humanReadable}</time>
//                     </footer>
//                     </article>
//                   )}
//                 </div>

//                 {/* Center timeline (Dot and Lines) */}
//                 <div className="flex flex-col items-center w-0 relative">
//                   {/* Activity dot */}
//                   <span
//                     className="block rounded-full border-4 border-white shadow-md"
//                     style={{
//                       width: 24,
//                       height: 24,
//                       backgroundColor: color,
//                       zIndex: 10,
//                     }}
//                     aria-hidden="true"
//                   />
                  
//                   {/* Horizontal connection line from dot to card */}
//                   <span
//                     className="absolute top-[10px]"
//                     style={{
//                       width: 25,
//                       height: 4,
//                       backgroundColor: color,
//                       ...(isLeft ? { right: "calc(100% + 12px)" } : { left: "calc(100% + 12px)" }),
//                     }}
//                     aria-hidden="true"
//                   />
                  
//                   {/* Vertical tracking line (between dots) */}
//                   {!isLast && (
//                     <div
//                       className="w-1 rounded-full mt-2"
//                       style={{
//                         height: "100px",
//                         backgroundColor: color,
//                         opacity: 0.6,
//                       }}
//                       aria-hidden="true"
//                     />
//                   )}
//                 </div>

//                 {/* Right content column */}
//                 <div className="w-1/2 flex justify-start pl-8">
//                   {!isLeft && (
//                     <article
//                       className="bg-white shadow-md shadow-gray-600 rounded-3xl p-6 w-96 hover:shadow-xl transition-shadow duration-300"
//                       role="region"
//                       aria-live="polite"
//                     >
//                       <h3
//                         className="text-lg font-semibold text-gray-900 mb-1"
//                         style={{ color }}
//                       >
//                         Activity
//                       </h3>
//                       <p className="text-gray-700 text-base whitespace-pre-wrap break-words">{message}</p>
//                       {/* <p className="text-gray-700 text-base truncate">{message}</p> */}
//                       <footer className="mt-4 flex items-center space-x-3 text-sm text-gray-500">
//                         <img
//                           src={`https://ui-avatars.com/api/?name=${encodeURIComponent(performedBy)}`}
//                           alt={`Avatar of ${performedBy}`}
//                           className="w-7 h-7 rounded-full shadow-sm border border-gray-300"
//                           loading="lazy"
//                         />
//                         <time dateTime={date.toISOString()}>{humanReadable}</time>
//                       </footer>
//                     </article>
//                   )}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>
//     </div>
//   );
// }

import React, { useEffect, useState, useRef } from "react";
import { ENDPOINTS } from "../api/constraints";

// Map activity types to colors for timeline dots and lines
const activityColors = {
  lead_created: "#28a745", // green
  follow_up: "#fd7e14", // orange
  proposal_sent: "#007bff", // blue
  comment_added: "#ffc107", // yellow
  assigned_to_user: "#6f42c1", // purple
  default: "#28a745", // green (fallback)
};

// Helper function to get activity-specific messages
const getActivityMessage = (activity) => {
  const { activitytype, data, user, performedbyid, activitytimestamp } = activity;
  const userName = user?.cFull_name || `User ${performedbyid || "System"}`;

  const activityDate = new Date(activitytimestamp).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "numeric",
    year: "numeric",
  });

  const personalizeMessage = (msg) =>
    typeof msg === "string"
      ? msg
          .replace(`User ${performedbyid}`, userName)
          .replace(`${performedbyid}`, userName)
      : msg;

  switch (activitytype) {
    case "lead_created":
      return personalizeMessage(data?.newStatus) || `Lead created by ${userName} on ${activityDate}`;
    case "follow_up":
      return `Follow-up scheduled by ${userName} on ${activityDate}`;
    case "proposal_sent":
      return `Proposal sent to the client by ${userName} on ${activityDate}`;
    case "comment_added":
      return personalizeMessage(data?.newStatus) || `Comment added by ${userName} on ${activityDate}`;
    case "assigned_to_user":
      if (typeof data?.newStatus === "string" && data.newStatus.includes("[object Object]")) {
        return `Lead assigned by ${userName} on ${activityDate}`;
      }
      return personalizeMessage(data?.newStatus) || `Lead assigned by ${userName} on ${activityDate}`;
    default:
      return (
        personalizeMessage(data?.newStatus) ||
        `${activitytype.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} by ${userName} on ${activityDate}`
      );
  }
};

// Helper: Get color for a given activity type, fallback to default
const getActivityColor = (type) => activityColors[type] || activityColors.default;

export default function LeadTimeline({ leadId }) {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePopup, setActivePopup] = useState(null);
  const popupRef = useRef(null);

  const fetchActivityLog = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${ENDPOINTS.BASE_URL_IS}/lead-activity-log/${leadId}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch activity log (Status: ${response.status})`);
      }

      const data = await response.json();
      const sortedHistory = data.sort(
        (a, b) => new Date(b.activitytimestamp) - new Date(a.activitytimestamp)
      );

      setHistory(sortedHistory);
    } catch (err) {
      console.error("Fetch Error:", err);
      setError(err.message || "Unable to fetch timeline data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (leadId) {
      fetchActivityLog();
    } else {
      setHistory([]);
      setLoading(false);
    }
  }, [leadId]);

  // Close popup when clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setActivePopup(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full px-4 py-10 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="h-[130vh] mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">Lead Activity Timeline</h2>

        {loading && (
          <div className="text-center text-gray-500 text-lg">Loading activity history...</div>
        )}

        {error && !loading && (
          <div className="text-red-700 bg-red-100 rounded-lg px-6 py-3 text-sm shadow-md w-full max-w-md mx-auto text-center">
            {error}
          </div>
        )}

        {!error && !loading && history.length === 0 && (
          <div className="text-gray-500 text-sm italic text-center py-4">
            No activity found for this lead.
          </div>
        )}

        <div className="flex flex-col items-center space-y-8 h-full overflow-y-auto">
          {history.map((entry, index) => {
            const isLeft = index % 2 === 0;
            const isLast = index === history.length - 1;
            const message = getActivityMessage(entry);
            const performedBy =
              entry.user?.cFull_name || `User ${entry.performedbyid || "System"}`;
            const date = new Date(entry.activitytimestamp);
            const humanReadable = date
              .toLocaleString("en-GB", {
                day: "numeric",
                month: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })
              .toUpperCase();
            const color = getActivityColor(entry.activitytype);

            return (
              <div
                key={entry.id || index}
                className="flex w-full relative min-h-[170px]"
                aria-label={`Timeline event: ${message}`}
              >
                {/* Left content column */}
                <div className="w-1/2 flex justify-end pr-8">
                  {isLeft && (
                    <article
                      className="bg-white shadow-md shadow-gray-600 rounded-3xl p-6 w-96 hover:shadow-xl transition-shadow duration-300 relative"
                      role="region"
                      aria-live="polite"
                    >
                      <h3
                        className="text-lg font-semibold text-gray-900 mb-1"
                        style={{ color }}
                      >
                        Activity
                      </h3>

                      {/* Message truncated to one line */}
                      <p
                        className="text-gray-700 text-base truncate cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePopup(activePopup === index ? null : index);
                        }}
                      >
                        {message}
                      </p>

                      {/* Popup for full message */}
                      {activePopup === index && (
                        <div
                          ref={popupRef}
                          className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-white border border-gray-300 shadow-lg rounded-xl p-4 text-sm text-gray-800 w-80 z-50"
                        >
                          {message}
                        </div>
                      )}

                      <footer className="mt-4 flex items-center space-x-3 text-sm text-gray-500">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(performedBy)}`}
                          alt={`Avatar of ${performedBy}`}
                          className="w-7 h-7 rounded-full shadow-sm border border-gray-300"
                          loading="lazy"
                        />
                        <time dateTime={date.toISOString()}>{humanReadable}</time>
                      </footer>
                    </article>
                  )}
                </div>

                {/* Center timeline (Dot and Lines) */}
                <div className="flex flex-col items-center w-0 relative">
                  <span
                    className="block rounded-full border-4 border-white shadow-md"
                    style={{
                      width: 24,
                      height: 24,
                      backgroundColor: color,
                      zIndex: 10,
                    }}
                    aria-hidden="true"
                  />
                  <span
                    className="absolute top-[10px]"
                    style={{
                      width: 25,
                      height: 4,
                      backgroundColor: color,
                      ...(isLeft
                        ? { right: "calc(100% + 12px)" }
                        : { left: "calc(100% + 12px)" }),
                    }}
                    aria-hidden="true"
                  />
                  {!isLast && (
                    <div
                      className="w-1 rounded-full mt-2"
                      style={{
                        height: "100px",
                        backgroundColor: color,
                        opacity: 0.6,
                      }}
                      aria-hidden="true"
                    />
                  )}
                </div>

                {/* Right content column */}
                <div className="w-1/2 flex justify-start pl-8">
                  {!isLeft && (
                    <article
                      className="bg-white shadow-md shadow-gray-600 rounded-3xl p-6 w-96 hover:shadow-xl transition-shadow duration-300 relative"
                      role="region"
                      aria-live="polite"
                    >
                      <h3
                        className="text-lg font-semibold text-gray-900 mb-1"
                        style={{ color }}
                      >
                        Activity
                      </h3>

                      {/* Message truncated to one line */}
                      <p
                        className="text-gray-700 text-base truncate cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePopup(activePopup === index ? null : index);
                        }}
                      >
                        {message}
                      </p>

                      {/* Popup for full message */}
                      {activePopup === index && (
                        <div
                          ref={popupRef}
                          className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-white border border-gray-300 shadow-lg rounded-xl p-4 text-sm text-gray-800 w-80 z-50"
                        >
                          {message}
                        </div>
                      )}

                      <footer className="mt-4 flex items-center space-x-3 text-sm text-gray-500">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(performedBy)}`}
                          alt={`Avatar of ${performedBy}`}
                          className="w-7 h-7 rounded-full shadow-sm border border-gray-300"
                          loading="lazy"
                        />
                        <time dateTime={date.toISOString()}>{humanReadable}</time>
                      </footer>
                    </article>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
