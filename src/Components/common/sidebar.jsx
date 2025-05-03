import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTabs } from '../../context/TabContext';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { openTab } = useTabs();
  const location = useLocation();

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const handleLogout = () => {
    // Add your logout logic here (e.g., clear storage, API call)
    window.location.href = '/'; // Redirect to login/home page
  };

  const menuItems = [
    { iconPath: '/images/nav/home.png', label: 'Home', route: '/LeadDashboard' },
    { iconPath: '/images/nav/group.png', label: 'Lead', route: '/command' },
    { iconPath: '/images/nav/calen.png', label: 'Calendar', route: '/calenderpage' },
    { iconPath: '/images/nav/call.png', label: 'Contact', route: '/reminderHistory' },
    { iconPath: '/images/nav/email.png', label: 'Email', route: '/email' },
    { iconPath: '/images/nav/task.png', label: 'Task', route: '/reminderPage' },
    { iconPath: '/images/nav/deal.png', label: 'Deal', route: '/deal' },
    { iconPath: '/images/nav/org.png', label: 'Organisation', route: '/organisation' },
    { iconPath: '/images/nav/notes.png', label: 'Notes', route: '/notes' },
  ];

  return (
    <div className={`h-screen bg-white border-r flex flex-col justify-between transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      
      {/* Logo Section */}
      <div className="flex items-center justify-center mt-6 h-20">
        <img
          src={isCollapsed ? '/images/nav/shortinkli.png' : '/images/nav/loginkli.png'}
          alt="Logo"
          className={`transition-all duration-300 ${isCollapsed ? 'w-10' : 'w-40'} h-auto`}
        />
      </div>

      {/* Menu Section */}
      <div className="flex flex-col items-center py-4 space-y-2">
        {menuItems.map((item) => (
          <div
            key={item.route}
            onClick={() => openTab(item.route, item.label)}
            className={`flex items-center w-full cursor-pointer hover:bg-blue-100 rounded-lg px-4 py-2 transition-all duration-200 text-gray-700 ${
              location.pathname === item.route ? 'bg-blue-100 font-semibold text-blue-600' : ''
            }`}
          >
            <div className="flex items-center justify-center w-8">
              <img src={item.iconPath} alt={item.label} className="w-5 h-5 object-contain" />
            </div>
            {!isCollapsed && (
              <span className="ml-3 text-sm font-medium">{item.label}</span>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Actions: Collapse + Logout */}
      <div className="flex flex-col items-center py-6 space-y-4 mb-4">
        
        {/* Collapse Button */}
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center space-x-2 px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-100 transition"
        >
          <img src="/images/nav/collab.png" alt="Toggle" className="w-6 h-6" />
          {!isCollapsed && (
            <span className="text-sm font-medium">Collapse</span>
          )}
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center bg-black text-white space-x-2 px-4 py-2 hover:bg-green-900 rounded transition"
        >
          <img src="/images/nav/logout.png" alt="Logout" className="w-5 h-5" />
          {!isCollapsed && (
            <span className="text-sm font-medium">Logout</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
