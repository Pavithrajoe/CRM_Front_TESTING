import React from 'react';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

const RemainderLayout = () => {
  return (
    <div className="flex h-100vh overflow-hidden">
      {/* Fixed-width Sidebar */}
      <div className="w-64 h-full bg-white shadow z-10">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex-1 bg-gray-50 overflow-y-10">
        <div className="flex h-full">
          {/* Left Profile Section */}
          <div className="w-1/2 border-r p-4 overflow-auto">
            <div className="border rounded p-4 shadow bg-white">
              Profile Section Placeholder
            </div>
          </div>

          {/* Right Dynamic Page Content */}
          <div className="w-full p-4 overflow-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemainderLayout;
