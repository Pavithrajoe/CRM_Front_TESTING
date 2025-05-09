import React from 'react';
import Sidebar from './SidebarLayout';
import { Outlet } from 'react-router-dom';

const RemainderLayout = () => {
  return (
    <div className="flex">
      {/* Fixed-width Sidebar */}
      <div className="w-64 h-full bg-white shadow z-10">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex-1  bg-[#EEEEEE] overflow-hidden ">
        <div className="flex h-full">
          {/* Left Profile Section */}
          <div className="w-1/2 border-r p-4 ">
            <div className="border rounded p-4 shadow bg-white">
      
            </div>
          </div>

          {/* Right Dynamic Page Content */}
          <div className="w-full p-4">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemainderLayout;
