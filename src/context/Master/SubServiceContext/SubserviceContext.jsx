import React, { createContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { ENDPOINTS } from "../../../api/constraints";

// Create Context
export const SubServiceContext = createContext();

// Provider Component
export const SubServiceProvider = ({ children }) => {
  const [subServices, setSubServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Safely decode companyId from token
  const getCompanyIdFromToken = useCallback(() => {
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
  }, []);

  // Fetch Sub Services
  const fetchSubServices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const companyId = getCompanyIdFromToken();

      console.log("Fetching sub-services for company:", companyId);

      if (!companyId) {
        setError("Company ID not found");
        setLoading(false);
        return;
      }

      if (!token) {
        setError("Authentication token not found");
        setLoading(false);
        return;
      }

      // Use company-specific endpoint
      const url = `${ENDPOINTS.SUB_SERVICE}?companyId=${companyId}`;
      console.log("Fetching from URL:", url);

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("API Response:", response.data);

      // Handle the response structure based on your backend
      let subServicesData = [];
      
      // Based on your getSubServices function, it returns data directly in response.data.data
      if (response.data?.data && Array.isArray(response.data.data)) {
        subServicesData = response.data.data;
      } else if (response.data?.body && Array.isArray(response.data.body)) {
        subServicesData = response.data.body;
      } else if (Array.isArray(response.data)) {
        subServicesData = response.data;
      }

      console.log("Processed sub-services:", subServicesData);
      setSubServices(subServicesData);

      if (subServicesData.length === 0) {
        setError("No sub-services found for this company. Please create sub-services in the master section.");
      }
    } catch (err) {
      console.error("Error fetching sub-services:", err);
      
      // Handle specific error cases
      if (err.response?.status === 401) {
        setError("Unauthorized. Please log in again.");
      } else if (err.response?.status === 404) {
        setError("Sub-services API endpoint not found.");
      } else {
        setError(err.response?.data?.Message || "Failed to fetch sub-services");
      }
    } finally {
      setLoading(false);
    }
  }, [getCompanyIdFromToken]);

  // Auto load on mount
  useEffect(() => {
    fetchSubServices();
  }, [fetchSubServices]);

  // Refresh function for manual refresh
  const refreshSubServices = useCallback(() => {
    fetchSubServices();
  }, [fetchSubServices]);

  return (
    <SubServiceContext.Provider
      value={{
        subServices,
        setSubServices,
        fetchSubServices,
        refreshSubServices,
        loading,
        error,
        companyId: getCompanyIdFromToken(),
      }}
    >
      {children}
    </SubServiceContext.Provider>
  );
};