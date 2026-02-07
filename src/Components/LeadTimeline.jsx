import React, { useEffect, useState } from "react";
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
  const userName = user?.cFull_name || `User ${performedbyid || 'System'}`;
  // Format the activity date in DD/MM/YYYY format
  const activityDate = new Date(activitytimestamp).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "numeric",
    year: "numeric"
  });

  const personalizeMessage = (msg) =>
    typeof msg === "string"
      ? msg.replace(`User ${performedbyid}`, userName).replace(`${performedbyid}`, userName)
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

function getFirstTwoLines(text) {
  if (!text) return "";
  // Split by lines, including both \r\n and \n as line breaks
  const lines = text.split(/\r?\n/);
  if (lines.length <= 2) return text;
  return lines.slice(0, 2).join('\n') + "......";
}

export default function LeadTimeline({ leadId }) {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchActivityLog = async () => {
    setLoading(true);
    setError(null); 
    
    try {
      const token = localStorage.getItem("token");
      
      // Check if token exists
      if (!token) {
        throw new Error("Authentication required. Please login again.");
      }
      
      const response = await fetch(`${ENDPOINTS.BASE_URL_IS}/lead-activity-log/${leadId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || `Server error: ${response.status}`);
      }
      
      if (!result.success) {
        // Handle API-level errors
        throw new Error(result.message || "Failed to fetch activity log");
      }
      
      // Access the nested data array
      const activityData = result.data || [];
      
      // Sort by timestamp (newest first)
      const sortedHistory = [...activityData].sort(
        (a, b) => new Date(b.activitytimestamp) - new Date(a.activitytimestamp)
      );
      
      setHistory(sortedHistory);
    } catch (err) {
      console.error("Fetch Error:", err);
      
      // Set user-friendly error messages
      let errorMessage = err.message || "Unable to fetch timeline data";
      
      if (err.message.includes("401") || err.message.includes("Authentication")) {
        errorMessage = "Session expired. Please login again.";
      } else if (err.message.includes("404")) {
        errorMessage = "No activity found for this lead.";
      }
      
      setError(errorMessage);
      setHistory([]); // Clear history on error
    } finally {
      setLoading(false);
    }
  };

  // const fetchActivityLog = async () => {
  //   setLoading(true);
  //   try {
  //     const token = localStorage.getItem("token");
  //     const response = await fetch(
  //       `${ENDPOINTS.BASE_URL_IS}/lead-activity-log/${leadId}`,
  //       {
  //         headers: {
  //           "Content-Type": "application/json",
  //           ...(token && { Authorization: `Bearer ${token}` }),
  //         },
  //       }
  //     );

  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       throw new Error(errorData.message || `Failed to fetch activity log (Status: ${response.status})`);
  //     }

  //     const data = await response.json();
  //     const sortedHistory = data.sort(
  //       (a, b) => new Date(b.activitytimestamp) - new Date(a.activitytimestamp)
  //     );
  //     setHistory(sortedHistory);
  //   } catch (err) {
  //     console.error("Fetch Error:", err);
  //     setError(err.message || "Unable to fetch timeline data");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  useEffect(() => {
    if (leadId) {
      fetchActivityLog();
    } else {
      setHistory([]);
      setLoading(false);
    }
  }, [leadId]);

  return (
    <div className="relative w-full px-2 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-4 sm:py-6 md:py-8 lg:py-10 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] xl:h-[70vh] mx-auto max-w-7xl">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 md:mb-8 text-center">
          Lead Activity Timeline
        </h2>
        
        {loading && (
          <div className="text-center text-gray-500 text-sm sm:text-base md:text-lg">
            Loading activity history...
          </div>
        )}
        
        {error && !loading && (
          <div className="text-red-700 bg-red-100 rounded-lg px-4 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto text-center">
            {error}
          </div>
        )}
        
        {!error && !loading && history.length === 0 && (
          <div className="text-gray-500 text-xs sm:text-sm italic text-center py-3 sm:py-4">
            No activity found for this lead.
          </div>
        )}
        
        <div className="flex flex-col items-center space-y-4 sm:space-y-6 md:space-y-8 h-full overflow-y-auto">
          {history.map((entry, index) => {
            const message = getActivityMessage(entry);
            const performedBy = entry.user?.cFull_name || `User ${entry.performedbyid || "System"}`;
            const date = new Date(entry.activitytimestamp);
            const humanReadable = date.toLocaleString("en-GB", {
              day: "numeric",
              month: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }).toUpperCase();
            const color = getActivityColor(entry.activitytype);
            const summary = typeof message === "string" ? getFirstTwoLines(message) : message;

            return (
              <div
                key={entry.id || index}
                className="flex w-full relative min-h-[120px] sm:min-h-[140px] md:min-h-[160px] lg:min-h-[170px]"
                aria-label={`Timeline event: ${summary}`}
              >
                {/* Mobile & Tablet: Single column layout */}
                <div className="hidden xs:flex md:hidden w-full px-4">
                  <article
                    className="bg-white shadow-md shadow-gray-600 rounded-2xl sm:rounded-3xl p-4 sm:p-5 w-full hover:shadow-xl transition-shadow duration-300 min-h-[120px] sm:min-h-[140px]"
                    role="region"
                    aria-live="polite"
                  >
                    <div className="flex items-start space-x-3">
                      <span
                        className="block rounded-full border-4 border-white shadow-md flex-shrink-0 mt-1"
                        style={{
                          width: 20,
                          height: 20,
                          backgroundColor: color,
                        }}
                        aria-hidden="true"
                      />
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-base sm:text-lg font-semibold text-gray-900 mb-1"
                          style={{ color }}
                        >
                          Activity
                        </h3>
                        <p
                          className="text-gray-700 text-sm sm:text-base break-words overflow-hidden"
                          style={{
                            display: "-webkit-box",
                            WebkitBoxOrient: "vertical",
                            WebkitLineClamp: 2,
                          }}
                        >
                          {summary}
                        </p>
                        <footer className="mt-3 flex items-center space-x-2 text-xs sm:text-sm text-gray-500">
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(performedBy)}`}
                            alt={`Avatar of ${performedBy}`}
                            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full shadow-sm border border-gray-300"
                            loading="lazy"
                          />
                          <time dateTime={date.toISOString()}>{humanReadable}</time>
                        </footer>
                      </div>
                    </div>
                  </article>
                </div>

                {/* Desktop: Two column layout */}
                <div className="hidden md:flex w-full relative">
                  {/* Left content column */}
                  <div className="w-1/2 flex justify-end pr-6 lg:pr-8">
                    {index % 2 === 0 && (
                      <article
                        className="bg-white shadow-md shadow-gray-600 rounded-3xl p-5 lg:p-6 w-80 lg:w-96 hover:shadow-xl transition-shadow duration-300 min-h-[160px] lg:min-h-[170px]"
                        role="region"
                        aria-live="polite"
                      >
                        <h3
                          className="text-lg font-semibold text-gray-900 mb-1"
                          style={{ color }}
                        >
                          Activity
                        </h3>
                        <p
                          className="text-gray-700 text-base break-words overflow-hidden"
                          style={{
                            display: "-webkit-box",
                            WebkitBoxOrient: "vertical",
                            WebkitLineClamp: 2,
                          }}
                        >
                          {summary}
                        </p>
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
                        ...(index % 2 === 0 ? { right: "calc(100% + 12px)" } : { left: "calc(100% + 12px)" }),
                      }}
                      aria-hidden="true"
                    />
                    {index !== history.length - 1 && (
                      <div
                        className="w-1 rounded-full mt-2"
                        style={{
                          height: "80px",
                          backgroundColor: color,
                          opacity: 0.6,
                        }}
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  {/* Right content column */}
                  <div className="w-1/2 flex justify-start pl-6 lg:pl-8">
                    {index % 2 !== 0 && (
                      <article
                        className="bg-white shadow-md shadow-gray-600 rounded-3xl p-5 lg:p-6 w-80 lg:w-96 hover:shadow-xl transition-shadow duration-300 min-h-[160px] lg:min-h-[170px]"
                        role="region"
                        aria-live="polite"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 mb-1" style={{ color }} >
                          Activity
                        </h3>
                        <p className="text-gray-700 text-base whitespace-pre-line break-words">
                          {summary}
                        </p>
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


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
//     typeof msg === "string"
//       ? msg.replace(`User ${performedbyid}`, userName).replace(`${performedbyid}`, userName)
//       : msg;

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

// //  Get color for a given activity type, fallback to default
// const getActivityColor = (type) => activityColors[type] || activityColors.default;

// function getFirstTwoLines(text) {
//   if (!text) return "";
//   // Split by lines, including both \r\n and \n as line breaks
//   const lines = text.split(/\r?\n/);
//   if (lines.length <= 2) return text;
//   return lines.slice(0, 2).join('\n') + "......";
// }

// export default function LeadTimeline({ leadId }) {
//   const [history, setHistory] = useState([]);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const fetchActivityLog = async () => {
//     setLoading(true);
//     try {
//       const token = localStorage.getItem("token");
//       const response = await fetch(`${ENDPOINTS.BASE_URL_IS}/lead-activity-log/${leadId}`, {
//         headers: {
//           "Content-Type": "application/json",
//           ...(token && { Authorization: `Bearer ${token}` }),
//         },
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || `Failed to fetch activity log (Status: ${response.status})`);
//       }

//       const result = await response.json(); 
//       const activityData = result.data || [];
//       const sortedHistory = activityData.sort( (a, b) => new Date(b.activitytimestamp) - new Date(a.activitytimestamp) );
      
//       setHistory(sortedHistory);
//     } catch (err) {
//       console.error("Fetch Error:", err);
//       setError(err.message || "Unable to fetch timeline data");
//     } finally {
//       setLoading(false);
//     }
//   };



//   useEffect(() => {
//     if (leadId) {
//       fetchActivityLog();
//     } else {
//       setHistory([]);
//       setLoading(false);
//     }
//   }, [leadId]);

//   return (
//     <div className="relative w-full px-2 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-4 sm:py-6 md:py-8 lg:py-10 bg-gradient-to-br from-gray-50 to-gray-100">
//       <div className="h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] xl:h-[70vh] mx-auto max-w-7xl">
//         <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 md:mb-8 text-center"> Lead Activity Timeline </h2>
        
//         {loading && (
//           <div className="text-center text-gray-500 text-sm sm:text-base md:text-lg"> Loading activity history... </div>
//         )}
        
//         {error && !loading && (
//           <div className="text-red-700 bg-red-100 rounded-lg px-4 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto text-center">
//             {error}
//           </div>
//         )}
        
//         {!error && !loading && history.length === 0 && (
//           <div className="text-gray-500 text-xs sm:text-sm italic text-center py-3 sm:py-4"> No activity found for this lead. </div>
//         )}
        
//         <div className="flex flex-col items-center space-y-4 sm:space-y-6 md:space-y-8 h-full overflow-y-auto">
//           {history.map((entry, index) => {
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
//             }).toUpperCase();
//             const color = getActivityColor(entry.activitytype);
//             const summary = typeof message === "string" ? getFirstTwoLines(message) : message;

//             return (
//               <div key={entry.id || index} className="flex w-full relative min-h-[120px] sm:min-h-[140px] md:min-h-[160px] lg:min-h-[170px]"
//                 aria-label={`Timeline event: ${summary}`}
//               >
//                 {/* Mobile & Tablet: Single column layout */}
//                 <div className="hidden xs:flex md:hidden w-full px-4">
//                   <article className="bg-white shadow-md shadow-gray-600 rounded-2xl sm:rounded-3xl p-4 sm:p-5 w-full hover:shadow-xl transition-shadow duration-300 min-h-[120px] sm:min-h-[140px]"
//                     role="region" aria-live="polite"
//                   >
//                     <div className="flex items-start space-x-3">
//                       <span
//                         className="block rounded-full border-4 border-white shadow-md flex-shrink-0 mt-1"
//                         style={{
//                           width: 20,
//                           height: 20,
//                           backgroundColor: color,
//                         }}
//                         aria-hidden="true"
//                       />
//                       <div className="flex-1 min-w-0">
//                         <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1" style={{ color }} > Activity </h3>
//                         <p
//                           className="text-gray-700 text-sm sm:text-base break-words overflow-hidden"
//                           style={{
//                             display: "-webkit-box",
//                             WebkitBoxOrient: "vertical",
//                             WebkitLineClamp: 2,
//                           }}
//                         >
//                           {summary}
//                         </p>
//                         <footer className="mt-3 flex items-center space-x-2 text-xs sm:text-sm text-gray-500">
//                           <img
//                             src={`https://ui-avatars.com/api/?name=${encodeURIComponent(performedBy)}`}
//                             alt={`Avatar of ${performedBy}`}
//                             className="w-6 h-6 sm:w-7 sm:h-7 rounded-full shadow-sm border border-gray-300"
//                             loading="lazy"
//                           />
//                           <time dateTime={date.toISOString()}>{humanReadable}</time>
//                         </footer>
//                       </div>
//                     </div>
//                   </article>
//                 </div>

//                 {/* Desktop: Two column layout */}
//                 <div className="hidden md:flex w-full relative">
//                   {/* Left content column */}
//                   <div className="w-1/2 flex justify-end pr-6 lg:pr-8">
//                     {index % 2 === 0 && (
//                       <article
//                         className="bg-white shadow-md shadow-gray-600 rounded-3xl p-5 lg:p-6 w-80 lg:w-96 hover:shadow-xl transition-shadow duration-300 min-h-[160px] lg:min-h-[170px]"
//                         role="region"
//                         aria-live="polite"
//                       >
//                         <h3 className="text-lg font-semibold text-gray-900 mb-1" style={{ color }} > Activity </h3>
//                         <p
//                           className="text-gray-700 text-base break-words overflow-hidden"
//                           style={{
//                             display: "-webkit-box",
//                             WebkitBoxOrient: "vertical",
//                             WebkitLineClamp: 2,
//                           }}
//                         >
//                           {summary}
//                         </p>
//                         <footer className="mt-4 flex items-center space-x-3 text-sm text-gray-500">
//                           <img
//                             src={`https://ui-avatars.com/api/?name=${encodeURIComponent(performedBy)}`}
//                             alt={`Avatar of ${performedBy}`}
//                             className="w-7 h-7 rounded-full shadow-sm border border-gray-300"
//                             loading="lazy"
//                           />
//                           <time dateTime={date.toISOString()}>{humanReadable}</time>
//                         </footer>
//                       </article>
//                     )}
//                   </div>

//                   {/* Center timeline (Dot and Lines) */}
//                   <div className="flex flex-col items-center w-0 relative">
//                     <span
//                       className="block rounded-full border-4 border-white shadow-md"
//                       style={{
//                         width: 24,
//                         height: 24,
//                         backgroundColor: color,
//                         zIndex: 10,
//                       }}
//                       aria-hidden="true"
//                     />
//                     <span
//                       className="absolute top-[10px]"
//                       style={{
//                         width: 25,
//                         height: 4,
//                         backgroundColor: color,
//                         ...(index % 2 === 0 ? { right: "calc(100% + 12px)" } : { left: "calc(100% + 12px)" }),
//                       }}
//                       aria-hidden="true"
//                     />
//                     {index !== history.length - 1 && (
//                       <div
//                         className="w-1 rounded-full mt-2"
//                         style={{
//                           height: "80px",
//                           backgroundColor: color,
//                           opacity: 0.6,
//                         }}
//                         aria-hidden="true"
//                       />
//                     )}
//                   </div>

//                   {/* Right content column */}
//                   <div className="w-1/2 flex justify-start pl-6 lg:pl-8">
//                     {index % 2 !== 0 && (
//                       <article
//                         className="bg-white shadow-md shadow-gray-600 rounded-3xl p-5 lg:p-6 w-80 lg:w-96 hover:shadow-xl transition-shadow duration-300 min-h-[160px] lg:min-h-[170px]"
//                         role="region"
//                         aria-live="polite"
//                       >
//                         <h3 className="text-lg font-semibold text-gray-900 mb-1" style={{ color }} > Activity </h3>
//                         <p className="text-gray-700 text-base whitespace-pre-line break-words"> {summary} </p>
//                         <footer className="mt-4 flex items-center space-x-3 text-sm text-gray-500">
//                           <img
//                             src={`https://ui-avatars.com/api/?name=${encodeURIComponent(performedBy)}`}
//                             alt={`Avatar of ${performedBy}`}
//                             className="w-7 h-7 rounded-full shadow-sm border border-gray-300"
//                             loading="lazy"
//                           />
//                           <time dateTime={date.toISOString()}>{humanReadable}</time>
//                         </footer>
//                       </article>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>
//     </div>
//   );
// }