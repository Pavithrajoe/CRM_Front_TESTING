// TabContext.js
import { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // ← add this

const TabContext = createContext();

export const useTabs = () => {
  return useContext(TabContext);
};

export const TabProvider = ({ children }) => {
  const [tabs, setTabs] = useState([
  ]);
  const [activeTab, setActiveTab] = useState('/leads');
  const navigate = useNavigate(); 

  const openTab = (path, label) => {
    if (!tabs.find((tab) => tab.path === path)) {
      setTabs([...tabs, { path, label }]);
    }

    setActiveTab(path); // Set the newly opened tab as active
    navigate(path, { replace: path === activeTab }); // ← force re-navigation even if it's the same tab
  };

  const closeTab = (path) => {
    const updatedTabs = tabs.filter((tab) => tab.path !== path);
    setTabs(updatedTabs);
    if (activeTab === path && updatedTabs.length > 0) {
      setActiveTab(updatedTabs[updatedTabs.length - 1].path);
      navigate(updatedTabs[updatedTabs.length - 1].path);
    }
  };

  return (
    <TabContext.Provider value={{ tabs, activeTab, openTab, closeTab }}>
      {children}
    </TabContext.Provider>
  );
};
