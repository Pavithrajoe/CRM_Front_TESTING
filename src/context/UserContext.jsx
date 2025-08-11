import React, { createContext, useState, useEffect, useCallback } from "react";
import { ENDPOINTS } from "../api/constraints";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [companyId, setCompanyId] = useState(null);
  const [userId, setUserId] = useState(null);

  // Utility: Get token from localStorage or cookie
  const getToken = () => {
    const token = localStorage.getItem("token");
    if (token) return token;

    const match = document.cookie.match(new RegExp("(^| )token=([^;]+)"));
    return match ? match[2] : null;
  };

  // Utility: Decode JWT token to extract payload
  const decodeToken = useCallback(() => {
    const token = getToken();
    if (!token) return null;

    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(atob(base64));
    } catch (err) {
      console.error("Token decode error:", err);
      return null;
    }
  }, []);

  // Fetch and filter users by company ID
  const fetchUsersFromAPI = useCallback(async (cid) => {
    try {
      const token = getToken();
      const res = await fetch(ENDPOINTS.USER_GET, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`${res.status}: ${res.statusText} - ${errText}`);
      }

      const data = await res.json();
      const companyUsers = data.filter((user) => user.iCompany_id === cid);
      console.log("result",)

      setUsers(companyUsers);
      localStorage.setItem("users", JSON.stringify(companyUsers));
    } catch (error) {
      console.error("User fetch error:", error);
    }
  }, []);

  // Initial setup
  useEffect(() => {
    const payload = decodeToken();
    if (!payload) return;

    const cid = payload.company_id || payload.iCompany_id;
    const uid = payload.user_id || payload.iUser_id;

    if (cid) setCompanyId(cid);
    if (uid) setUserId(uid);

    const stored = localStorage.getItem("users");
    if (stored) {
      setUsers(JSON.parse(stored));
    } else if (cid) {
      fetchUsersFromAPI(cid);
    }
  }, [decodeToken, fetchUsersFromAPI]);

  // Sync users to localStorage
  useEffect(() => {
    if (Array.isArray(users)) {
      localStorage.setItem("users", JSON.stringify(users));
    }
  }, [users]);

  return (
    <UserContext.Provider value={{ users, setUsers, companyId, userId }}>
      {children}
    </UserContext.Provider>
  );
};