import React, { createContext, useState, useEffect} from "react";
import { ENDPOINTS } from "../api/constraints";

export const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    const fetchRoles = async () => {
      const token = getToken();
      if (!token) return;
      setLoading(true);

      try {
        const res = await fetch(ENDPOINTS.ROLE, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        const json = await res.json();
        if (!res.ok) {
          console.error("Role fetch failed", json);
          return;
        }

        // ACTIVE ROLES
        const activeRoles = (json.data || json).filter(
          role => role.bactive === true
        );

        setRoles(activeRoles);
      } catch (err) {
        console.error("Role fetch error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, []);

  return (
    <RoleContext.Provider value={{ roles, loading }}>
      {children}
    </RoleContext.Provider>
  );
};
