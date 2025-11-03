import React,{ createContext, useState, useEffect, useCallback} from "react";
import { ENDPOINTS } from "../api/constraints";

export const GlobUserContext = createContext();

export const GlobeUserProvider = ({ children }) => {
  const [user, setUser] = useState([]);
  const [companyId, setCompanyId] = useState(null);
  const [userId, setUserId] = useState(null);

  const getToken = () => localStorage.getItem("token") || null;

  const decodeToken = useCallback(() => {
    const token = getToken();
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(atob(base64));
    } catch (error) {
      console.log("Token decode error is", error);
      return null;
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      console.error("Token not available");
      return;
    }
    const fetchUsersList = async () => {
      try {
        const res = await fetch(ENDPOINTS.USER_GET, {
          headers: { Authorization: `Bearer ${token}` ,
        "Content-Type": "application/json",
}
        });
        const json = await res.json();
        if (res.ok) {
  setUser(json.data || json); 
  // console.log("User fetched successfully", json.data || json);
}
 else {
          console.error("Can't get users", json);
        }
      } catch (error) {
        console.error("Failed to fetch users", error);
      }
    };
    fetchUsersList();
  }, [decodeToken]);

  return (
    <GlobUserContext.Provider value={{ user, setUser, companyId, setCompanyId, userId }}>
      {children}
    </GlobUserContext.Provider>
  );
};