import React, { useState } from 'react';
import {
  FaUserFriends, FaHandshake, FaAddressBook, FaBuilding, FaStickyNote,
  FaTasks, FaEnvelopeOpenText, FaHome, FaExchangeAlt, FaFileAlt
} from 'react-icons/fa';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const menuItems = [
    { icon: <FaUserFriends />, label: 'Lead' },
    { icon: <FaHandshake />, label: 'Deals' },
    { icon: <FaAddressBook />, label: 'Contacts' },
    { icon: <FaBuilding />, label: 'Organization' },
    { icon: <FaStickyNote />, label: 'Notes' },
    { icon: <FaTasks />, label: 'Tasks' },
    { icon: <FaEnvelopeOpenText />, label: 'E-mail Templates' }
  ];

  return (
    <div className={`h-screen bg-white border-r transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Logo Section */}
      <div className="flex items-center justify-center h-16 border-b">
        {/* Logo space - fill with your image */}
        <img
          src="/path/to/logo.png"
          alt="Logo"
          className={`transition-all duration-300 ${isCollapsed ? 'w-8 h-8' : 'w-32 h-10'}`}
        />
      </div>

      {/* Menu Items */}
      <div className="flex flex-col items-center py-4 space-y-2">
        {menuItems.map((item, idx) => (
          <div
            key={idx}
            className={`flex items-center w-full cursor-pointer hover:bg-blue-100 rounded-lg px-4 py-2 transition-all duration-200 ${
              item.label === 'Lead' ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center text-xl w-8">
              {item.icon}
            </div>
            {!isCollapsed && (
              <span className="ml-3 text-sm font-medium">{item.label}</span>
            )}
          </div>
        ))}
      </div>

      {/* Toggle Button */}
      <div className="absolute bottom-4 left-0 w-full flex justify-center">
        <button
          onClick={toggleSidebar}
          className="bg-black text-white p-2 rounded-md hover:bg-gray-800 transition"
        >
          {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
