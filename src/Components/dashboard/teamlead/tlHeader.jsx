import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUserAccess } from "../../../context/UserAccessContext";
import { Menu, X } from "lucide-react"; 

export default function TeamleadHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userModules } = useUserAccess();
  const [phoneActive, setPhoneActive] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const currentPath = location.pathname;
  const allowedAttributeIds = [1, 2, 3, 5];

  const TAB_ORDER = {
    "Dashboard": 1,
    "Leads": 2,
    "Team Dashboard": 3,
    "Kanban-board": 4,
    "Call Logs": 5
  };

  const routeMap = {
    Dashboard: "/leads",
    Leads: "/active-leads",
    "Team Dashboard": "/teamview",
    "Kanban-board": "/status-kanban",
    "Call Logs": "/logusercalllogs"
  };

  const homeAttributes = (userModules || [])
    .filter(item => item.module_id === 1 && item.bactive === true && allowedAttributeIds.includes(item.attributes_id))
    .filter((item, index, self) => index === self.findIndex((t) => t.attribute_name === item.attribute_name))
    .sort((a, b) => (TAB_ORDER[a.attribute_name] || 999) - (TAB_ORDER[b.attribute_name] || 999));

  const handleDynamicClick = (attributeName) => {
    const path = routeMap[attributeName];
    if (path) {
      navigate(path);
      setIsMenuOpen(false); 
    }
  };

  const isActive = (attributeName) => {
    const path = routeMap[attributeName];
    if (attributeName === "Dashboard") {
      return currentPath === "/leads" || currentPath === "/leaddashboard" || currentPath === "/";
    }
    return path && currentPath === path;
  };

  useEffect(() => {
    const storedUserData = localStorage.getItem("user");
    if (storedUserData) {
      try {
        const parsedData = JSON.parse(storedUserData);
        setPhoneActive(parsedData?.DCRM_enabled === true);
      } catch (error) { console.error(error); }
    }
  }, []);

  return (
    <div className=" mb-4">
      {/* Main Header Container */}
      <div className="flex items-center justify-between bg-white rounded-lg px-4 py-2 shadow-sm min-h-[52px]">
        
        {/* MOBILE MENU BUTTON */}
        <div className="md:hidden">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2 px-3 py-2 border rounded-md bg-white hover:bg-gray-50 relative z-[1001]"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            <span className="text-sm font-semibold">Menu</span>
          </button>
        </div>

        {/* DESKTOP MENU */}
        <div className="hidden md:flex items-center gap-2 flex-wrap">
          {homeAttributes.map((attr, index) => {
            const active = isActive(attr.attribute_name);
            return (
              <React.Fragment key={attr.iua_id || index}>
                <button
                  onClick={() => handleDynamicClick(attr.attribute_name)}
                  className={`px-4 py-2 rounded-md text-sm transition-all duration-200 ${
                    active ? "bg-black text-white font-bold" : "text-black hover:bg-gray-100"
                  }`}
                >
                  {attr.attribute_name}
                </button>
                {index < homeAttributes.length - 1 && (
                  <div className="w-px h-5 bg-gray-300 mx-1"></div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* MOBILE LIST */}
      {isMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/10 z-[9998]" onClick={() => setIsMenuOpen(false)} />
          
          <div className="fixed top-[130px] left-6 w-[200px] bg-white border border-gray-200 shadow-2xl rounded-lg z-[9999] p-1 animate-in slide-in-from-top-2">
            {homeAttributes.map((attr) => {
              const active = isActive(attr.attribute_name);
              return (
                <button
                  key={attr.attribute_name}
                  onClick={() => handleDynamicClick(attr.attribute_name)}
                  className={`w-full text-left px-4 py-3 rounded-md text-sm mb-1 transition-colors ${
                    active ? "bg-black text-white font-bold" : "text-gray-700 hover:bg-gray-100 font-medium"
                  }`}
                >
                  {attr.attribute_name}
                </button>
              );
            })}
            
            {phoneActive && !homeAttributes.some(a => a.attribute_name === "Call Logs") && (
              <button
                onClick={() => handleDynamicClick("Call Logs")}
                className={`w-full text-left px-4 py-3 rounded-md text-sm ${
                  currentPath === "/logusercalllogs" ? "bg-black text-white font-bold" : "text-gray-700 hover:bg-gray-100 font-medium"
                }`}
              >
                Call Logs
              </button>
            )}
          </div>
        </>
      )}
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

//   // Allowed attribute IDs
//   const allowedAttributeIds = [1, 2, 3, 5];

//   // Define the specific order priority
//   const TAB_ORDER = {
//     "Dashboard": 1,
//     "Leads": 2,
//     "Team Dashboard": 3,
//     "Kanban-board": 4,
//     "Call Logs": 5
//   };

//   // Route mapping for navigation
//   const routeMap = {
//     Dashboard: "/leads",
//     Leads: "/active-leads",
//     "Team Dashboard": "/teamview",
//     "Kanban-board": "/status-kanban",
//     "Call Logs": "/logusercalllogs"
//   };

//   const homeAttributes = (userModules || [])
//     .filter(
//       (item) =>
//         item.module_id === 1 &&
//         item.bactive === true &&
//         allowedAttributeIds.includes(item.attributes_id)
//     )
//     .filter(
//       (item, index, self) =>
//         index === self.findIndex((t) => t.attribute_name === item.attribute_name)
//     )
//     .sort((a, b) => {
//       const orderA = TAB_ORDER[a.attribute_name] || 999;
//       const orderB = TAB_ORDER[b.attribute_name] || 999;
//       return orderA - orderB;
//     });

//   // Handle navigation
//   const handleDynamicClick = (attributeName) => {
//     const path = routeMap[attributeName];
//     if (path) navigate(path);
//   };

//   const isActive = (attributeName) => {
//     const path = routeMap[attributeName];
//     if (attributeName === "Dashboard") {
//       return currentPath === path || currentPath === "/leaddashboard";
//     }
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
//     <div className="flex items-center bg-white rounded-lg px-4 py-2 shadow-sm min-h-[52px]">
//     {/*  <div className="flex flex-col gap-2 bg-white rounded-lg px-4 py-2 shadow-sm"> */}
//       <div className="flex gap-4 items-center flex-wrap">
//         {homeAttributes.map((attr, index) => {
//           const active = isActive(attr.attribute_name);
//           return (
//             <React.Fragment key={attr.iua_id || index}>
//               <button
//                 onClick={() => handleDynamicClick(attr.attribute_name)}
//                 className={`px-4 py-2 rounded-md text-sm transition-all duration-200 ${
//                   active
//                     ? "bg-black text-white"
//                     : "text-black hover:bg-gray-100"
//                 }`}
//               >
//                 <span className="inline-grid grid-cols-1 grid-rows-1 items-center justify-items-center">
//                   <span className="invisible font-bold row-start-1 col-start-1 px-1">
//                     {attr.attribute_name}
//                   </span>
//                   {/* 2. This is the text you actually see */}
//                   <span className={`${active ? "font-bold" : "font-normal"} row-start-1 col-start-1`}>
//                     {attr.attribute_name}
//                   </span>
//                 </span>
//               </button>

//               {/* Separator */}
//               {index < homeAttributes.length - 1 && (
//                 <div className="w-px h-5 bg-gray-300 shrink-0 mx-1"></div>
//               )}
//             </React.Fragment>
//           );
//         })}
//         {/* {homeAttributes.map((attr, index) => (
//           <React.Fragment key={attr.iua_id || index}>
//             <button
//               onClick={() => handleDynamicClick(attr.attribute_name)}
//               className={`px-4 py-2 rounded-md text-sm transition-all duration-200 min-w-[100px] text-center ${
//                 isActive(attr.attribute_name)
//                   ? "bg-black text-white font-bold" 
//                   : "text-black hover:bg-gray-100 font-normal"
//               }`}
//             >
//               {attr.attribute_name}
//             </button>
//             {/* <button
//               onClick={() => handleDynamicClick(attr.attribute_name)}
//               className={`px-4 py-2 rounded-md text-sm font-medium transition ${
//                 isActive(attr.attribute_name)
//                   ? "bg-black text-white shadow-md" 
//                   : "text-black hover:bg-gray-100"
//               }`}
//             >
//               {attr.attribute_name}
//             </button> */}

//             {/* Render separator logic */}
//             {/* {(index < homeAttributes.length - 1 || (phoneActive && userModules?.some(m => m.attribute_name === "Call Logs" && m.bactive))) && (
//               <div className="w-px h-5 bg-gray-300"></div>
//             )}
//           </React.Fragment>
//         ))}  */}

//         {/* Call Logs button */}
//         {phoneActive && 
//          userModules?.some(attr => attr.attribute_name === "Call Logs" && attr.bactive === true) && 
//          !homeAttributes.some(attr => attr.attribute_name === "Call Logs") && (
//           <button
//             onClick={() => navigate("/logusercalllogs")}
//             className={`px-4 py-2 rounded-md text-sm font-medium transition ${
//               currentPath === "/logusercalllogs"
//                 ? "bg-black text-white shadow-md"
//                 : "text-black hover:bg-gray-100"
//             }`}
//           >
//             Call Logs
//           </button>
//         )}
//       </div>
//     </div>
//   );
// }

