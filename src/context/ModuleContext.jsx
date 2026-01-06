import React, { createContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { ENDPOINTS } from "../api/constraints";

export const ModuleContext = createContext();

export const ModuleProvider = ({ children }) => {
  const [modules, setModules] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch Modules function
  const fetchModules = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);

    try {
      const response = await axios.get(`${ENDPOINTS.MODULE}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setModules(response.data.data || []);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchModules();
    }
  }, []);

  useEffect(() => {
    const handleTokenSet = () => {
      fetchModules(); 
    };

    window.addEventListener("token-set", handleTokenSet);

    return () => window.removeEventListener("token-set", handleTokenSet);
  }, []);

  // Checkbox toggle shared handler
  const handleCheckboxChange = useCallback((id) => {
    setModules((prevModules) =>
      prevModules.map((module) =>
        module.imodule_id === id
          ? { ...module, bactive: !module.bactive }
          : module
      )
    );
  }, []);

  return (
    <ModuleContext.Provider
      value={{
        modules,
        loading,
        error,
        handleCheckboxChange,
      }}
    >
      {children}
    </ModuleContext.Provider>
  );
};

