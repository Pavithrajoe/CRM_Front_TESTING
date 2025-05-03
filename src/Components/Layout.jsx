// Layout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './common/sidebar';
import TabManager from './TabManager';


const Layout = () => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <TabManager />
      <div className="flex-1 bg-[#EEEEEE] p-4 overflow-x-hidden overflow-y-scroll">
        <Outlet /> {/* Dynamic content from routes */}
      </div>
    </div>
  );
};

export default Layout;
