import React, { createContext, useState, useEffect, useCallback, useMemo } from "react"; 
import { ENDPOINTS } from "../api/constraints";

export const UserContext = createContext();

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
    const initialPayload = useMemo(() => decodeToken(), []);
    const initialCompanyId = initialPayload?.company_id || initialPayload?.iCompany_id || null;
    const initialUserId = initialPayload?.user_id || initialPayload?.iUser_id || null;
    const initialUsers = initialCompanyId && localStorage.getItem("users") 
                        ? JSON.parse(localStorage.getItem("users")) 
                        : [];

    const [users, setUsers] = useState(initialUsers);
    const [companyId, setCompanyId] = useState(initialCompanyId);
    const [userId, setUserId] = useState(initialUserId);
    
    const logout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("users");
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        setUsers([]);
        setCompanyId(null);
        setUserId(null);
    }, []);

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

            setUsers(companyUsers);
        } catch (error) {
            console.error("User fetch error:", error);
        }
    }, []);

    useEffect(() => {
        if (companyId && users.length === 0) {
            fetchUsersFromAPI(companyId);
        }
    }, [companyId, fetchUsersFromAPI, users.length]); 

    useEffect(() => {
        if (Array.isArray(users) && users.length > 0) {
            localStorage.setItem("users", JSON.stringify(users));
        }
    }, [users]);

    const isLoggedIn = !!getToken(); 

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

