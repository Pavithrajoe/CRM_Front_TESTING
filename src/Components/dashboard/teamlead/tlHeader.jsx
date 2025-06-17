import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function TeamleadHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;
  const isProfile = currentPath.includes('profile') || currentPath === '/leads';
  const isTeam = currentPath.includes('team');

  const [userName, setUserName] = useState('User');

 
  const handleTabClick = (tab) => {
    if (tab === 'profile') navigate('/leads');
    if (tab === 'team') navigate('/teamview');
  };

  return (
    <div className="flex flex-col gap-2 bg-white rounded-lg px-4 py-2">
      
      <div className="flex gap-4 items-center">
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
          Team Profile
        </button>
      </div>
    </div>
  );
}