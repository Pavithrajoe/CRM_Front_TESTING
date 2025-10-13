import { useEffect, useRef, useState, useCallback } from "react";
import { Bell, X, Grid as AppsIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LeadForm from "../LeadForm";
import LeadFormB2C from "../LeadFormB2C";
import axios from "axios";
import { ENDPOINTS } from "../../api/constraints";

const LAST_SEEN_TS_KEY = "notifications_today_last_seen_at";
const POLLING_INTERVAL_MS = 60000;

const ProfileHeader = () => {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    role: "",
    company_name: "",
    roleType: "",
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

  // Load user & company
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
          userObject.company_name ||
          userObject.company?.cCompany_name ||
          "-",
        roleType: userObject.roleType || "-",
      });

      const companyId = userObject.iCompany_id;
      if (!companyId) return;

      axios
        .get(`${ENDPOINTS.BASE_URL_IS}/company/${companyId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const data = res.data?.result;
          setLeadFormType(
            data && data.ibusiness_type ? Number(data.ibusiness_type) : null
          );
        })
        .catch(() => setLeadFormType(null));
    } catch {
      setProfile({ name: "", email: "", role: "", company_name: "" });
      setLeadFormType(null);
    }
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [navigate]);

  // LeadFormType listener
  useEffect(() => {
    const handler = (e) => {
      const userObj = JSON.parse(localStorage.getItem("user") || "{}");
      setLeadFormType(userObj.ibusiness_type);
      setProfile((prev) => ({ ...prev, company_name: userObj.company_name }));
    };
    window.addEventListener("leadFormTypeChanged", handler);
    return () => window.removeEventListener("leadFormTypeChanged", handler);
  }, []);

  const handleLeadFormOpen = () => {
    if (leadFormType === 1 || leadFormType === 2) setShowLeadForm(true);
  };
  const handleLeadFormClose = () => setShowLeadForm(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem(LAST_SEEN_TS_KEY);
    setBellNotificationCount(0);
    setDisplayedNotifications([]);
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

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target))
        setShowDropdown(false);
      if (notificationRef.current && !notificationRef.current.contains(event.target))
        setShowNotifications(false);
      if (appMenuRef.current && !appMenuRef.current.contains(event.target))
        setShowAppMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex justify-end items-center gap-4 mb-6 relative">
      {/* Lead Form Modal */}
      {showLeadForm && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-30 flex justify-center items-center">
          <div className="bg-white p-6 rounded-3xl shadow-2xl w-11/12 md:w-3/4 max-h-[80vh] overflow-y-auto transition-all duration-300">
            {leadFormType === 1 && (
              <LeadForm onClose={() => setShowLeadForm(false)} />
            )}
            {leadFormType === 2 && (
              <LeadFormB2C onClose={() => setShowLeadForm(false)} />
            )}
          </div>
        </div>
      )}

      {/* + Create Lead Button */}
      <button
        onClick={handleLeadFormOpen}
        className={`px-5 py-2 rounded-full text-white font-medium 
          bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 
          border border-blue-300 shadow-lg 
          hover:from-blue-600 hover:to-blue-800 
          transition duration-300
          ${
            !(leadFormType === 1 || leadFormType === 2)
              ? "opacity-50 cursor-not-allowed"
              : "animate-pulse"
          }`}
        disabled={!(leadFormType === 1 || leadFormType === 2)}
      >
        + Create Lead
      </button>

      {/* Notification Bell */}
      <div className="relative" ref={notificationRef}>
        <Bell
          onClick={() => setShowNotifications((prev) => !prev)}
          className="w-10 h-10 border border-grey-600 rounded-full p-2 text-blue-600 cursor-pointer bg-white shadow-md hover:bg-blue-50 transition"
        />
        {bellNotificationCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow-lg">
            {bellNotificationCount}
          </span>
        )}
      </div>

      {/* Apps / Tools Icon */}
      <div className="relative" ref={appMenuRef}>
        <AppsIcon
          onClick={() => setShowAppMenu((prev) => !prev)}
          className="w-10 h-10 p-2 text-indigo-600 cursor-pointer bg-white border border-indigo-300 rounded-full shadow-md hover:bg-indigo-50 transition"
        />
        {showAppMenu && (
          <div className="absolute right-0 mt-2 w-60 bg-white border border-indigo-200 rounded-2xl shadow-2xl p-4 z-50 grid grid-cols-2 gap-3">
            <div
              onClick={handleGeneratePoster}
              className="flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200 rounded-xl p-3 cursor-pointer transition"
            >
              <img
                src="/illustrations/crop.png"
                alt="poster"
                className="w-8 h-8 mb-1 opacity-90"
              />
              <span className="text-sm font-semibold text-blue-700">
                Generate Poster
              </span>
            </div>

            <div
              onClick={handleGSTVerification}
              className="flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border border-green-200 rounded-xl p-3 cursor-pointer transition"
            >
              <img
                src="/illustrations/courthouse.png"
                alt="gst"
                className="w-8 h-8 mb-1 opacity-90"
              />
              <div className="flex items-center justify-center">
  <span className="text-sm font-semibold text-green-700">
    GST Verification
  </span>
</div>

            </div>
             <div
              onClick={handleMaps}
              className="flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border border-green-200 rounded-xl p-3 cursor-pointer transition"
            >
              <img
                src="/illustrations/map_dist.png"
                alt="gst"
                className="w-8 h-8 mb-1 opacity-90"
              />
              <div className="flex items-center justify-center">
  <span className="text-sm font-semibold text-green-700">
    Find Location
  </span>
</div>

            </div>
       
          </div>
        )}
      </div>

      {/* Profile Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold shadow-md">
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
          <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 text-sm z-50 transition-all duration-300">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-semibold text-gray-900">{profile.name}</div>
                <div className="text-gray-500">{profile.email}</div>
                <div className="text-gray-500">Role: {profile.role}</div>
                <div className="text-gray-500">
                  System Role: {profile.roleType}
                </div>
                {profile.company_name && (
                  <div className="text-gray-500">
                    Company: {profile.company_name}
                  </div>
                )}
              </div>
              <X
                className="w-5 h-5 cursor-pointer text-gray-400 hover:text-gray-600"
                onClick={() => setShowDropdown(false)}
              />
            </div>

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
