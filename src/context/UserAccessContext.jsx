import React, { createContext, useContext, useState, useEffect } from "react";

const UserAccessContext = createContext();

export const UserAccessProvider = ({ children, data }) => {
  const [userAccess, setUserAccess] = useState(null);
  const [userModules, setUserModules] = useState([]);

  useEffect(() => {
    if (data) {
      setUserAccess(data);
      const moduleData = data.user_attributes || [];
      setUserModules(moduleData);
      localStorage.setItem("loginResponse", JSON.stringify(data)); 
    } else {
      const stored = localStorage.getItem("loginResponse");
      if (stored) {
        const parsed = JSON.parse(stored);
        setUserAccess(parsed);
        const moduleData = parsed.user_attributes || [];
        setUserModules(moduleData);

      } else {
        console.warn("No login data found in localStorage or props.");
      }
    }
  }, [data]);


  useEffect(() => {
  if (data) {
    console.log("Login Data from API:", data);
  } else {
    const stored = localStorage.getItem("loginResponse");
    console.log("Login Data from localStorage:", JSON.parse(stored));
  }
}, [data]);


  return (
    <UserAccessContext.Provider value={{ userAccess, userModules }}>
      {children}
    </UserAccessContext.Provider>
  );
};

export const useUserAccess = () => useContext(UserAccessContext);
