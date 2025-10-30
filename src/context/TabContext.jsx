import { createContext, useContext, useState } from 'react';
// 💡 IMPORTANT: Import useLocation to read the URL path
import { useNavigate, useLocation } from 'react-router-dom'; 

const TabContext = createContext();

export const useTabs = () => {
    return useContext(TabContext);
};

export const TabProvider = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation(); // 💡 Get the current URL pathname

    // 💡 FIX: Initialize activeTab using the current location.pathname 
    // This prevents the context from immediately changing state from '/leads' to the current path.
    const [activeTab, setActiveTab] = useState(location.pathname); 

    // Initialize tabs array. It's often safer to start with the current page if it's not the root.
    const [tabs, setTabs] = useState(() => {
        if (location.pathname && location.pathname !== '/') {
            // but this prevents a crash if a user starts on a deep link.
            return [{ path: location.pathname, label: 'Current Page' }];
        }
        return [];
    });

    const openTab = (path, label) => {
        const isTabExists = tabs.find((tab) => tab.path === path);

        if (!isTabExists) {
            setTabs((prevTabs) => [...prevTabs, { path, label }]);
        }

        // 1. Only navigate if the path is actually different from the current URL
        if (location.pathname !== path) {
            setActiveTab(path);
            // We remove 'replace: path === activeTab' to avoid potential infinite loops 
            // and rely on React Router's standard behavior.
            navigate(path); 
        } else if (activeTab !== path) {
            // 2. Update activeTab state if the router has already navigated 
            // (e.g., from a URL change outside of the app)
            setActiveTab(path);
        }
    };

    const closeTab = (path) => {
        const updatedTabs = tabs.filter((tab) => tab.path !== path);
        setTabs(updatedTabs);
        
        if (activeTab === path && updatedTabs.length > 0) {
            const nextPath = updatedTabs[updatedTabs.length - 1].path;
            setActiveTab(nextPath);
            navigate(nextPath);
        }
    };

    return (
        <TabContext.Provider value={{ tabs, activeTab, openTab, closeTab }}>
            {children}
        </TabContext.Provider>
    );
};



// // TabContext.js
// import { createContext, useContext, useState } from 'react';
// import { useNavigate } from 'react-router-dom'; // ← add this

// const TabContext = createContext();

// export const useTabs = () => {
//   return useContext(TabContext);
// };

// export const TabProvider = ({ children }) => {
//   const [tabs, setTabs] = useState([
//   ]);
//   const [activeTab, setActiveTab] = useState('/leads');
//   const navigate = useNavigate(); 

//   const openTab = (path, label) => {
//     if (!tabs.find((tab) => tab.path === path)) {
//       setTabs([...tabs, { path, label }]);
//     }

//     setActiveTab(path); // Set the newly opened tab as active
//     navigate(path, { replace: path === activeTab }); // ← force re-navigation even if it's the same tab
//   };

//   const closeTab = (path) => {
//     const updatedTabs = tabs.filter((tab) => tab.path !== path);
//     setTabs(updatedTabs);
//     if (activeTab === path && updatedTabs.length > 0) {
//       setActiveTab(updatedTabs[updatedTabs.length - 1].path);
//       navigate(updatedTabs[updatedTabs.length - 1].path);
//     }
//   };

//   return (
//     <TabContext.Provider value={{ tabs, activeTab, openTab, closeTab }}>
//       {children}
//     </TabContext.Provider>
//   );
// };
