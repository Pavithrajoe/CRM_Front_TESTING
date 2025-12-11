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

    // ❗ STOP if no token — avoids hitting API before login
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

  // ⛔ Do NOT fetch on first load — only fetch if token exists
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchModules();
    }
  }, []);

  // 🔄 Listen for login event ("token-set") and fetch modules after login
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




// import React, { createContext, useState, useEffect, useCallback } from "react";
// import axios from "axios";
// import { ENDPOINTS } from "../api/constraints";

// export const ModuleContext = createContext();

// export const ModuleProvider = ({ children }) => {
//   const [modules, setModules] = useState([]);
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     const fetchModules = async () => {
//       setLoading(true);
//       const token = localStorage.getItem("token");

//       try {
//         const response = await axios.get(`${ENDPOINTS.MODULE}`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         setModules(response.data.data || []);
//       } catch (err) {
//         setError(err.message || "Something went wrong");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchModules();
//   }, []);

//   // Toggle active handler shared to all components
//   const handleCheckboxChange = useCallback((id) => {
//     setModules((prevModules) =>
//       prevModules.map((module) =>
//         module.imodule_id === id
//           ? { ...module, bactive: !module.bactive }
//           : module
//       )
//     );
//   }, []);

//   return (
//     <ModuleContext.Provider value={{
//       modules,
//       loading,
//       error,
//       handleCheckboxChange
//     }}>
//       {children}
//     </ModuleContext.Provider>
//   );
// };
