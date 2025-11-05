import React, { createContext, useState, useEffect, useCallback, useMemo } from "react"; // 💡 Added useMemo
import { ENDPOINTS } from "../api/constraints";

export const UserContext = createContext();

// 💡 HELPER: Move token fetching and decoding logic outside the component
const getToken = () => {
  const token = localStorage.getItem("token");
  if (token) return token;
  const match = document.cookie.match(new RegExp("(^| )token=([^;]+)"));
  return match ? match[2] : null;
};

const decodeToken = () => {
  const token = getToken();
  if (!token) return null;

  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    
    // Check for token expiry right here
    if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        return null;
    }
    return payload;
  } catch (err) {
    console.error("Token decode error:", err);
    return null;
  }
};


export const UserProvider = ({ children }) => {
    // 💡 FIX 1: Initialize state directly by calling the decoding function.
    // This makes the state stable on the very first render, preventing the re-render.
    const initialPayload = useMemo(() => decodeToken(), []); // Only runs once
    
    const initialCompanyId = initialPayload?.company_id || initialPayload?.iCompany_id || null;
    const initialUserId = initialPayload?.user_id || initialPayload?.iUser_id || null;
    const initialUsers = initialCompanyId && localStorage.getItem("users") 
                        ? JSON.parse(localStorage.getItem("users")) 
                        : [];

    const [users, setUsers] = useState(initialUsers);
    const [companyId, setCompanyId] = useState(initialCompanyId);
    const [userId, setUserId] = useState(initialUserId);

    // 💡 The previous getToken/decodeToken functions are now outside or can be removed if you use the helper.
    
    const logout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("users");
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        setUsers([]);
        setCompanyId(null);
        setUserId(null);
    }, []);

    const fetchUsersFromAPI = useCallback(async (cid) => {
        // ... (API fetching logic remains the same) ...
        try {
            const token = getToken();
            const res = await fetch(ENDPOINTS.USER_GET, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) {
                // ... error handling ...
            }

            const data = await res.json();
            const companyUsers = data.filter((user) => user.iCompany_id === cid);

            setUsers(companyUsers);
            // localStorage.setItem("users", JSON.stringify(companyUsers)); // Removed: Sync in the other useEffect
        } catch (error) {
            console.error("User fetch error:", error);
        }
    }, []);

    // 💡 FIX 2: Simplify and isolate the side effect to fetching only.
    // The state initialization logic is now handled in the useState call above.
    useEffect(() => {
        if (companyId && users.length === 0) {
            fetchUsersFromAPI(companyId);
        }
    }, [companyId, fetchUsersFromAPI, users.length]); // Dependencies are clean

    // ✅ Sync users to localStorage (This is fine)
    useEffect(() => {
        if (Array.isArray(users) && users.length > 0) {
            localStorage.setItem("users", JSON.stringify(users));
        }
    }, [users]);

    // ✅ Logged-in status
    const isLoggedIn = !!getToken(); // Still safe as it calls the external helper

    return (
        <UserContext.Provider
            value={{
                users,
                setUsers,
                companyId,
                userId,
                isLoggedIn,
                logout,
            }}
        >
            {children}
        </UserContext.Provider>
    );
};


// import React, { createContext, useState, useEffect, useCallback } from "react";
// import { ENDPOINTS } from "../api/constraints";

// export const UserContext = createContext();

// export const UserProvider = ({ children }) => {
//   const [users, setUsers] = useState([]);
//   const [companyId, setCompanyId] = useState(null);
//   const [userId, setUserId] = useState(null);

//   // ✅ Get token from localStorage or cookie
//   const getToken = () => {
//     const token = localStorage.getItem("token");
//     if (token) return token;

//     const match = document.cookie.match(new RegExp("(^| )token=([^;]+)"));
//     return match ? match[2] : null;
//   };

//   // ✅ Decode JWT token
//   const decodeToken = useCallback(() => {
//     const token = getToken();
//     if (!token) return null;

//     try {
//       const base64Url = token.split(".")[1];
//       const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
//       return JSON.parse(atob(base64));
//     } catch (err) {
//       console.error("Token decode error:", err);
//       return null;
//     }
//   }, []);

//   // ✅ Logout user
//   const logout = useCallback(() => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("users");
//     document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
//     setUsers([]);
//     setCompanyId(null);
//     setUserId(null);
//   }, []);

//   // ✅ Fetch and filter users by company ID
//   const fetchUsersFromAPI = useCallback(async (cid) => {
//     try {
//       const token = getToken();
//       const res = await fetch(ENDPOINTS.USER_GET, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       });

//       if (!res.ok) {
//         const errText = await res.text();
//         throw new Error(`${res.status}: ${res.statusText} - ${errText}`);
//       }

//       const data = await res.json();
//       const companyUsers = data.filter((user) => user.iCompany_id === cid);

//       setUsers(companyUsers);
//       localStorage.setItem("users", JSON.stringify(companyUsers));
//     } catch (error) {
//       console.error("User fetch error:", error);
//     }
//   }, []);

//   // ✅ Initial setup
//   useEffect(() => {
//     const payload = decodeToken();
//     if (!payload) return;

//     // Auto logout if token expired
//     if (payload.exp && payload.exp * 1000 < Date.now()) {
//       console.warn("Token expired, logging out...");
//       logout();
//       return;
//     }

//     const cid = payload.company_id || payload.iCompany_id;
//     const uid = payload.user_id || payload.iUser_id;

//     if (cid) setCompanyId(cid);
//     if (uid) setUserId(uid);

//     const stored = localStorage.getItem("users");
//     if (stored) {
//       setUsers(JSON.parse(stored));
//     } else if (cid) {
//       fetchUsersFromAPI(cid);
//     }
//   }, [decodeToken, fetchUsersFromAPI, logout]);

//   // ✅ Sync users to localStorage
//   useEffect(() => {
//     if (Array.isArray(users)) {
//       localStorage.setItem("users", JSON.stringify(users));
//     }
//   }, [users]);

//   // ✅ Logged-in status
//   const isLoggedIn = !!getToken();

//   return (
//     <UserContext.Provider
//       value={{
//         users,
//         setUsers,
//         companyId,
//         userId,
//         isLoggedIn,
//         logout,
//       }}
//     >
//       {children}
//     </UserContext.Provider>
//   );
// };
