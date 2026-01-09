import { useContext, useEffect, useRef, useState, useMemo } from "react";
import { Bell, X, Grid as AppsIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LeadForm from "../LeadForm";
import LeadFormB2C from "../LeadFormB2C";
import { companyContext } from "../../context/companyContext";
import { useUserAccess } from "../../context/UserAccessContext";
import axios from "axios";
import { ENDPOINTS } from "../../api/constraints";
import { useLeadForm } from "../../context/LeadFormContext";


// const LAST_SEEN_TS_KEY = "notifications_today_last_seen_at";
const LAST_SEEN_TS_KEY = "notifications_last_seen";


const ProfileHeader = () => {
  const { userModules } = useUserAccess();
  const { company } = useContext(companyContext);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    role: "",
    company_name: "",
    roleType: "",
  });

  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [bellNotificationCount, setBellNotificationCount] = useState(0);
  const { showLeadForm, setShowLeadForm, leadFormType, setLeadFormType } = useLeadForm();
  const [showAppMenu, setShowAppMenu] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const appMenuRef = useRef(null);

  // filter logic - only show if bactive is true
  const pdfPermissions = useMemo(() => {
    return userModules.filter(
      (attr) => 
        attr.module_id === 1 && 
        attr.attributes_id === 23 && 
        attr.attribute_name === "Generate PDF" &&
        attr.bactive === true // Only show if active
    );
  }, [userModules]);

  const hasPdfPermission = pdfPermissions.length > 0;
  const leadFormOpenedRef = useRef(false);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const token = localStorage.getItem("token");
      
      if (!token) return;

      try {
        // DECODE userId from JWT token (SAME as NotificationPage)
        const decoded = JSON.parse(atob(token.split(".")[1]));
        const userId = decoded.user_id;
        
        console.log("Decoded userId:", userId); // Check this in console
        
        if (!userId) return;

        const res = await axios.get(`${ENDPOINTS.NOTIFICATIONS}/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("API Response:", res.data);
        
        // Backend returns unreadCount in different formats - handle all
        const unreadCount = res.data.unreadCount ?? res.data.data?.length ?? 0;
        setBellNotificationCount(unreadCount);

      } catch (err) {
        console.error("Notification error:", err.response?.status, err.response?.data);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, []);

  // Load user & set profile on mount
  useEffect(() => {
    const userString = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!userString || !token) return;
    try {
      const userObject = JSON.parse(userString);
      setProfile({
        name: userObject.cFull_name || "",
        email: userObject.cEmail || "",
        role: userObject.cRole_name || userObject.irole_id || "-",
        company_name:
          userObject.company_name || userObject.company?.cCompany_name || "-",
        roleType: userObject.roleType || "-",
      });
    } catch {
      setProfile({ name: "", email: "", role: "", company_name: "" });
    }
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Update leadFormType when company context updates
  useEffect(() => {
    const newBusinessTypeId = company?.result?.businessType?.id ?? null;
    if (newBusinessTypeId !== leadFormType) {
      setLeadFormType(newBusinessTypeId);
      leadFormOpenedRef.current = false;
    }
  }, [company, leadFormType]);

  useEffect(() => {
    const handler = () => {
      const userObj = JSON.parse(localStorage.getItem("user") || "{}");
      if (leadFormType !== userObj.ibusiness_type) {
        setLeadFormType(userObj.ibusiness_type);
        leadFormOpenedRef.current = false;
      }
      setProfile((prev) => ({ ...prev, company_name: userObj.company_name }));
    };
    window.addEventListener("leadFormTypeChanged", handler);
    return () => window.removeEventListener("leadFormTypeChanged", handler);
  }, [leadFormType]);

  const handleLeadFormOpen = () => {
    if (leadFormType === 1 || leadFormType === 2) setShowLeadForm(true);
  };

  const handleLeadFormClose = () => setShowLeadForm(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem(LAST_SEEN_TS_KEY);
    setBellNotificationCount(0);
    setShowLeadForm(false);
    navigate("/");
  };

  const handleGeneratePoster = () => {
    navigate("/generate-poster");
    setShowAppMenu(false);
  };

  const handleMaps = () => {
    navigate("/maps");
    setShowAppMenu(false);
  };

  const handleGSTVerification = () => {
    navigate("/gst-compliance");
    setShowAppMenu(false);
  };

  const handleBulkMail = () => {
    navigate("/mailsender");
    setShowAppMenu(false);
  };

const handleOpenNotifications = async () => {
  const token = localStorage.getItem("token");
  
  try {
    await axios.post(`${ENDPOINTS.NOTIFICATION_READ}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setBellNotificationCount(0);
    navigate("/notifications");
  } catch (err) {
    console.error("Error marking as read:", err);
    navigate("/notifications"); 
  }
};

  useEffect(() => {
    const onClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target))
        setShowDropdown(false);
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      )
        setShowNotifications(false);
      if (appMenuRef.current && !appMenuRef.current.contains(event.target))
        setShowAppMenu(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);


return (
  <div className="flex justify-end items-center gap-3 mb-6 relative px-2">
    {/* Lead Form Modal */}
    {showLeadForm && (
      <div className="fixed inset-0 z-40 bg-black bg-opacity-30 flex justify-center items-center">
        <div className="bg-white p-4 md:p-6 rounded-3xl shadow-2xl w-11/12 md:w-3/4 max-h-[80vh] overflow-y-auto transition-all duration-300">
          {leadFormType === 1 && <LeadForm onClose={handleLeadFormClose} />}
          {leadFormType === 2 && (
            <LeadFormB2C onClose={handleLeadFormClose} />
          )}
        </div>
      </div>
    )}

    {/* + Create Lead Button - responsive text */}
   <div className="hidden md:flex">
    <button
      onClick={handleLeadFormOpen}
      disabled={!(leadFormType === 1 || leadFormType === 2)}
      className={`flex items-center justify-center px-3 md:px-5 py-2 rounded-full text-white font-medium 
        bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 
        border border-blue-300 shadow-lg 
        hover:from-blue-600 hover:to-blue-800 
        transition duration-300
        ${
          !(leadFormType === 1 || leadFormType === 2)
            ? "opacity-50 cursor-not-allowed"
            : "animate-pulse"
        }`}
    >
      {/* Mobile: just +, Desktop: + Create Lead */}
      <span className="text-lg md:hidden">+</span>
      <span className="hidden md:inline">+ Create Lead</span>
    </button>
    </div>

    {/* Notification Bell */}
    <div className="relative" ref={notificationRef}>
      <Bell
        onClick={handleOpenNotifications}
        className="w-9 h-9 md:w-10 md:h-10 border border-grey-600 rounded-full p-2 text-blue-600 cursor-pointer bg-white shadow-md hover:bg-blue-50 transition"
      />
      {bellNotificationCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] md:text-xs font-semibold px-1.5 md:px-2 py-0.5 rounded-full shadow-lg">
          {bellNotificationCount}
        </span>
      )}
    </div>

    {/* Apps / Tools Icon */}
    <div className="relative" ref={appMenuRef}>
      <AppsIcon
        onClick={() => setShowAppMenu((prev) => !prev)}
        className="w-9 h-9 md:w-10 md:h-10 p-2 text-indigo-600 cursor-pointer bg-white border border-indigo-300 rounded-full shadow-md hover:bg-indigo-50 transition"
      />
      {showAppMenu && (
        <div
          className="
            fixed md:absolute
            right-2 md:right-0
            top-16 md:top-auto md:mt-2
            w-56 md:w-60 
            bg-white border border-indigo-200 rounded-2xl shadow-2xl p-4 
            z-[9999] grid grid-cols-2 gap-3
          "
        >
          {/* PDF Generation Button - Only show if permission is active */}
          {hasPdfPermission &&
            pdfPermissions.map((item, index) => (
              <div
                key={item.attributes_id || index}
                onClick={handleGeneratePoster}
                className="hidden sm:flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200 rounded-xl p-3 cursor-pointer transition"
              >
                <img
                  src="/illustrations/crop.png"
                  alt="poster"
                  className="w-8 h-8 mb-1 opacity-90"
                />
                <span className="text-[11px] md:text-sm font-semibold text-blue-700 text-center">
                  {item.attribute_name}
                </span>
              </div>
            ))}

          <div
            onClick={handleGSTVerification}
            className="flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border border-green-200 rounded-xl p-3 cursor-pointer transition"
          >
            <img
              src="/illustrations/courthouse.png"
              alt="gst"
              className="w-8 h-8 mb-1 opacity-90"
            />
            <span className="text-[11px] md:text-sm font-semibold text-green-700 text-center">
              GST Verification
            </span>
          </div>

          <div
            onClick={handleMaps}
            className="flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 border border-red-200 rounded-xl p-3 cursor-pointer transition"
          >
            <img
              src="/illustrations/map_dist.png"
              alt="maps"
              className="w-8 h-8 mb-1 opacity-90"
            />
            <span className="text-[11px] md:text-sm font-semibold text-red-700 text-center">
              Find Location
            </span>
          </div>

          <div
            onClick={handleBulkMail}
            className="flex flex-col items-center justify-center bg-gradient-to-br from-yellow-50 to-yellow-100 hover:to-yellow-200 border border-yellow-200 rounded-xl p-3 cursor-pointer transition"
          >
            <img
              src="/illustrations/bulkMail.png"
              alt="bulk mail"
              className="w-10 h-8 mb-1 opacity-90"
            />
            <span className="text-[11px] md:text-sm font-semibold text-yellow-700 text-center">
              Bulk Mail
            </span>
          </div>
        </div>
      )}
    </div>

    {/* Profile Dropdown */}
    <div className="relative" ref={dropdownRef}>
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => setShowDropdown((prev) => !prev)}
      >
        <div className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold shadow-md text-sm md:text-base">
          {profile.name
            ? profile.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()
            : "UU"}
        </div>
      </div>

      {showDropdown && (
        <div className="fixed md:absolute right-2 md:right-0 top-16 md:top-auto md:mt-3 w-64 md:w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 md:p-5 text-xs md:text-sm transition-all duration-300 z-[9999]">
          <div className="flex justify-between items-start mb-2">
            <div className="space-y-0.5">
              <div className="font-semibold text-gray-900">
                {profile.name}
              </div>
              <div className="text-gray-500 break-all">{profile.email}</div>
              <div className="text-gray-500">Role: {profile.role}</div>
              <div className="text-gray-500">
                System Role: {profile.roleType}
              </div>
              {profile.company_name && (
                <div className="text-gray-500 break-all">
                  Company: {profile.company_name}
                </div>
              )}
            </div>
            <X
              className="w-4 h-4 md:w-5 md:h-5 cursor-pointer text-gray-400 hover:text-gray-600"
              onClick={() => setShowDropdown(false)}
            />
          </div>

          <button
            onClick={handleLogout}
            className="w-full text-center bg-red-500 hover:bg-red-600 text-white font-semibold py-1.5 md:py-2 rounded-xl transition text-sm"
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


// import { useContext, useEffect, useRef, useState, useMemo } from "react";
// import { Bell, X, Grid as AppsIcon } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import LeadForm from "../LeadForm";
// import LeadFormB2C from "../LeadFormB2C";
// import { companyContext } from "../../context/companyContext";
// import { useUserAccess } from "../../context/UserAccessContext";
// import axios from "axios";
// import { ENDPOINTS } from "../../api/constraints";
// const LAST_SEEN_TS_KEY = "notifications_last_seen";

// const ProfileHeader = () => {
//   const { userModules } = useUserAccess();
//   const { company } = useContext(companyContext);
//   const [profile, setProfile] = useState({
//     name: "",
//     email: "",
//     role: "",
//     company_name: "",
//     roleType: "",
//   });

//   const [showDropdown, setShowDropdown] = useState(false);
//   const [showNotifications, setShowNotifications] = useState(false);
//   const [bellNotificationCount, setBellNotificationCount] = useState(0);
//   const [showLeadForm, setShowLeadForm] = useState(false);
//   const [leadFormType, setLeadFormType] = useState(null);
//   const [showAppMenu, setShowAppMenu] = useState(false);
//   const navigate = useNavigate();
//   const dropdownRef = useRef(null);
//   const notificationRef = useRef(null);
//   const appMenuRef = useRef(null);

//   const pdfPermissions = useMemo(() => {
//     return userModules.filter(
//       (attr) => 
//         attr.module_id === 1 && 
//         attr.attributes_id === 23 && 
//         attr.attribute_name === "Generate PDF" &&
//         attr.bactive === true 
//     );
//   }, [userModules]);

//   const hasPdfPermission = pdfPermissions.length > 0;
//   const leadFormOpenedRef = useRef(false);

// useEffect(() => {
//   const fetchUnreadCount = async () => {
//     const token = localStorage.getItem("token");
    
//     if (!token) return;

//     try {
//       const decoded = JSON.parse(atob(token.split(".")[1]));
//       const userId = decoded.user_id;
//       if (!userId) return;
//       const res = await axios.get(`${ENDPOINTS.NOTIFICATIONS}/${userId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });      
//       const unreadCount = res.data.unreadCount ?? res.data.data?.length ?? 0;
//       setBellNotificationCount(unreadCount);

//     } catch (err) {
//       console.error("Notification error:", err.response?.status, err.response?.data);
//     }
//   };

//   fetchUnreadCount();
//   const interval = setInterval(fetchUnreadCount, 10000);
//   return () => clearInterval(interval);
// }, []);

//   useEffect(() => {
//     const userString = localStorage.getItem("user");
//     const token = localStorage.getItem("token");
//     if (!userString || !token) return;
//     try {
//       const userObject = JSON.parse(userString);
//       setProfile({
//         name: userObject.cFull_name || "",
//         email: userObject.cEmail || "",
//         role: userObject.cRole_name || userObject.irole_id || "-",
//         company_name:
//           userObject.company_name || userObject.company?.cCompany_name || "-",
//         roleType: userObject.roleType || "-",
//       });
//     } catch {
//       setProfile({ name: "", email: "", role: "", company_name: "" });
//     }
//     if (Notification.permission === "default") {
//       Notification.requestPermission();
//     }
//   }, []);

//   // Update leadFormType when company context updates
//   useEffect(() => {
//     const newBusinessTypeId = company?.result?.businessType?.id ?? null;
//     if (newBusinessTypeId !== leadFormType) {
//       setLeadFormType(newBusinessTypeId);
//       leadFormOpenedRef.current = false;
//     }
//   }, [company, leadFormType]);

//   useEffect(() => {
//     const handler = () => {
//       const userObj = JSON.parse(localStorage.getItem("user") || "{}");
//       if (leadFormType !== userObj.ibusiness_type) {
//         setLeadFormType(userObj.ibusiness_type);
//         leadFormOpenedRef.current = false;
//       }
//       setProfile((prev) => ({ ...prev, company_name: userObj.company_name }));
//     };
//     window.addEventListener("leadFormTypeChanged", handler);
//     return () => window.removeEventListener("leadFormTypeChanged", handler);
//   }, [leadFormType]);

//   const handleLeadFormOpen = () => {
//     if (leadFormType === 1 || leadFormType === 2) setShowLeadForm(true);
//   };

//   const handleLeadFormClose = () => setShowLeadForm(false);

//   const handleLogout = () => {
//     localStorage.removeItem("user");
//     localStorage.removeItem("token");
//     localStorage.removeItem(LAST_SEEN_TS_KEY);
//     setBellNotificationCount(0);
//     setShowLeadForm(false);
//     navigate("/");
//   };

//   const handleGeneratePoster = () => {
//     navigate("/generate-poster");
//     setShowAppMenu(false);
//   };

//   const handleMaps = () => {
//     navigate("/maps");
//     setShowAppMenu(false);
//   };

//   const handleGSTVerification = () => {
//     navigate("/gst-compliance");
//     setShowAppMenu(false);
//   };

//   const handleBulkMail = () => {
//     navigate("/mailsender");
//     setShowAppMenu(false);
//   };

// const handleOpenNotifications = async () => {
//   const token = localStorage.getItem("token");
  
//   try {
//     await axios.post(ENDPOINTS.NOTIFICATION_READ, {}, {
//       headers: { Authorization: `Bearer ${token}` },
//     });

//     setBellNotificationCount(0);
//     navigate("/notifications");
//   } catch (err) {
//     console.error("Error marking as read:", err);
//     navigate("/notifications"); 
//   }
// };

//   useEffect(() => {
//     const onClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target))
//         setShowDropdown(false);
//       if (
//         notificationRef.current &&
//         !notificationRef.current.contains(event.target)
//       )
//         setShowNotifications(false);
//       if (appMenuRef.current && !appMenuRef.current.contains(event.target))
//         setShowAppMenu(false);
//     };
//     document.addEventListener("mousedown", onClickOutside);
//     return () => document.removeEventListener("mousedown", onClickOutside);
//   }, []);

//   return (
//     <div className="flex justify-end items-center gap-4 mb-6 relative">
//       {/* Lead Form Modal */}
//       {showLeadForm && (
//         <div className="fixed inset-0 z-40 bg-black bg-opacity-30 flex justify-center items-center">
//           <div className="bg-white p-6 rounded-3xl shadow-2xl w-11/12 md:w-3/4 max-h-[80vh] overflow-y-auto transition-all duration-300">
//             {leadFormType === 1 && <LeadForm onClose={handleLeadFormClose} />}
//             {leadFormType === 2 && (
//               <LeadFormB2C onClose={handleLeadFormClose} />
//             )}
//           </div>
//         </div>
//       )}

//       {/* + Create Lead Button */}
//       <button
//         onClick={handleLeadFormOpen}
//         disabled={!(leadFormType === 1 || leadFormType === 2)}
//         className={`px-5 py-2 rounded-full text-white font-medium 
//           bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 
//           border border-blue-300 shadow-lg 
//           hover:from-blue-600 hover:to-blue-800 
//           transition duration-300
//           ${
//             !(leadFormType === 1 || leadFormType === 2)
//               ? "opacity-50 cursor-not-allowed"
//               : "animate-pulse"
//           }`}
//       >
//         + Create Lead
//       </button>

//       {/* Notification Bell */}
//       <div className="relative" ref={notificationRef}>
//         <Bell
//           onClick={handleOpenNotifications}
//           className="w-10 h-10 border border-grey-600 rounded-full p-2 text-blue-600 cursor-pointer bg-white shadow-md hover:bg-blue-50 transition"
//         />
//         {bellNotificationCount > 0 && (
//           <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow-lg">
//             {bellNotificationCount}
//           </span>
//         )}
//       </div>

//       {/* Apps / Tools Icon */}
//       <div className="relative" ref={appMenuRef}>
//         <AppsIcon
//           onClick={() => setShowAppMenu((prev) => !prev)}
//           className="w-10 h-10 p-2 text-indigo-600 cursor-pointer bg-white border border-indigo-300 rounded-full shadow-md hover:bg-indigo-50 transition"
//         />
//         {showAppMenu && (
//            <div className="fixed right-4 mt-2 w-60 bg-white border border-indigo-200 rounded-2xl shadow-2xl p-4 z-[9999] grid grid-cols-2 gap-3"> 
//             {/* PDF Generation Button - Only show if permission is active */}
//             {hasPdfPermission && pdfPermissions.map((item, index) => (
//               <div key={item.attributes_id || index} onClick={handleGeneratePoster}
//                 className="flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200 rounded-xl p-3 cursor-pointer transition"
//               >
//                 <img src="/illustrations/crop.png" alt="poster" className="w-8 h-8 mb-1 opacity-90" />
//                 <span className="text-sm font-semibold text-blue-700"> {item.attribute_name} </span>
//               </div>
//             ))}

//             <div onClick={handleGSTVerification} className="flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border border-green-200 rounded-xl p-3 cursor-pointer transition" >
//               <img src="/illustrations/courthouse.png" alt="gst" className="w-8 h-8 mb-1 opacity-90" />
//               <span className="text-sm font-semibold text-green-700"> GST Verification </span>
//             </div>

//             <div onClick={handleMaps} className="flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 border border-red-200 rounded-xl p-3 cursor-pointer transition" >
//               <img src="/illustrations/map_dist.png" alt="maps" className="w-8 h-8 mb-1 opacity-90" />
//               <span className="text-sm font-semibold text-red-700"> Find Location </span>
//             </div>

//             <div onClick={handleBulkMail} className="flex flex-col items-center justify-center bg-gradient-to-br from-yellow-50 to-yellow-100 hover:to-yellow-200 border border-yellow-200 rounded-xl p-3 cursor-pointer transition" >
//               <img src="/illustrations/bulkMail.png" alt="bulk mail" className="w-15 h-8 mb-1 opacity-90" />
//               <span className="text-sm font-semibold text-yellow-700"> Bulk Mail </span>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Profile Dropdown */}
//       <div className="relative" ref={dropdownRef}>
//         <div
//           className="flex items-center gap-2 cursor-pointer"
//           onClick={() => setShowDropdown((prev) => !prev)}
//         >
//           <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold shadow-md">
//             {profile.name
//               ? profile.name
//                   .split(" ")
//                   .map((n) => n[0])
//                   .slice(0, 2)
//                   .join("")
//                   .toUpperCase()
//               : "UU"}
//           </div>
//         </div>

//         {showDropdown && (
//           <div className="fixed right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 text-sm  transition-all duration-300 z-[9999]">
//             <div className="flex justify-between items-start mb-2">
//               <div>
//                 <div className="font-semibold text-gray-900"> {profile.name} </div>
//                 <div className="text-gray-500">{profile.email}</div>
//                 <div className="text-gray-500">Role: {profile.role}</div>
//                 <div className="text-gray-500"> System Role: {profile.roleType} </div>
//                 {profile.company_name && ( <div className="text-gray-500">  Company: {profile.company_name} </div> )}
//               </div>
//               <X className="w-5 h-5 cursor-pointer text-gray-400 hover:text-gray-600" onClick={() => setShowDropdown(false)} />
//             </div>

//             <button onClick={handleLogout} className="w-full text-center bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-xl transition" >
//               Logout
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ProfileHeader;
