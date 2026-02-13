import React, { createContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { ENDPOINTS } from "../../../api/constraints";

//  Create Context
export const ServiceContext = createContext();

//  Provider Component
export const ServiceProvider = ({ children }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  //  Safely decode companyId from token
  const getCompanyIdFromToken = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const decoded = JSON.parse(window.atob(base64));
      return decoded?.company_id || null;
    } catch (err) {
      console.error("Token decode failed:", err);
      return null;
    }
  };

  //  Fetch Services
  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const companyId = getCompanyIdFromToken();

      if (!companyId) {
        setError("Company ID not found");
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${ENDPOINTS.MASTER_SERVICE_GET}?companyId=${companyId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setServices(response?.data?.data || []);
    } catch (err) {
      console.error("Error fetching services:", err);
      setError("Failed to fetch services");
    } finally {
      setLoading(false);
    }
  }, []);

  //  Auto load on mount
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  return (
    <ServiceContext.Provider
      value={{
        services,
        setServices,
        fetchServices,
        loading,
        error,
      }}
    >
      {children}
    </ServiceContext.Provider>
  );
};
