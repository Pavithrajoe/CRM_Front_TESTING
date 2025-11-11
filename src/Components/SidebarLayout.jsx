// SidebarLayout.jsx
import Sidebar from '@/Components/common/sidebar'
import { Outlet } from 'react-router-dom';

const SidebarLayout = () => {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-4 bg-[#EEEEEE] min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default SidebarLayout;
