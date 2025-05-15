import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LeadForm from '../LeadForm';
import logo from './favicon.png';

export default function ProfileHeader() {
  const [profile, setProfile] = useState({});
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [userRole, setUserRole] = useState('');
  const navigate = useNavigate();

  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setProfile({
          name: parsedUser?.cFull_name || 'User',
          email: parsedUser?.email || 'Not available',
          team: parsedUser?.team || 'N/A'
        });
        setUserRole(parsedUser?.irole_id || 'N/A');
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
      }
    }
  }, []);

  const fetchNotifications = async () => {
    const res = await fetch(`/api/notifications/${userId}`);
    const data = await res.json();
    setNotifications(data);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/', { replace: true });
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) fetchNotifications();
  };

  const markAsRead = async (notifId) => {
    await fetch(`/api/notifications/${userId}/${notifId}`, {
      method: 'PUT'
    });
    fetchNotifications();
  };

  const handleLeadFormOpen = () => {
    setShowLeadForm(true);
    document.body.style.overflow = 'hidden';
  };

  const handleLeadFormClose = () => {
    setShowLeadForm(false);
    document.body.style.overflow = 'auto';
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex justify-end items-center gap-10 mb-6 relative">
      <button
        onClick={handleLeadFormOpen}
        className="relative inline-flex items-center gap-2 px-5 py-2 rounded-full text-blue-600 font-semibold bg-white border border-black bg-clip-padding focus:outline-none"
      >
        + Create Lead
      </button>

      {showLeadForm && (
        <div className="fixed inset-0 z-50 bg-white bg-opacity-50 flex justify-end items-start">
          <div className="bg-white p-6 rounded-xl shadow-lg w-3/2 max-h-[90vh] overflow-y-auto transition-all duration-300 ease-in-out slide-in-right">
            <LeadForm onClose={handleLeadFormClose} />
          </div>
        </div>
      )}

      <div className="relative" ref={notificationRef}>
        <Bell
          onClick={toggleNotifications}
          className="w-10 h-10 border rounded-full p-2 text-blue-600 cursor-pointer"
        />
        {showNotifications && (
          <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white shadow-lg rounded-lg p-4 text-sm z-50">
            <div className="font-semibold mb-2">Notifications</div>
            <ul>
              {notifications.length === 0 ? (
                <li className="text-gray-400">No notifications</li>
              ) : (
                notifications.map((note) => (
                  <li
                    key={note.id}
                    onClick={() => markAsRead(note.id)}
                    className={`mb-2 p-2 rounded hover:bg-gray-100 cursor-pointer ${
                      note.read ? 'text-gray-400' : 'text-black'
                    }`}
                  >
                    {note.message}
                    <div className="text-xs text-gray-500">
                      {new Date(note.timestamp).toLocaleString()}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>

      <div className="relative" ref={dropdownRef}>
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <label htmlFor="profile-upload">
            <img
              src={logo}
              alt="avatar"
              className="w-10 h-10 rounded-full object-cover border-2 border-gray-300 hover:opacity-80 transition"
            />
          </label>
          <input
            type="file"
            accept="image/*"
            id="profile-upload"
            onChange={() => {}} 
            className="hidden"
          />
          <div className="text-sm leading-tight">
            <div className="font-semibold">{profile.name}</div>
            <div className="text-gray-500 text-xs">{profile.email}</div>
          </div>
          <div className="text-xl">▾</div>
        </div>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg p-4 text-sm z-50">
            <div className="font-bold text-gray-800">{profile.name}</div>
            <div className="text-gray-500">Role: {userRole}</div>
            <hr className="my-2" />
            <button
              onClick={handleLogout}
              className="w-full text-left text-red-500 hover:text-red-600"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}