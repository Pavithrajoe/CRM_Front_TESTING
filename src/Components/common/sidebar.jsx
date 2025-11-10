import React, { useState, useEffect, useContext } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTabs } from '../../context/TabContext';
import { Tabs, Tab, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Tooltip from '@mui/material/Tooltip';
import { ModuleContext } from "../../context/ModuleContext";

const TARGET_COMPANY_ID = Number(import.meta.env.VITE_XCODEFIX_FLOW);

const Sidebar = ({ data }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [companyId, setCompanyId] = useState(null);
  const { modules, loading, error } = useContext(ModuleContext);
  const { tabs, activeTab, openTab, closeTab } = useTabs();
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [userAccess, setUserAccess] = useState([]);
  const [userModule, setUserModule] = useState([]);

  // Map backend module names to routes and icons
  const MODULE_ROUTES = {
    Home: { route: "/leaddashboard", iconPath: "/images/nav/home.svg" },
    Lead: { route: "/leadcardview", iconPath: "/images/nav/group.svg" },
    Customer: { route: "/customers", iconPath: "/images/nav/customers.svg" },
    Calendar: { route: "/calenderpage", iconPath: "/images/nav/Calender.svg" },
    Users: { route: "/userpage", iconPath: "/images/nav/user.svg" },
    Reports: { route: "/reportpage", iconPath: "/images/nav/reports.svg" },
    Organisation: { route: "/companydashboard", iconPath: "/images/nav/org.svg" },
    Masters: { route: "/companymaster", iconPath: "/images/nav/masters.svg" },
    Settings: { route: "/settingspage/account", iconPath: "/images/nav/settings.svg" }
  };

  // Effect to load user access data and company ID
  useEffect(() => {
    // Try from props first, then from localStorage
    if (data) {
      setUserAccess(data);
    } else {
      const stored = localStorage.getItem('loginResponse');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUserAccess(parsed);
        const moduleData = parsed.user_attributes;
        setUserModule(moduleData || []);
      } else {
        console.warn("Sidebar: No login data found in localStorage or props.");
      }
    }

    // Extract company ID from token
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, '+').replace(/_/g, '/')));
        const compId = payload.company_id ? Number(payload.company_id) : null;
        setCompanyId(compId);
      } catch (error) {
        console.error("Error parsing token:", error);
        setCompanyId(null);
      }
    }
  }, [data]);

  useEffect(() => {
    if (!modules || modules.length === 0) {
      setMenuItems([]);
      return;
    }

    const allowedModuleIds = new Set(userModule.map(access => access.module_id));
    const isTargetCompany = companyId === TARGET_COMPANY_ID;

    const filteredModules = modules
      .filter(mod => allowedModuleIds.has(mod.imodule_id))
      .sort((a, b) => a.imodule_id - b.imodule_id)
      .map(mod => {
        let route = MODULE_ROUTES[mod.cmodule_name.trim()]?.route;
        let label = mod.cmodule_name.trim();

        // Apply company-specific routing for Lead module
        if (label === 'Lead' && isTargetCompany) {
          route = '/xcodefix_leadcardview';
          label = 'My Leads';
        }

        return {
          key: mod.imodule_id,
          id: mod.imodule_id,
          label: label,
          route: route,
          iconPath: MODULE_ROUTES[mod.cmodule_name.trim()]?.iconPath,
        };
      })
      .filter(item => item.route && item.iconPath);

    setMenuItems(filteredModules);
  }, [modules, userModule, companyId]);

  const toggleSidebar = () => setIsCollapsed(prev => !prev);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/', { replace: true });
  };

  return (
    <div className="flex h-screen w-full">
      <div className={`bg-white border-r flex flex-col justify-between transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="flex items-center justify-center mt-6 h-20">
          <img
            src={isCollapsed ? '/images/nav/shortinkli.png' : '/images/nav/loginkli.png'}
            alt="Logo"
            className={`transition-all duration-300 ${isCollapsed ? 'w-12' : 'w-48'} h-auto`}
          />
        </div>
        <div className="flex flex-col items-center py-4 space-y-2">
          {loading && <p className="text-gray-500 text-sm">Loading menu...</p>}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {!loading && !error && menuItems.length > 0 ? (
            menuItems.map(item => (
              <NavLink
                key={item.key}
                to={item.route}
                className={({ isActive }) => `flex items-center w-full rounded-lg px-4 py-2 transition-all duration-200 ${isActive ? 'bg-blue-100 font-semibold text-blue-600' : 'hover:bg-blue-100'}`}
                onClick={() => openTab(item.route, item.label)}
              >
                <Tooltip
                  title={isCollapsed ? item.label : ''}
                  placement="right"
                  arrow
                  componentsProps={{
                    tooltip: {
                      sx: {
                        backgroundColor: '#374151',
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        letterSpacing: '0.1em',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      }
                    },
                    arrow: { sx: { color: '#374151' } }
                  }}
                >
                  <div className="flex items-center justify-center w-8">
                    <img src={item.iconPath} alt={item.label} className="w-5 h-5 object-contain" />
                  </div>
                </Tooltip>
                {!isCollapsed && (
                  <span className="ml-3 text-sm font-medium">
                    {item.label}
                  </span>
                )}
              </NavLink>
            ))
          ) : (
            !loading && !error && <p className="text-gray-400 text-sm mt-4">No modules available.</p>
          )}
        </div>
        <div className="flex flex-col items-center py-6 space-y-4 mb-4">
          <button onClick={toggleSidebar} className="flex items-center justify-center space-x-2 px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-100 transition">
            <img src="/images/nav/collab.svg" alt="Toggle" className="w-6 h-6" />
            {!isCollapsed && <span className="text-sm font-medium">Collapse</span>}
          </button>
          <button onClick={handleLogout} className="flex items-center bg-black text-white space-x-2 px-4 py-2 hover:bg-red-600 rounded transition">
            <img src="/images/nav/logout.svg" alt="Logout" className="w-5 h-5" />
            {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Box sx={{ borderBottom: 1, borderColor: 'divider', backgroundColor: '#f9fafb', width: '100%' }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => {
              const sel = menuItems.find(m => m.route === newValue);
              navigate(newValue);
              openTab(newValue, sel?.label || 'New');
            }}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ minHeight: 48, width: '100%' }}
          >
            {tabs.map(tab => (
              <Tab
                key={tab.path}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {tab.label}
                    <IconButton size="small" onClick={e => { e.stopPropagation(); closeTab(tab.path); }} sx={{ ml: 1 }}>
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                }
                value={tab.path}
                sx={{
                  textTransform: 'none',
                  minHeight: 48,
                  minWidth: 'unset',
                  px: 2,
                  '&.Mui-selected': { color: 'primary.main', fontWeight: 'bold' },
                }}
              />
            ))}
          </Tabs>
        </Box>

        <div className="flex-1 overflow-x-hidden w-full h-full p-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;