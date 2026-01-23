import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { ENDPOINTS } from "../api/constraints";

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [settingsAccess, setSettingsAccess] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      let company_id = null;

      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          company_id = payload.company_id;
        } catch (e) {
          console.error("Could not decode token", e);
        }
      }

      if (!company_id) {
        setError("Company ID not found in token");
        setLoading(false);
        return;
      } 

      try {
        const response = await axios.get(`${ENDPOINTS.COMPANY_SETTINGS}/${company_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // console.log("settings Data", response.data.result);
        setSettingsAccess(response.data.result);
      } catch (error) {
        setError(error.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settingsAccess, loading, error }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettingsAccess = () => useContext(SettingsContext);
