import React, { createContext, useState, useEffect, useContext } from "react";
import { ENDPOINTS } from "../api/constraints";

const BusinessContext = createContext();

export const BusinessProvider = ({ children }) => {
  const [businessTypes, setBusinessTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBusinessTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch(ENDPOINTS.BUSINESS_TYPE);
      const result = await response.json();
      
      if (result.success && result.data && result.data.data) {
        const activeTypes = result.data.data.filter((t) => t.bactive === true);
        setBusinessTypes(activeTypes);
      }
    } catch (error) {
      console.error("Error fetching business types:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessTypes();
  }, []);

  return (
    <BusinessContext.Provider value={{ businessTypes, loading, refreshBusinessTypes: fetchBusinessTypes }}>
      {children}
    </BusinessContext.Provider>
  );
};

// Custom hook for easy usage
export const useBusiness = () => useContext(BusinessContext);