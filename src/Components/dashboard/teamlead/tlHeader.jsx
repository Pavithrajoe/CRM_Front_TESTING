import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function teamleadHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;
  const isProfile = currentPath.includes('profile');
  const isTeam = currentPath.includes('team');

  const handleTabClick = (tab) => {
    if (tab === 'profile') navigate('/dashboard/profile');
    if (tab === 'team') navigate('/dashboard/team');
  };

  return (
    <div className="flex gap-4 items-center bg-white rounded-lg px-4 py-2">
      <button
        onClick={() => handleTabClick('profile')}
        className={`px-4 py-2 rounded-md text-sm font-medium ${
          isProfile ? 'bg-black text-white' : 'text-black'
        }`}
      >
        My Profile
      </button>
      <div className="w-px h-5 bg-gray-300"></div>
      <button
        onClick={() => handleTabClick('team')}
        className={`px-4 py-2 rounded-md text-sm font-medium ${
          isTeam ? 'bg-black text-white' : 'text-black'
        }`}
      >
        Team
      </button>
    </div>
  );
}
