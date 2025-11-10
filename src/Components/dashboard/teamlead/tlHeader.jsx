import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function TeamleadHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  const [phoneActive, setPhoneActive] = useState(false);
  const [homeAttributes, setHomeAttributes] = useState([]);

  const currentPath = location.pathname;

  // Load user access and filter unique attributes
  useEffect(() => {
    const storedAccess = localStorage.getItem("loginResponse");
    if (storedAccess) {
      try {
        const parsed = JSON.parse(storedAccess);
        const modules = parsed?.user_attributes || [];

        // Only include module_id = 1 and selected attributes
        const allowed = ["Dashboard", "Leads", "Team Dashboard", "Kanban-board"];
        const homeData = modules
          .filter(
            (item) =>
              item.module_id === 1 && allowed.includes(item.attribute_name)
          )
          // Remove duplicates by attribute_name
          .filter(
            (item, index, self) =>
              index ===
              self.findIndex(
                (t) => t.attribute_name === item.attribute_name
              )
          );

        setHomeAttributes(homeData);
      } catch (error) {
        console.error("Error parsing loginResponse:", error);
      }
    }
  }, []);

  // Handle phone access for Call Logs
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

  // Route mapping
  const routeMap = {
    Dashboard: "/leads",
    Leads: "/active-leads",
    "Team Dashboard": "/teamview",
    "Kanban-board": "/status-kanban",
  };

  const handleDynamicClick = (attributeName) => {
    const path = routeMap[attributeName];
    if (path) navigate(path);
  };

  // --- FIXED: exact match for active state ---
  const isActive = (attributeName) => {
    const path = routeMap[attributeName];
    return path && currentPath === path;
    // If you sometimes have "child" routes, use startsWith:
    // return path && currentPath.startsWith(path);
  };

  return (
    <div className="flex flex-col gap-2 bg-white rounded-lg px-4 py-2 shadow-sm">
      <div className="flex gap-4 items-center flex-wrap">
        {homeAttributes.map((attr, index) => (
          <React.Fragment key={attr.iua_id || index}>
            <button
              onClick={() => handleDynamicClick(attr.attribute_name)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                isActive(attr.attribute_name)
                  ? "bg-black text-white"
                  : "text-black hover:bg-gray-100"
              }`}
            >
              {attr.attribute_name}
            </button>

            {index < homeAttributes.length - 1 && (
              <div className="w-px h-5 bg-gray-300"></div>
            )}
          </React.Fragment>
        ))}

        {phoneActive && (
          <>
            <div className="w-px h-5 bg-gray-300"></div>
            <button
              onClick={() => navigate("/logusercalllogs")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                currentPath === "/logusercalllogs"
                  ? "bg-black text-white"
                  : "text-black hover:bg-gray-100"
              }`}
            >
              Call Logs
            </button>
          </>
        )}
      </div>
    </div>
  );
}
