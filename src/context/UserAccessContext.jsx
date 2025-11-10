// src/context/UserAccessContext.js
import React, { createContext, useContext, useState, useEffect } from "react";

const UserAccessContext = createContext();

export const UserAccessProvider = ({ children, data }) => {
  const [userAccess, setUserAccess] = useState(null);
  const [userModules, setUserModules] = useState([]);

  useEffect(() => {
    // Try from props first, then from localStorage
    if (data) {
      setUserAccess(data);
      const moduleData = data.user_attributes || [];
      setUserModules(moduleData);
      localStorage.setItem("loginResponse", JSON.stringify(data)); // keep synced
    } else {
      const stored = localStorage.getItem("loginResponse");
      if (stored) {
        const parsed = JSON.parse(stored);
        setUserAccess(parsed);
        const moduleData = parsed.user_attributes || [];
        setUserModules(moduleData);

        // console.log("Loaded user data from localStorage:", parsed);
        // console.log("Sidebar Module List:", moduleData);
      } else {
        console.warn("No login data found in localStorage or props.");
      }
    }
  }, [data]);

  return (
    <UserAccessContext.Provider value={{ userAccess, userModules }}>
      {children}
    </UserAccessContext.Provider>
  );
};

export const useUserAccess = () => useContext(UserAccessContext);
