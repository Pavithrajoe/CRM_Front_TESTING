import { useEffect, useRef, useState, useCallback } from 'react';
import { Bell, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LeadForm from '../LeadForm';
import LeadFormB2C from '../LeadFormB2C'; 
import axios from 'axios';
import { ENDPOINTS } from '../../api/constraints';

const LAST_UNREAD_COUNT_KEY = 'lastUnreadCountForBell';
const POLLING_INTERVAL_MS = 30000;

const ProfileHeader = () => {
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
  const [leadFormType, setLeadFormType] = useState(null); // 1, 2 or null
  const [showAppMenu, setShowAppMenu] = useState(false);

  const lastAcknowledgedUnreadCount = useRef(0);
  const hasPushedNotification = useRef(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const appMenuRef = useRef(null);

  // Fetch profile and company info
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
      })
      .then(res => {
        const data = res.data?.result;
        if (data && data.ibusiness_type) {
          setLeadFormType(Number(data.ibusiness_type)); // 1 or 2
        } else {
          setLeadFormType(null); // hide lead form if type is missing
        }
      })
      .catch(err => {
        console.error("Error fetching company type:", err);
        setLeadFormType(null);
      });

    } catch (e) {
      setProfile({ name: '', email: '', role: '', company_name: '' });
      setLeadFormType(null);
    }

    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

  }, [navigate]);


   // Automatically refresh lead forms when the Company Lead Form Type is updated in Account Settings
  useEffect(() => {
    const handler = (e) => setLeadFormType(e.detail); 
    window.addEventListener("leadFormTypeChanged", handler);

    return () => {
      window.removeEventListener("leadFormTypeChanged", handler);
    };
  }, []);


  const isToday = useCallback((dateString) => {
    if (!dateString) return false;
    const today = new Date();
    const notificationDate = new Date(dateString);
    return (
      notificationDate.getDate() === today.getDate() &&
      notificationDate.getMonth() === today.getMonth() &&
      notificationDate.getFullYear() === today.getFullYear()
    );
  }, []);

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
  } catch (e) {
    console.error(e);
  }

  if (!currentUserId) return;

  try {
    const res = await axios.get(`${ENDPOINTS.BASE_URL_IS}/notifications/user/${currentUserId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Check if response has the expected structure
    if (res.data && res.data.success && Array.isArray(res.data.data)) {
      const notifications = res.data.data;
      
      const unreadTodayNotifications = notifications
        .filter(n => String(n.user_id) === String(currentUserId) && isToday(n.created_at) && !n.read)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setDisplayedNotifications(unreadTodayNotifications);

      const currentUnreadTotal = unreadTodayNotifications.length;
      const newNotifications = currentUnreadTotal - lastAcknowledgedUnreadCount.current;

      if (!showNotifications && newNotifications > 0) {
        setBellNotificationCount(Math.max(0, newNotifications));

        if (Notification.permission === 'granted' && !hasPushedNotification.current && unreadTodayNotifications[0]) {
          const latest = unreadTodayNotifications[0];
          const notif = new Notification('🔔 New Notification', {
            body: latest.message || latest.title || 'You have a new update',
            icon: `${window.location.origin}/favicon.png`,
          });
          notif.onclick = () => window.focus();
          hasPushedNotification.current = true;
          setTimeout(() => { hasPushedNotification.current = false; }, 10000);
        }
      }
    } else {
      console.error('Unexpected API response structure:', res.data);
      setDisplayedNotifications([]);
      setBellNotificationCount(0);
    }

  } catch (err) {
    console.error('Error fetching notifications:', err);
    setDisplayedNotifications([]);
    setBellNotificationCount(0);
  }
}, [isToday, showNotifications]);

  useEffect(() => {
    fetchUnreadTodayNotifications();
    const intervalId = setInterval(fetchUnreadTodayNotifications, POLLING_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [fetchUnreadTodayNotifications]);

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
    if (leadFormType === 1 || leadFormType === 2) {
      setShowLeadForm(true);
    }
  };
  const handleLeadFormClose = () => setShowLeadForm(false);

  const toggleNotificationsPanel = () => {
    setShowNotifications(prev => {
      if (!prev) {
        lastAcknowledgedUnreadCount.current = displayedNotifications.length;
        localStorage.setItem(LAST_UNREAD_COUNT_KEY, String(displayedNotifications.length));
        setBellNotificationCount(0);
      } else {
        fetchUnreadTodayNotifications();
      }
      return !prev;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setBellNotificationCount(0);
    setDisplayedNotifications([]);
    navigate('/');
  };

  const viewAllNotifications = () => {
    setShowNotifications(false);
    navigate('/notifications');
  };

  return (
    <div className="flex justify-end items-center gap-4 mb-6 relative font-[San Francisco, -apple-system, BlinkMacSystemFont]">
      {showLeadForm && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-30 backdrop-blur-sm flex justify-center items-center">
          <div className="bg-white p-6 rounded-3xl shadow-2xl w-11/12 md:w-3/4 max-h-[80vh] overflow-y-auto transition-all duration-300">
            {leadFormType === 1 && <LeadForm onClose={handleLeadFormClose} />}
            {leadFormType === 2 && <LeadFormB2C onClose={handleLeadFormClose} />}
          </div>
        </div>
      )}

      <button
        onClick={handleLeadFormOpen}
        className={`px-5 py-2 rounded-full text-white font-medium 
          bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 
          border border-blue-300 shadow-lg 
          hover:from-blue-600 hover:to-blue-800 
          animate-pulse transition duration-300
          ${!(leadFormType === 1 || leadFormType === 2) ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={!(leadFormType === 1 || leadFormType === 2)}
      >
        + Create Lead
      </button>

      {/* Notification Bell */}
      <div className="relative" ref={notificationRef}>
        <Bell
          onClick={toggleNotificationsPanel}
          className="w-10 h-10 border border-gray-300 rounded-full p-2 text-blue-600 cursor-pointer bg-white shadow hover:bg-gray-100 transition"
        />
        {bellNotificationCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow">
            {bellNotificationCount}
          </span>
        )}
        {showNotifications && (
          <div className="absolute right-0 mt-2 w-80 max-h-60 overflow-y-auto bg-white shadow-2xl rounded-2xl p-4 text-sm z-20 border border-gray-200 transition-all duration-300">
            <div className="flex justify-between items-center mb-2">
              <div className="font-semibold text-gray-700">Today's Notifications</div>
              <X
                className="w-5 h-5 cursor-pointer text-gray-400 hover:text-gray-600"
                onClick={() => setShowNotifications(false)}
              />
            </div>
            {displayedNotifications.length === 0 ? (
              <div className="text-gray-400">No new notifications for today.</div>
            ) : (
              <ul className="space-y-3 mb-2">
                {displayedNotifications.map(note => (
                  <li
                    key={note.id}
                    className="flex justify-between items-start bg-blue-50 p-3 rounded-2xl shadow-sm text-gray-700"
                  >
                    <span>{note.message || note.title || 'New Notification'}</span>
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={viewAllNotifications}
              className="w-full mt-2 py-2 text-center bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
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
          {/* <div className="text-xl text-gray-600">▾</div> */}
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
              onClick={handleLogout}
              className="w-full text-center mt-5 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-xl transition"
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




// import { useEffect, useRef, useState, useCallback } from 'react';
// import { Bell, X } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';
// import LeadForm from '../LeadForm';
// import logo from './favicon.png';
// import axios from 'axios';
// import { ENDPOINTS } from '../../api/constraints';

// const LAST_UNREAD_COUNT_KEY = 'lastUnreadCountForBell';
// const POLLING_INTERVAL_MS = 30000;

// const ProfileHeader = () => {
//   const [profile, setProfile] = useState({
//     name: '',
//     email: '',
//     role: '',
//     company_name: '',
//     roleType: '',
//   });
//   const [showDropdown, setShowDropdown] = useState(false);
//   const [showNotifications, setShowNotifications] = useState(false);
//   const [displayedNotifications, setDisplayedNotifications] = useState([]);
//   const [bellNotificationCount, setBellNotificationCount] = useState(0);
//   const [showLeadForm, setShowLeadForm] = useState(false);
//   const [showAppMenu, setShowAppMenu] = useState(false);

//   const lastAcknowledgedUnreadCount = useRef(0);
//   const hasPushedNotification = useRef(false);
//   const navigate = useNavigate();
//   const dropdownRef = useRef(null);
//   const notificationRef = useRef(null);
//   const appMenuRef = useRef(null);

//   useEffect(() => {
//     const persistedCount = parseInt(localStorage.getItem(LAST_UNREAD_COUNT_KEY) || '0', 10);
//     lastAcknowledgedUnreadCount.current = persistedCount;

//     const userString = localStorage.getItem('user');
//     if (userString) {
//       try {
//         const userObject = JSON.parse(userString);
//         setProfile({
//           name: userObject.cFull_name || '',
//           email: userObject.cEmail || '',
//           role: userObject.cRole_name || userObject.irole_id || '-',
//           company_name: userObject.company_name || userObject.company?.cCompany_name || '-',
//           roleType: userObject.roleType || '-',
//         });
//       } catch (e) {
//         setProfile({ name: '', email: '', role: '', company_name: '' });
//       }
//     }

//     if (Notification.permission === 'default') {
//       Notification.requestPermission();
//     }
//   }, []);

//   const isToday = useCallback((dateString) => {
//     if (!dateString) return false;
//     const today = new Date();
//     const notificationDate = new Date(dateString);
//     return (
//       notificationDate.getDate() === today.getDate() &&
//       notificationDate.getMonth() === today.getMonth() &&
//       notificationDate.getFullYear() === today.getFullYear()
//     );
//   }, []);
//   <pfofile></pfofile>

//   const fetchUnreadTodayNotifications = useCallback(async () => {
//     const currentUserString = localStorage.getItem('user');
//     let currentUserId = null;

//     if (currentUserString) {
//       try {
//         const userObject = JSON.parse(currentUserString);
//         currentUserId = userObject.iUser_id;
//       } catch (e) {
//         console.error('Error parsing user object for notifications:', e);
//       }
//     }

//     const currentToken = localStorage.getItem('token');
//     if (!currentUserId || !currentToken) {
//       setDisplayedNotifications([]);
//       setBellNotificationCount(0);
//       lastAcknowledgedUnreadCount.current = parseInt(localStorage.getItem(LAST_UNREAD_COUNT_KEY) || '0', 10);
//       return;
//     }

//     try {
//       const res = await axios.get(`${ENDPOINTS.BASE_URL_IS}/notifications`, {
//         headers: {
//           Authorization: `Bearer ${currentToken}`,
//         },
//       });

//       const data = res.data;
//       const unreadTodayNotifications = data
//         .filter((n) => {
//           const notificationUserId = n.userId || n.user_id;
//           return (
//             String(notificationUserId) === String(currentUserId) &&
//             isToday(n.created_at) &&
//             !n.read
//           );
//         })
//         .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

//       setDisplayedNotifications(unreadTodayNotifications);

//       const currentUnreadTotal = unreadTodayNotifications.length;
//       const newNotifications = currentUnreadTotal - lastAcknowledgedUnreadCount.current;

//       if (!showNotifications && newNotifications > 0) {
//         setBellNotificationCount(Math.max(0, newNotifications));

//         if (Notification.permission === 'granted' && !hasPushedNotification.current) {
//           const latest = unreadTodayNotifications[0];
//           const notif = new Notification('🔔 New Notification', {
//             body: latest.message || latest.title || 'You have a new update',
//             icon: `${window.location.origin}/favicon.png`,
//           });

//           notif.onclick = () => {
//             window.focus();
//           };

//           hasPushedNotification.current = true;
//           setTimeout(() => {
//             hasPushedNotification.current = false;
//           }, 10000);
//         }
//       }
//     } catch (err) {
//       console.error('Error fetching notifications:', err);
//       setDisplayedNotifications([]);
//       setBellNotificationCount(0);
//     }
//   }, [isToday, showNotifications]);

//   useEffect(() => {
//     fetchUnreadTodayNotifications();
//     const intervalId = setInterval(fetchUnreadTodayNotifications, POLLING_INTERVAL_MS);
//     return () => clearInterval(intervalId);
//   }, [fetchUnreadTodayNotifications]);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setShowDropdown(false);
//       }
//       if (notificationRef.current && !notificationRef.current.contains(event.target)) {
//         setShowNotifications(false);
//       }
//       if (appMenuRef.current && !appMenuRef.current.contains(event.target)) {
//         setShowAppMenu(false);
//       }
//     };
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   const handleLeadFormOpen = () => setShowLeadForm(true);
//   const handleLeadFormClose = () => setShowLeadForm(false);

//   const toggleNotificationsPanel = () => {
//     setShowNotifications((prev) => {
//       if (!prev) {
//         const currentUnread = displayedNotifications.length;
//         lastAcknowledgedUnreadCount.current = currentUnread;
//         localStorage.setItem(LAST_UNREAD_COUNT_KEY, String(currentUnread));
//         setBellNotificationCount(0);
//       } else {
//         fetchUnreadTodayNotifications();
//       }
//       return !prev;
//     });
//   };

//   const handleLogout = () => {
//     localStorage.removeItem('user');
//     localStorage.removeItem('token');
//     setBellNotificationCount(0);
//     setDisplayedNotifications([]);
//     navigate('/');
//   };

//   // const createUser = () => navigate('/users');
//   const viewAllNotifications = () => {
//     setShowNotifications(false);
//     navigate('/notifications');
//   };

//   // const isAdminUser = ['administrator', 'super_admin'].includes(profile.role?.toLowerCase());

//   return (
//     <div className="flex justify-end items-center gap-4 mb-6 relative font-[San Francisco, -apple-system, BlinkMacSystemFont]">
      

//       {showLeadForm && (
//         <div className="fixed inset-0 z-40 bg-black bg-opacity-30 backdrop-blur-sm flex justify-center items-center">
//           <div className="bg-white p-6 rounded-3xl shadow-2xl w-11/12 md:w-3/4 max-h-[80vh] overflow-y-auto transition-all duration-300">
//             <LeadForm onClose={handleLeadFormClose} />
//           </div>
//         </div>
//       )}
//        <button
//   onClick={handleLeadFormOpen}
//   className="px-5 py-2 rounded-full text-white font-medium 
//              bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 
//              border border-blue-300 shadow-lg 
//              hover:from-blue-600 hover:to-blue-800 
//              animate-pulse transition duration-300"
// >
//   + Create Lead
// </button>

//       {/* {isAdminUser && (
//         <button
//           onClick={createUser}
//           className="px-5 py-2 rounded-full text-blue-600 font-medium bg-white border border-gray-300 shadow-sm hover:bg-gray-100 transition"
//         >
//           + User
//         </button>
//       )} */}

//       <div className="relative" ref={notificationRef}>
//         <Bell
//           onClick={toggleNotificationsPanel}
//           className="w-10 h-10 border border-gray-300 rounded-full p-2 text-blue-600 cursor-pointer bg-white shadow hover:bg-gray-100 transition"
//         />
//         {bellNotificationCount > 0 && (
//           <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow">
//             {bellNotificationCount}
//           </span>
//         )}

//         {showNotifications && (
//           <div className="absolute right-0 mt-2 w-80 max-h-60 overflow-y-auto bg-white shadow-2xl rounded-2xl p-4 text-sm z-20 border border-gray-200 transition-all duration-300">
//             <div className="flex justify-between items-center mb-2">
//               <div className="font-semibold text-gray-700">Today's Notifications</div>
//               <X
//                 className="w-5 h-5 cursor-pointer text-gray-400 hover:text-gray-600"
//                 onClick={() => setShowNotifications(false)}
//               />
//             </div>
//             {displayedNotifications.length === 0 ? (
//               <div className="text-gray-400">No new notifications for today.</div>
//             ) : (
//               <ul className="space-y-3 mb-2">
//                 {displayedNotifications.map((note) => (
//                   <li
//                     key={note.id}
//                     className="flex justify-between items-start bg-blue-50 p-3 rounded-2xl shadow-sm text-gray-700"
//                   >
//                     <span>{note.message || note.title || 'New Notification'}</span>
//                   </li>
//                 ))}
//               </ul>
//             )}
//             <button
//               onClick={viewAllNotifications}
//               className="w-full mt-2 py-2 text-center bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
//             >
//               View All
//             </button>
//           </div>
//         )}
//       </div>

     


//       <div className="relative" ref={dropdownRef}>
//         <div
//   className="flex items-center gap-2 cursor-pointer"
//   onClick={() => setShowDropdown(!showDropdown)}
// >
//   <label htmlFor="profile-upload">
//     {profile.cProfile_pic ? (
//       <img
//         src={profile.cProfile_pic}
//         alt="avatar"
//         className="w-10 h-10 rounded-full object-cover border border-gray-300 shadow"
//       />
//     ) : (
//        <img
//                     src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
//                       profile.name

//                     )}&background=random&color=fff&rounded=true`}
//                     alt="Profile"
//                     className="w-12 h-12 rounded-full object-cover"
//                   />
//     )}
//   </label>

//   <input
//     type="file"
//     accept="image/*"
//     id="profile-upload"
//     onChange={() => {}}
//     className="hidden"
//   />

//   <div className="text-xl text-gray-600">▾</div>
// </div>


//         {showDropdown && (
//           <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 text-sm z-50 transition-all duration-300">
//             <div className="flex justify-between items-start mb-2">
//               <div>
//                 <div className="font-semibold text-gray-900">{profile.name}</div>
//                 <div className="text-gray-500">{profile.email}</div>
//                 <div className="text-gray-500">Role: {profile.role}</div>
//                 <div className="text-gray-500">System Role: {profile.roleType}</div>
//                 {profile.company_name && (
//                   <div className="text-gray-500">Company: {profile.company_name}</div>
//                 )}
//               </div>
//               <X
//                 className="w-5 h-5 cursor-pointer text-gray-400 hover:text-gray-600"
//                 onClick={() => setShowDropdown(false)}
//               />
//             </div>
//             <button
//               onClick={handleLogout}
//               className="w-full text-center mt-5 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-xl transition"
//             >
//               Logout
//             </button>
//           </div>
//         )}
//       </div>

//       {/* App Menu Icon + Dropdown */}
//       {/* <div className="relative" ref={appMenuRef}>
//         <img
//           src="../../../public/images/nav/menu.svg"
//           alt="App Menu"
//           className="h-6 w-6 cursor-pointer"
//           onClick={() => setShowAppMenu(!showAppMenu)}
//         />
//         {showAppMenu && (
//          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 text-sm p-2" style={{marginTop:'16px'}}>
//           <div className="grid grid-cols-2 gap-2">
//             <a
//               href="https://expense.inklidox.com/"
//               target="_blank"
//               rel="noopener noreferrer"
//               className="block px-4 py-2 hover:bg-gray-100 text-gray-700 rounded"
//             >
//               <img src=""/> OExpense
//             </a>
//             <a
//               href="https://hrms.inklidox.com/"
//               target="_blank"
//               rel="noopener noreferrer"
//               className="block px-4 py-2 hover:bg-gray-100 text-gray-700 rounded"
//             >
//               🧑‍💼 OHRMS
//             </a>
//           </div>
//           </div>

//         )}
//       </div> */}
//     </div>
//   );
// };

// export default ProfileHeader;
