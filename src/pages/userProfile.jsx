import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
// import { ENDPOINTS } from '../../api/constraints';
import { ENDPOINTS } from '../api/constraints';
// import ProfileHeader from '../../Components/common/ProfileHeader';
import ProfileHeader from '../Components/common/ProfileHeader';
import SettingsPage from './userPage/settingsPage';
import HistoryDashboard from './userPage/historyPage';
// import HistoryDashboard from '../userPage/historyPage';
// import AcheivementDashboard from '../userPage/acheivementPage';
import AchievementDashboard from './userPage/acheivementPage';
import axios from 'axios';

import {
  FaEdit, FaUser, FaEnvelope,
  FaIdBadge, FaCalendarAlt, FaFingerprint, FaBriefcase, FaUserTie
} from 'react-icons/fa';

const ToggleSwitch = ({ label, isChecked, onToggle }) => (
  <div className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0">
    <span className="text-gray-700 font-semibold">{label}</span>
    <div
      onClick={onToggle}
      className={`relative w-12 h-7 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
        isChecked ? 'bg-green-600' : 'bg-red-400'
      }`}
    >
      <div
        className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
          isChecked ? 'translate-x-5' : 'translate-x-0'
        }`}
      ></div>
    </div>
  </div>
);

const tabs = ['Target', 'History', 'Settings', 'Achievement'];

const UserProfile = () => {
  const { userId } = useParams();
  console.log("User ID from URL:", userId);

  // ALL HOOKS MUST BE DECLARED AT THE TOP LEVEL, UNCONDITIONALLY
  const [user, setUser] = useState(null); // Keep user null initially
  const [activeTab, setActiveTab] = useState('Target');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [reportToUsers, setReportToUsers] = useState([]); // State to store users for 'Reports To' dropdown


  // Fetch specific user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No authorization token found.");
          alert("Authentication required. Please log in.");
          setUser({}); // Set to empty object on auth error
          return;
        }

        const response = await fetch(`${ENDPOINTS.USER_GET}/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch user data");
        }

        const userData = await response.json();
        console.log("Fetched user data:", userData);

        setUser(userData);
        setFormData({
          cFull_name: userData.cFull_name || '',
          cUser_name: userData.cUser_name || '',
          cEmail: userData.cEmail || '',
          cjob_title: userData.cjob_title || '',
          reports_to: userData.reports_to || '',
        });
        setErrorMessage("");
      } catch (error) {
        console.error("Failed to fetch user by ID:", error);
        setUser({}); // Set to an empty object on fetch failure to indicate error state
        setErrorMessage(error.message || "Could not load user profile. Please try again.");
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  // Fetch all users for the "Reports To" dropdown
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch(ENDPOINTS.USER_GET, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch users for dropdown");
        }

        const allUsers = await response.json();
        const filteredUsers = allUsers.filter(u => u.iUser_id !== parseInt(userId, 10));
        setReportToUsers(filteredUsers);
      } catch (error) {
        console.error("Failed to fetch all users:", error);
      }
    };
    fetchAllUsers();
  }, [userId]);


  const openForm = () => {
    setFormData({
      cFull_name: user.cFull_name || '',
      cUser_name: user.cUser_name || '',
      cEmail: user.cEmail || '',
      cjob_title: user.cjob_title || '',
      reports_to: user.reports_to || '',
    });
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "reports_to" ? (value === "" ? "" : parseInt(value, 10)) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const updatedProfilePayload = { ...formData };
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${ENDPOINTS.USER_GET}/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedProfilePayload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update user profile');
      }

      const updated = await res.json();
      console.log("User profile updated successfully:", updated);
      setUser(updated);
      setShowForm(false);
      alert('Profile updated successfully!');
      setErrorMessage("");
    } catch (error) {
      console.error('Profile update failed', error);
      alert('Failed to update profile. Please try again.');
      setErrorMessage(error.message || 'Failed to update profile. Please try again.');
    }
  };

  // Handler for the user active/inactive toggle
  const handleToggleUserActive = useCallback(async () => {
    // Ensure user object exists and has bactive property before proceeding
    if (!user || typeof user.bactive === 'undefined') {
        console.warn("User data or bactive status not available for toggle.");
        return;
    }

    const newActiveStatus = !user.bactive;
    const token = localStorage.getItem('token');

    if (!newActiveStatus) {
        const confirmDeactivation = window.confirm("Are you sure you want to deactivate this user's account? They will no longer be able to log in.");
        if (!confirmDeactivation) {
            return;
        }
    } else {
        const confirmActivation = window.confirm("Are you sure you want to activate this user's account?");
        if (!confirmActivation) {
            return;
        }
    }

    const updateActivePayload = {
      bactive: newActiveStatus,
    };
    console.log(`Attempting to set user active status to: ${newActiveStatus} with payload:`, updateActivePayload);

    try {
      const res = await fetch(`${ENDPOINTS.USER_GET}/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateActivePayload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to set user to ${newActiveStatus ? 'active' : 'inactive'}`);
      }

      setUser(prevUser => ({ ...prevUser, bactive: newActiveStatus }));
      alert(`User account successfully set to ${newActiveStatus ? 'active' : 'inactive'}!`);
    } catch (error) {
      console.error('Failed to update user active status:', error);
      alert(`Failed to change user status: ${error.message}. Please try again.`);
    }
  }, [user, userId]); // Dependencies: 'user' object (to access bactive) and userId


  const handleAssignLead = useCallback(async (leadIdToAssign, assigneeUserId) => {
    const token = localStorage.getItem("token");
    try {
      await axios.post(
        `${ENDPOINTS.LEAD_ASSIGNMENT}`,
        {
          iassigned_by: 6,
          iassigned_to: assigneeUserId,
          ilead_id: leadIdToAssign,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Lead assigned successfully");
    } catch (err) {
      console.error("Failed to assign lead", err);
      alert("Failed to assign lead.");
    }
  }, []);

  // --- Conditional Renders for Loading/Error states must come AFTER all Hooks ---

  // Handle loading state
  if (user === null) {
    return (
      <div className="min-h-screen mt-[-20px] flex items-center justify-center bg-gray-100">
        Loading profile...
      </div>
    );
  }

  // Handle case where user data could not be fetched (e.g., user is empty object due to error)
  if (Object.keys(user).length === 0 && errorMessage) {
    return (
      <div className="min-h-screen mt-[-20px] flex flex-col items-center justify-center bg-gray-100 p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mx-6 mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {errorMessage}</span>
        </div>
        <p className="text-gray-600 mt-2">Please try refreshing the page or check your connection.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen mt-[-40px] flex flex-col">
      <div className="mt-10 me-10">
        <ProfileHeader />
      </div>

      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mx-6 mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {errorMessage}</span>
        </div>
      )}

      <div className="flex mt-[-40px] flex-col md:flex-row gap-6 p-6 flex-grow overflow-hidden items-start">
        {/* Profile Card - Left Section */}
        <div className="w-full md:w-80 lg:w-96 bg-white p-6 rounded-xl shadow relative
                               flex-shrink-0
                               h-fit max-h-[calc(100vh-140px)] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">About</h2>
            <button onClick={openForm} className="text-gray-600 hover:text-gray-800 transition-colors duration-200">
              <FaEdit size={18} />
            </button>
          </div>

          <div className="flex flex-col items-center gap-4 mb-6 md:flex-row md:items-start md:gap-4">
            <img
              src={user.cProfile_pic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.cFull_name)}&background=random&color=fff&rounded=true`}
              alt={`${user.cFull_name}'s avatar`}
              className="w-20 h-20 rounded-full border border-gray-200 object-cover"
            />
            <div className="flex flex-col items-center md:items-start">
              <h3 className="text-2xl font-semibold text-gray-900">{user.cFull_name}</h3>
              {/* Ensure user.bactive is defined before attempting to use it */}
              {user.bactive !== undefined ? (
                <span
                  className={`px-3 py-1 mt-1 rounded-full text-xs font-semibold capitalize flex-shrink-0 ${
                    user.bactive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {user.bactive ? "Active" : "Disabled"}{user.role?.cRole_name ? ` - ${user.role.cRole_name}` : ''}
                </span>
              ) : (
                <span className="text-gray-400 text-xs mt-1">Status/Role unknown</span>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-3 text-gray-700">
            <div className="flex items-center gap-2"><FaEnvelope className="text-gray-500" /> <span>{user.cEmail}</span></div>
            <div className="flex items-center gap-2"><FaIdBadge className="text-gray-500" /> <span>@{user.cUser_name}</span></div>
            <div className="flex items-center gap-2"><FaCalendarAlt className="text-gray-500" /> <span>Joined: {user.dCreate_dt ? new Date(user.dCreate_dt).toLocaleDateString() : 'N/A'}</span></div>
            <div className="flex items-center gap-2"><FaBriefcase className="text-gray-500" /> Job Title: {user.cjob_title || 'Not defined'}</div>
            <div className="flex items-center gap-2"><FaUserTie className="text-gray-500" /> Reports to:
              {user.reports_to
                ? reportToUsers.find(u => u.iUser_id === user.reports_to)?.cFull_name || 'N/A'
                : 'N/A'
              }
            </div>
            <div className="flex items-center gap-2"><FaFingerprint className="text-gray-500" /> User ID: {user.iUser_id}</div>
          </div>

          {/* User Active/Inactive Toggle */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            {/* Render ToggleSwitch only if user data is loaded and bactive is available */}
            {user.bactive !== undefined && (
                <ToggleSwitch
                label="Account Status"
                isChecked={user.bactive}
                onToggle={handleToggleUserActive}
                />
            )}
            <p className="text-xs text-gray-500 mt-2">Toggle to activate or deactivate this user's account.</p>
          </div>

        </div>

        {/* Right Section - Tabs and Tab Content */}
        <div className="w-full md:flex-1 flex flex-col gap-4 min-h-0 max-h-[80vh] overflow-y-auto">
          <div className="flex gap-2 overflow-x-auto pb-2 flex-shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-xl text-sm font-medium border border-slate-600 transition-colors duration-200 whitespace-nowrap
                  ${activeTab === tab ? 'bg-blue-900 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className=" flex-grow overflow-auto min-h-0">
            {activeTab === 'Target' && (
              <div className="h-full overflow-y-auto">
                <div className="p-4 bg-white rounded-xl shadow-md">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">Target Dashboard (Coming Soon!)</h3>
                    <p className="text-gray-600">This section will display user targets and performance metrics.</p>
                </div>
              </div>
            )}
            {activeTab === 'History' && (
              <div className="h-full overflow-y-auto">
                <HistoryDashboard userId={userId} />
              </div>
            )}
            {activeTab === 'Settings' && (
              <div className="h-full overflow-y-auto">
                <SettingsPage userId={userId} />
              </div>
            )}
            {activeTab === 'Achievement' && (
              <div className="h-full overflow-y-auto">
                <AcheivementDashboard userId={userId} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal (conditionally rendered) */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl relative animate-fade-in-up">
            <button onClick={() => setShowForm(false)} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl">✖</button>
            <h3 className="text-2xl font-semibold mb-6 text-gray-800">Edit Profile</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative">
                <FaUser className="absolute top-3 left-3 text-gray-500" />
                <input
                  type="text"
                  name="cFull_name"
                  placeholder="Full Name"
                  value={formData.cFull_name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-3 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                  required
                />
              </div>
              <div className="relative">
                <FaIdBadge className="absolute top-3 left-3 text-gray-500" />
                <input
                  type="text"
                  name="cUser_name"
                  placeholder="Username"
                  value={formData.cUser_name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-3 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                  required
                />
              </div>
              <div className="relative">
                <FaEnvelope className="absolute top-3 left-3 text-gray-500" />
                <input
                  type="email"
                  name="cEmail"
                  placeholder="Email"
                  value={formData.cEmail}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-3 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                  required
                />
              </div>
              <div className="relative">
                <FaBriefcase className="absolute top-3 left-3 text-gray-500" />
                <input
                  type="text"
                  name="cjob_title"
                  placeholder="Job Title"
                  value={formData.cjob_title}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-3 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
              <div className="relative">
                <FaUserTie className="absolute top-3 left-3 text-gray-500" />
                <select
                  name="reports_to"
                  value={formData.reports_to}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-3 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white"
                >
                  <option value="">Select Reports To</option>
                  {reportToUsers.map(u => (
                    <option key={u.iUser_id} value={u.iUser_id}>
                      {u.cFull_name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full p-3 bg-gray-800 text-white rounded-full hover:bg-gray-900 transition-colors duration-200 font-semibold"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfile;