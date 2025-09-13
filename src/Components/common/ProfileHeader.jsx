
import { useEffect, useRef, useState, useCallback } from 'react';
import { Bell, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LeadForm from '../LeadForm';
import LeadFormB2C from '../LeadFormB2C';
import axios from 'axios';
import { ENDPOINTS } from '../../api/constraints';

const LAST_SEEN_TS_KEY = 'notifications_today_last_seen_at';
const POLLING_INTERVAL_MS = 60000;

const ProfileHeader = () => {
  // Profile state
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    role: '',
    company_name: '',
    roleType: '',
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [displayedNotifications, setDisplayedNotifications] = useState([]);
  const [bellNotificationCount, setBellNotificationCount] = useState(0);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadFormType, setLeadFormType] = useState(null);
  const [showAppMenu, setShowAppMenu] = useState(false);

  const hasPushedNotification = useRef(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const appMenuRef = useRef(null);

  // Load profile and company on mount
  useEffect(() => {
    const userString = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!userString || !token) return;
    try {
      const userObject = JSON.parse(userString);
      setProfile({
        name: userObject.cFull_name || '',
        email: userObject.cEmail || '',
        role: userObject.cRole_name || userObject.irole_id || '-',
        company_name: userObject.company_name || userObject.company?.cCompany_name || '-',
        roleType: userObject.roleType || '-',
      });
      const companyId = userObject.iCompany_id;
      if (!companyId) return;
      axios.get(`${ENDPOINTS.BASE_URL_IS}/company/${companyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(res => {
        const data = res.data?.result;
        setLeadFormType(data && data.ibusiness_type ? Number(data.ibusiness_type) : null);
      }).catch(() => setLeadFormType(null));
    } catch {
      setProfile({ name: '', email: '', role: '', company_name: '' });
      setLeadFormType(null);
    }
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [navigate]);

  useEffect(() => {
    const handler = (e) => {
      const userObj = JSON.parse(localStorage.getItem("user") || "{}");
      setLeadFormType(userObj.ibusiness_type);    
      setProfile(prev => ({ ...prev, company_name: userObj.company_name }));
    };
    window.addEventListener("leadFormTypeChanged", handler);
    return () => window.removeEventListener("leadFormTypeChanged", handler);
  }, []);

  // Local "isToday" function for ISO date (UTC-safe)
  const isToday = useCallback((dateString) => {
    if (!dateString) return false;
    const todayLocal = new Date();
    return dateString.slice(0, 10) === todayLocal.toISOString().slice(0, 10);
  }, []);

  // Fetch unread today notifications
  const fetchUnreadTodayNotifications = useCallback(async () => {
    const userString = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!userString || !token) {
      setDisplayedNotifications([]);
      setBellNotificationCount(0);
      return;
    }
    let currentUserId = null;
    try {
      const userObject = JSON.parse(userString);
      currentUserId = userObject.iUser_id;
    } catch {}
    if (!currentUserId) return;
    try {
      const res = await axios.get(`${ENDPOINTS.BASE_URL_IS}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = Array.isArray(res.data.data) ? res.data.data : [];
      const todaysNotifications = data.filter(n =>
        String(n.user_id) === String(currentUserId) &&
        isToday(n.created_at) &&
        n.read === false
      );
      setDisplayedNotifications(todaysNotifications);
      const lastSeen = localStorage.getItem(LAST_SEEN_TS_KEY);
      const newBellCount = lastSeen
        ? todaysNotifications.filter(n => new Date(n.created_at) > new Date(lastSeen)).length
        : todaysNotifications.length;
      if (!showNotifications) setBellNotificationCount(newBellCount);
      else setBellNotificationCount(0);
      if (!showNotifications && newBellCount > 0 && Notification.permission === 'granted' && !hasPushedNotification.current && todaysNotifications[0]) {
        const latest = todaysNotifications[0];
        const notif = new Notification('🔔 New Notification', {
          body: latest.message || latest.title || 'You have a new update',
          icon: `${window.location.origin}/favicon.png`,
        });
        notif.onclick = () => window.focus();
        hasPushedNotification.current = true;
        setTimeout(() => { hasPushedNotification.current = false; }, 10000);
      }
    } catch {
      setDisplayedNotifications([]);
      setBellNotificationCount(0);
    }
  }, [isToday, showNotifications]);

  // Poll every interval
  useEffect(() => {
    fetchUnreadTodayNotifications();
    const intervalId = setInterval(fetchUnreadTodayNotifications, POLLING_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [fetchUnreadTodayNotifications]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowDropdown(false);
      if (notificationRef.current && !notificationRef.current.contains(event.target)) setShowNotifications(false);
      if (appMenuRef.current && !appMenuRef.current.contains(event.target)) setShowAppMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLeadFormOpen = () => {
    if (leadFormType === 1 || leadFormType === 2) setShowLeadForm(true);
  };
  const handleLeadFormClose = () => setShowLeadForm(false);

  // New function: Mark all notifications as read frontend call
  const markAllNotificationsRead = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axios.post(`${ENDPOINTS.BASE_URL_IS}/notifications/mark-all-read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setBellNotificationCount(0);
        setDisplayedNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

const toggleNotificationsPanel = () => {
  setShowNotifications(prev => {
    const willOpen = !prev;
    if (willOpen) {
      // fetch notifications, show latest to user FIRST
      fetchUnreadTodayNotifications().then(() => {
        markAllNotificationsRead(); // mark as read in backend
        localStorage.setItem(LAST_SEEN_TS_KEY, new Date().toISOString());
        setBellNotificationCount(0);
      });
    } else {
      fetchUnreadTodayNotifications(); // refresh when closing
    }
    return willOpen;
  });
};


  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem(LAST_SEEN_TS_KEY);
    setBellNotificationCount(0);
    setDisplayedNotifications([]);
    navigate('/');
  };

  const handleGeneratePoster = () => {
    navigate('/generate-poster');
  };

  const viewAllNotifications = () => {
    setShowNotifications(false);
    navigate('/notifications');
  };

  return (
    <div className="flex justify-end items-center gap-4 mb-6 relative f">
      {showLeadForm && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-30 flex justify-center items-center">
          <div className="bg-white p-6 rounded-3xl shadow-2xl w-11/12 md:w-3/4 max-h-[80vh] overflow-y-auto transition-all duration-300">
            {leadFormType === 1 && <LeadForm onClose={() => setShowLeadForm(false)} />}
            {leadFormType === 2 && <LeadFormB2C onClose={() => setShowLeadForm(false)} />}
          </div>
        </div>
      )}

      <button
        onClick={handleLeadFormOpen}
        className={`px-5 py-2 rounded-full text-white font-medium 
          bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 
          border border-blue-300 shadow-lg 
          hover:from-blue-600 hover:to-blue-800 
          transition duration-300
          ${!(leadFormType === 1 || leadFormType === 2) ? 'opacity-50 cursor-not-allowed' : 'animate-pulse'}`}
        disabled={!(leadFormType === 1 || leadFormType === 2)}
      >
        + Create Lead
      </button>

      {/* Notification Bell */}
      <div className="relative" ref={notificationRef}>
        <Bell
          onClick={toggleNotificationsPanel}
          className="w-10 h-10 border border-grey-600 rounded-full p-2 text-blue-600 cursor-pointer bg-white shadow-md hover:bg-blue-50 transition"
        />
        {bellNotificationCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow-lg">
            {bellNotificationCount}
          </span>
        )}
        {showNotifications && (
          <div className="absolute right-0 mt-2 w-80 max-h-60 overflow-y-auto bg-white border border-blue-200 rounded-xl shadow-lg p-3 z-50">
            <div className="flex justify-between items-center mb-2">
              <div className="font-semibold text-blue-800">Notifications</div>
              <X onClick={() => setShowNotifications(false)} className="cursor-pointer text-blue-500 hover:text-blue-700" />
            </div>
            {displayedNotifications.length === 0 ? (
              <div className="text-blue-400 text-sm">No new notifications.</div>
            ) : (
              <ul className="space-y-3 mb-2">
                {displayedNotifications.map(note => (
                  <li
                    key={note.id || note.iNotification_id}
                    className="p-4 border border-blue-100 rounded-lg shadow-sm bg-blue-50 hover:bg-blue-100 transition"
                  >
                    <span className="text-sm">
                      <strong className="text-blue-700">{note.entity_type || note.type}</strong>
                      <br />
                      {note.title || "New Notification"}
                    </span>
                    <p className="font-bold">Message:</p>
                    <span className="text-sm font">
                      {note.message || "New Notification"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={viewAllNotifications}
              className="w-full mt-2 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold"
            >
              View All
            </button>
          </div>
        )}
      </div>

      {/* Profile Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold">
            {profile.name
              ? profile.name
                  .split(' ')
                  .map(n => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
              : 'UU'}
          </div>
        </div>
        {showDropdown && (
          <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 text-sm z-50 transition-all duration-300">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-semibold text-gray-900">{profile.name}</div>
                <div className="text-gray-500">{profile.email}</div>
                <div className="text-gray-500">Role: {profile.role}</div>
                <div className="text-gray-500">System Role: {profile.roleType}</div>
                {profile.company_name && (
                  <div className="text-gray-500">Company: {profile.company_name}</div>
                )}
              </div>
              <X
                className="w-5 h-5 cursor-pointer text-gray-400 hover:text-gray-600"
                onClick={() => setShowDropdown(false)}
              />
            </div>

            <button
              onClick={handleGeneratePoster}
              className="w-full text-center mb-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold py-2 rounded-xl transition duration-300 animate-pulse"
            >
              Generate Your Poster
            </button>

            <button
              onClick={handleLogout}
              className="w-full text-center bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-xl transition"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;