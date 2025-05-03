import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const handleLogout = () => {
    // Clear storage or any other logout logic
    navigate('/'); // Redirect to login or home
  };

  const menuItems = [
    { iconPath: '/images/nav/home.png', label: 'Home', route: '/' },
    { iconPath: '/images/nav/group.png', label: 'Lead', route: '/lead' },
    { iconPath: '/images/nav/calen.png', label: 'Calendar', route: '/calendar' },
    { iconPath: '/images/nav/call.png', label: 'Contact', route: '/contact' },
    { iconPath: '/images/nav/email.png', label: 'Email', route: '/email' },
    { iconPath: '/images/nav/task.png', label: 'Task', route: '/task' },
    { iconPath: '/images/nav/deal.png', label: 'Deal', route: '/deal' },
    { iconPath: '/images/nav/org.png', label: 'Organisation', route: '/organisation' },
    { iconPath: '/images/nav/notes.png', label: 'Notes', route: '/notes' },
  ];

  return (
    <div className={`h-screen flex flex-col justify-between border-r bg-white transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>

      {/* Top Logo */}
      <div className="flex items-center justify-center mt-10 h-20">
        {/* Logo only displayed when not collapsed */}
        {!isCollapsed && (
          <img
            src='/images/nav/loginkli.png'
            alt="Logo"
            className={`transition-all duration-300 ${isCollapsed ? 'w-15 h-15' : 'w-48 h-15'}`}
          />
        )}
        {/* Small logo only displayed when collapsed */}
        {isCollapsed && (
          <img
            src='/images/nav/shortinkli.png'
            alt="Logo"
            className="transition-all duration-300 w-17 h-10"
          />
        )}
      </div>

      {/* Menu */}
      <div className="flex flex-col items-center py-4 space-y-2">
        {menuItems.map((item, idx) => (
          <div
            key={idx}
            onClick={() => navigate(item.route)}
            className={`flex items-center w-full cursor-pointer hover:bg-blue-100 rounded-lg px-4 py-2 transition-all duration-200 text-gray-700 ${
              location.pathname === item.route ? 'bg-blue-100 font-semibold text-blue-600' : ''
            }`}
          >
            {/* Display the icon */}
            <div className="flex items-center justify-center w-8">
              <img src={item.iconPath} alt={item.label} className="w-5 h-5 object-contain" />
            </div>

            {/* Only display label when the sidebar is expanded */}
            {!isCollapsed && (
              <span className="ml-3 text-sm font-medium">{item.label}</span>
            )}
          </div>
        ))}
      </div>

      {/* Collapse + Logout */}
      <div className="flex flex-col items-center space-y-6 py-6 mb-4">
      <button
  onClick={toggleSidebar}
  className="flex items-center justify-center space-x-2 px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-100 transition"
>
  <img
    src="/images/nav/collab.png"
    alt="Toggle"
    className="w-6 h-6"
  />
  {!isCollapsed && (
    <span className="text-sm font-medium">Collapse</span>
  )}
</button>

        <button
          onClick={handleLogout}
          className="flex items-center bg-black space-x-4 px-4 py-2 hover:bg-green-900 rounded transition"
        >
          <img
            src="/images/nav/logout.png"
            alt="Logout"
            className="w-5 h-5"
          />
          // tested

<img
            src="/images/nav/logout.png"
            alt="Logout"
            className="w-5 h-5"
          />
          {!isCollapsed && (
            <span className="ml-2 text-sm text-white font-medium">Logout</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
