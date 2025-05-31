import React, { useState } from 'react';
import { useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useTabs } from '../../context/TabContext';
import { Tabs, Tab, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { tabs, activeTab, openTab, closeTab } = useTabs();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { iconPath: '/images/nav/home.png', label: 'Home', route: '/leads' },
    { iconPath: '/images/nav/group.png', label: 'Lead', route: '/leadcardview' },
    { iconPath: '/images/nav/calen.png', label: 'Calendar', route: '/calenderpage' },
  ];

  const handleTabChange = (_, newValue) => {
    if (activeTab !== newValue) {
      const menuItem = menuItems.find(item => item.route === newValue);
      openTab(newValue, menuItem?.label || 'New');
    }
  };

  const toggleSidebar = () => setIsCollapsed(prev => !prev);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('profileImage');
    navigate('/');
  };

  return (
    <div className="flex h-screen w-full bg-[#f2f2f7]">
      {/* Sidebar */}
      <div className={`transition-all duration-300 flex flex-col justify-between backdrop-blur-md bg-white/70 border-r border-gray-200 ${isCollapsed ? 'w-16' : 'w-64'} shadow-sm`}>
        {/* Logo */}
        <div className="flex items-center justify-center mt-6 h-20">
          <img
            src={isCollapsed ? '/images/nav/shortinkli.png' : '/images/nav/loginkli.png'}
            alt="Logo"
            className={`transition-all duration-300 ${isCollapsed ? 'w-10' : 'w-44'} h-auto`}
          />
        </div>

        {/* Menu */}
        <div className="flex flex-col items-center py-4 space-y-2">
          {menuItems.map(item => (
            <div
              key={item.route}
              onClick={() => openTab(item.route, item.label)}
              className={`flex items-center w-[90%] cursor-pointer rounded-xl px-4 py-2 text-gray-700 transition-all duration-200
                ${location.pathname === item.route
                  ? 'bg-blue-100 text-blue-600 font-medium'
                  : 'hover:bg-gray-200 hover:text-gray-900'}
              `}
            >
              <img src={item.iconPath} alt={item.label} className="w-5 h-5 object-contain" />
              {!isCollapsed && <span className="ml-3 text-sm">{item.label}</span>}
            </div>
          ))}
        </div>

        {/* Footer Controls */}
        <div className="flex flex-col items-center py-6 space-y-4 mb-4">
          <button
            onClick={toggleSidebar}
            className="flex items-center justify-center space-x-2 px-3 py-2 rounded-xl bg-white border border-gray-200 shadow hover:bg-gray-100 transition"
          >
            <img src="/images/nav/collab.png" alt="Toggle" className="w-5 h-5" />
            {!isCollapsed && <span className="text-sm">Collapse</span>}
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition"
          >
            <img src="/images/nav/logout.png" alt="Logout" className="w-4 h-4" />
            {!isCollapsed && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tab Bar */}
        <Box sx={{ borderBottom: 1, borderColor: '#e5e7eb', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ minHeight: 48, px: 2 }}
          >
            {tabs.map(tab => (
              <Tab
                key={tab.path}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {tab.label}
                    <IconButton
                      size="small"
                      onClick={e => { e.stopPropagation(); closeTab(tab.path); }}
                      sx={{ ml: 1 }}
                    >
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                }
                value={tab.path}
                sx={{
                  textTransform: 'none',
                  minHeight: 48,
                  px: 2,
                  fontWeight: 500,
                  '&.Mui-selected': {
                    color: '#0a84ff',
                    backgroundColor: '#e0f0ff',
                    borderRadius: 2,
                  }
                }}
              />
            ))}
          </Tabs>
        </Box>

        {/* Content */}
        <div className="flex-1 overflow-y-scroll p-4 bg-[#f2f2f7]">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
