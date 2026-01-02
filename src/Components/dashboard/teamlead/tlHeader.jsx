import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUserAccess } from "../../../context/UserAccessContext";

export default function TeamleadHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userModules } = useUserAccess();

  const [phoneActive, setPhoneActive] = useState(false);
  const currentPath = location.pathname;

  // Allowed attribute IDs
  const allowedAttributeIds = [1, 2, 3, 5];

  // Define the specific order priority
  const TAB_ORDER = {
    "Dashboard": 1,
    "Leads": 2,
    "Team Dashboard": 3,
    "Kanban-board": 4,
    "Call Logs": 5
  };

  // Route mapping for navigation
  const routeMap = {
    Dashboard: "/leads",
    Leads: "/active-leads",
    "Team Dashboard": "/teamview",
    "Kanban-board": "/status-kanban",
    "Call Logs": "/logusercalllogs"
  };

  const homeAttributes = (userModules || [])
    .filter(
      (item) =>
        item.module_id === 1 &&
        item.bactive === true &&
        allowedAttributeIds.includes(item.attributes_id)
    )
    .filter(
      (item, index, self) =>
        index === self.findIndex((t) => t.attribute_name === item.attribute_name)
    )
    .sort((a, b) => {
      const orderA = TAB_ORDER[a.attribute_name] || 999;
      const orderB = TAB_ORDER[b.attribute_name] || 999;
      return orderA - orderB;
    });

  // Handle navigation
  const handleDynamicClick = (attributeName) => {
    const path = routeMap[attributeName];
    if (path) navigate(path);
  };

  const isActive = (attributeName) => {
    const path = routeMap[attributeName];
    if (attributeName === "Dashboard") {
      return currentPath === path || currentPath === "/leaddashboard";
    }
    return path && currentPath === path;
  };

  // Handle phone access
  useEffect(() => {
    const storedUserData = localStorage.getItem("user");
    if (storedUserData) {
      try {
        const parsedData = JSON.parse(storedUserData);
        const phoneAccess = parsedData?.DCRM_enabled === true;
        setPhoneActive(phoneAccess);
        localStorage.setItem("phone_access", phoneAccess);
      } catch (error) {
        console.error("Error parsing user_data:", error);
      }
    } else {
      const phoneAccess = localStorage.getItem("DCRM_enabled") === "true";
      setPhoneActive(phoneAccess);
    }
  }, []);

  return (
    <div className="flex items-center bg-white rounded-lg px-4 py-2 shadow-sm min-h-[52px]">
    {/*  <div className="flex flex-col gap-2 bg-white rounded-lg px-4 py-2 shadow-sm"> */}
      <div className="flex gap-4 items-center flex-wrap">
        {homeAttributes.map((attr, index) => {
          const active = isActive(attr.attribute_name);
          return (
            <React.Fragment key={attr.iua_id || index}>
              <button
                onClick={() => handleDynamicClick(attr.attribute_name)}
                className={`px-4 py-2 rounded-md text-sm transition-all duration-200 ${
                  active
                    ? "bg-black text-white"
                    : "text-black hover:bg-gray-100"
                }`}
              >
                <span className="inline-grid grid-cols-1 grid-rows-1 items-center justify-items-center">
                  <span className="invisible font-bold row-start-1 col-start-1 px-1">
                    {attr.attribute_name}
                  </span>
                  {/* 2. This is the text you actually see */}
                  <span className={`${active ? "font-bold" : "font-normal"} row-start-1 col-start-1`}>
                    {attr.attribute_name}
                  </span>
                </span>
              </button>

              {/* Separator */}
              {index < homeAttributes.length - 1 && (
                <div className="w-px h-5 bg-gray-300 shrink-0 mx-1"></div>
              )}
            </React.Fragment>
          );
        })}
        {/* {homeAttributes.map((attr, index) => (
          <React.Fragment key={attr.iua_id || index}>
            <button
              onClick={() => handleDynamicClick(attr.attribute_name)}
              className={`px-4 py-2 rounded-md text-sm transition-all duration-200 min-w-[100px] text-center ${
                isActive(attr.attribute_name)
                  ? "bg-black text-white font-bold" 
                  : "text-black hover:bg-gray-100 font-normal"
              }`}
            >
              {attr.attribute_name}
            </button>
            {/* <button
              onClick={() => handleDynamicClick(attr.attribute_name)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                isActive(attr.attribute_name)
                  ? "bg-black text-white shadow-md" 
                  : "text-black hover:bg-gray-100"
              }`}
            >
              {attr.attribute_name}
            </button> */}

            {/* Render separator logic */}
            {/* {(index < homeAttributes.length - 1 || (phoneActive && userModules?.some(m => m.attribute_name === "Call Logs" && m.bactive))) && (
              <div className="w-px h-5 bg-gray-300"></div>
            )}
          </React.Fragment>
        ))}  */}

        {/* Call Logs button */}
        {phoneActive && 
         userModules?.some(attr => attr.attribute_name === "Call Logs" && attr.bactive === true) && 
         !homeAttributes.some(attr => attr.attribute_name === "Call Logs") && (
          <button
            onClick={() => navigate("/logusercalllogs")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              currentPath === "/logusercalllogs"
                ? "bg-black text-white shadow-md"
                : "text-black hover:bg-gray-100"
            }`}
          >
            Call Logs
          </button>
        )}
      </div>
    </div>
  );
}


// import React, { useEffect, useState } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { useUserAccess } from "../../../context/UserAccessContext";

// export default function TeamleadHeader() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { userModules } = useUserAccess();

//   const [phoneActive, setPhoneActive] = useState(false);
//   const currentPath = location.pathname;
// // Allowed attribute IDs
// const allowedAttributeIds = [1, 2, 3, 5];

// // Filter: only Home module, active, allowed attributes, and remove duplicates
// const homeAttributes = (userModules || [])
//   .filter(
//     (item) =>
//       item.module_id === 1 &&
//       item.bactive === true &&
//       allowedAttributeIds.includes(item.attributes_id)
//   )
//   // Remove duplicates based on attribute_name
//   .filter(
//     (item, index, self) =>
//       index === self.findIndex((t) => t.attribute_name === item.attribute_name)
//   );



//   // Route mapping for navigation
//   const routeMap = {
//     Dashboard: "/leads",
//     Leads: "/active-leads",
//     "Team Dashboard": "/teamview",
//     "Kanban-board": "/status-kanban",
//   };

//   // Handle navigation
//   const handleDynamicClick = (attributeName) => {
//     const path = routeMap[attributeName];
//     if (path) navigate(path);
//   };

//   // Check active route
//   const isActive = (attributeName) => {
//     const path = routeMap[attributeName];
//     return path && currentPath === path;
//   };

//   // Handle phone access
//   useEffect(() => {
//     const storedUserData = localStorage.getItem("user");
//     if (storedUserData) {
//       try {
//         const parsedData = JSON.parse(storedUserData);
//         const phoneAccess = parsedData?.DCRM_enabled === true;
//         setPhoneActive(phoneAccess);
//         localStorage.setItem("phone_access", phoneAccess);
//       } catch (error) {
//         console.error("Error parsing user_data:", error);
//       }
//     } else {
//       const phoneAccess = localStorage.getItem("DCRM_enabled") === "true";
//       setPhoneActive(phoneAccess);
//     }
//   }, []);

//   return (
//     <div className="flex flex-col gap-2 bg-white rounded-lg px-4 py-2 shadow-sm">
//       <div className="flex gap-4 items-center flex-wrap">
//         {homeAttributes.map((attr, index) => (
//           <React.Fragment key={attr.iua_id || index}>
//             <button
//               onClick={() => handleDynamicClick(attr.attribute_name)}
//               className={`px-4 py-2 rounded-md text-sm font-medium transition ${
//                 isActive(attr.attribute_name)
//                   ? "bg-black text-white"
//                   : "text-black hover:bg-gray-100"
//               }`}
//             >
//               {attr.attribute_name}
//             </button>

//             {index < homeAttributes.length - 1 && (
//               <div className="w-px h-5 bg-gray-300"></div>
//             )}
//           </React.Fragment>
//         ))}

//         {/* Keep Call Logs same chat */}
//         {phoneActive && userModules.some(attr => attr.attribute_name === "Call Logs" && attr.bactive === true) && (
//           <>
//             <div className="w-px h-5 bg-gray-300"></div>
//             <button
//               onClick={() => navigate("/logusercalllogs")}
//               className={`px-4 py-2 rounded-md text-sm font-medium transition ${
//                 currentPath === "/logusercalllogs"
//                   ? "bg-black text-white"
//                   : "text-black hover:bg-gray-100"
//               }`}
//             >
//               Call Logs
//             </button>
//           </>
//         )}
        

//         {/* {phoneActive && (
//           <>
//             <div className="w-px h-5 bg-gray-300"></div>
//             <button
//               onClick={() => navigate("/logusercalllogs")}
//               className={`px-4 py-2 rounded-md text-sm font-medium transition ${
//                 currentPath === "/logusercalllogs"
//                   ? "bg-black text-white"
//                   : "text-black hover:bg-gray-100"
//               }`}
//             >
//               Call Logs
//             </button>
//           </>
//         )} */}
//       </div>
//     </div>
//   );
// }
