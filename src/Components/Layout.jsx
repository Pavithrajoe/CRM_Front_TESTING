// Layout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './common/sidebar';

const Layout = () => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        <Outlet /> {/* Dynamic content from routes */}
      </div>
    </div>
  );
};

export default Layout;
