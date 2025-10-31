import React, { createContext, useCallback, useState, useEffect } from "react";
import { ENDPOINTS } from "../api/constraints";

export const companyContext = createContext();

export const CompanyProvider = ({ children }) => {
  const [company, setCompany] = useState([]);
  const [companyId, setCompanyId] = useState(null);

  const getToken = () => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("users");
    if (token) return token;
    try {
      const userString = JSON.parse(user);
      return userString?.company_id || null;
    } catch (error) {
      console.log("no user details found:", error);
      return null;
    }
  };

  useEffect(() => {
    const decodeToken = () => {
      const token = localStorage.getItem("token");
      if (!token) return null;
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        return JSON.parse(atob(base64));
      } catch (error) {
        console.error("Token decode error:", error);
        return null;
      }
    };

    const fetchCompanyDetails = async (cid) => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${ENDPOINTS.COMPANY}/${cid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const data = await res.json();
        setCompany(data);
      } catch (error) {
        console.error("Can't get company details", error);
      }
    };

    const decoded = decodeToken();
    if (decoded?.company_id) {
      setCompanyId(decoded.company_id);
      fetchCompanyDetails(decoded.company_id);
    }
  }, []);

  return (
    <companyContext.Provider
      value={{
        company,
        setCompany,
        companyId,
        setCompanyId,
      }}
    >
      {children}
    </companyContext.Provider>
  );
};
