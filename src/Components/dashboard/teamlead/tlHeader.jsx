import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function TeamleadHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;
  const isProfile = currentPath.includes('profile') || currentPath === '/leads';
  const isTeam = currentPath.includes('team');
  const isCallLogs = currentPath.includes('/logusercalllogs');

  const [phoneActive, setPhoneActive] = useState(false);

  useEffect(() => {
    // Get the entire user data from localStorage
    const storedUserData = localStorage.getItem('user');
    if (storedUserData) {
      try {
        const parsedData = JSON.parse(storedUserData);
        const phoneAccess = parsedData?.phone_access === true;
        setPhoneActive(phoneAccess);

        // Optional: Keep it in flat localStorage for legacy use
        localStorage.setItem('phone_access', phoneAccess);
      } catch (error) {
        console.error('Error parsing user_data:', error);
      }
    } else {
      // Fallback to previous method
      const phoneAccess = localStorage.getItem('phone_access') === 'true';
      setPhoneActive(phoneAccess);
    }
  }, []);

  const handleTabClick = (tab) => {
    if (tab === 'profile') navigate('/leads');
    if (tab === 'team') navigate('/teamview');
    if (tab === 'calllogs') navigate('/logusercalllogs');
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
          Dashboard
        </button>
        <div className="w-px h-5 bg-gray-300"></div>
        <button
          onClick={() => handleTabClick('team')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            isTeam ? 'bg-black text-white' : 'text-black'
          }`}
        >
          Team Dashboard
        </button>

        {phoneActive && (
          <>
            <div className="w-px h-5 bg-gray-300"></div>
            <button
              onClick={() => handleTabClick('calllogs')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                isCallLogs ? 'bg-black text-white' : 'text-black'
              }`}
            >
              Call Logs
            </button>
          </>
        )}
      </div>
    </div>
  );
}
