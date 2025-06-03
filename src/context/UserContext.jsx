// src/context/UserContext.js
import React, { createContext, useState, useEffect } from 'react';

// 1. Create the context
export const UserContext = createContext();

// 2. Provider Component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Load user from localStorage on initial mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Update localStorage whenever user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user'); // optional cleanup
    }
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};
