import { useEffect, useState } from 'react';
import { Bell, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import LeadForm from '@/components/LeadForm';  // Import the LeadForm component

export default function ProfileHeader() {
  const [image, setImage] = useState(null);
  const [profile, setProfile] = useState({});
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showLeadForm, setShowLeadForm] = useState(false); // State for Lead Form modal visibility
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId'); // or from context/redux

  // Fetch profile by userId
  useEffect(() => {
    fetch(`/api/profile/${userId}`)
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setImage(data.image);
      });
  }, [userId]);

  // Fetch notifications by userId
  const fetchNotifications = async () => {
    const res = await fetch(`/api/notifications/${userId}`);
    const data = await res.json();
    setNotifications(data);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      setImage(base64);
      await fetch(`/api/profile/${userId}/image`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 })
      });
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
  // When you want to log out or clear the token:
    localStorage.removeItem('token');
    console.log('Token removed from localStorage');
    localStorage.removeItem('profileImage');
    navigate('/'); 
    localStorage.clear(); // Clear session if needed
    navigate('/login_dev');
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) fetchNotifications();
  };

  const markAsRead = async (notifId) => {
    await fetch(`/api/notifications/${userId}/${notifId}`, {
      method: 'PUT'
    });
    fetchNotifications(); // Refresh after marking
  };

  // Handle LeadForm slide-in
  const handleLeadFormOpen = () => {
    setShowLeadForm(true);
    document.body.style.overflow = 'hidden'; // Disable body scroll when form is open
  };

  const handleLeadFormClose = () => {
    setShowLeadForm(false);
    document.body.style.overflow = 'auto'; // Enable body scroll when form is closed
  };

  return (
    <div className="flex justify-end items-center gap-10 mb-6 relative">
      <button
        className="w-10 h-10 border rounded-full p-2 hover:bg-gray-100"
        onClick={handleLeadFormOpen} // Open Lead Form on click
      >
        <Plus className="text-blue-600" />
      </button>

      {/* Lead Form Modal with Slide-in effect */}
      {showLeadForm && (
        <div className="fixed inset-0 z-50 bg-white bg-opacity-50 flex justify-end items-start"> {/* Ensure it doesn't cover other elements */}
          <div className="bg-white p-6 rounded-xl shadow-lg w-3/2 max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-in-out slide-in-right">
            <h2 className="text-xl font-bold mb-4">Create New Lead</h2>
            
            {/* Call the LeadForm component */}
            <LeadForm onClose={handleLeadFormClose} />

            {/* You can add a Save button here if needed */}
          </div>
        </div>
      )}

      <div className="relative">
        <Bell
          onClick={toggleNotifications}
          className="w-10 h-10 border rounded-full p-2 text-blue-600 cursor-pointer"
        />
        {showNotifications && (
          <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-hidden bg-white shadow-lg rounded-lg p-4 text-sm z-50">
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

      <div className="relative">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <label htmlFor="profile-upload">
            <img
              src={image || 'https://i.pravatar.cc/40'}
              alt="avatar"
              className="w-10 h-10 rounded-full object-cover border-2 border-gray-300 hover:opacity-80 transition"
            />
          </label>
          <input
            type="file"
            accept="image/*"
            id="profile-upload"
            onChange={handleImageChange}
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
            <div className="text-gray-500">Department: {profile.department}</div>
            <div className="text-gray-500">Team: {profile.team}</div>
            <hr className="my-2" />
            <Link to={`/profile-settings/${userId}`} className="block text-blue-600 hover:underline mb-2">
              Profile Settings
            </Link>
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
