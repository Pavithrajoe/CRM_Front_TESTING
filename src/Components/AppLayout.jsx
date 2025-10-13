import React from 'react';
import Sidebar from '../Components/common/sidebar';
import QuickCalculator from './Tools/calculator/QuickCalculator';
import { Outlet } from 'react-router-dom';

const AppLayout = () => {
  return (
    <div className="flex">
      <Sidebar />
      <QuickCalculator/>

      <div className="flex-1 h-screen overflow-x-hidden">
        <Outlet />
      </div>
    </div>
  );
};

export default AppLayout;
