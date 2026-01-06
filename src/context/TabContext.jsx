import { createContext, useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 

const TabContext = createContext();

export const useTabs = () => {
    return useContext(TabContext);
};

export const TabProvider = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation(); 
    const [activeTab, setActiveTab] = useState(location.pathname); 
    const [tabs, setTabs] = useState(() => {
        if (location.pathname && location.pathname !== '/') {
            return [{ path: location.pathname, label: 'Current Page' }];
        }
        return [];
    });

    const openTab = (path, label) => {
        const isTabExists = tabs.find((tab) => tab.path === path);

        if (!isTabExists) {
            setTabs((prevTabs) => [...prevTabs, { path, label }]);
        }

        if (location.pathname !== path) {
            setActiveTab(path);
            navigate(path); 
        } else if (activeTab !== path) {
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


