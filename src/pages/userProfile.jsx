import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ENDPOINTS } from '../../src/api/constraints';
import ProfileHeader from '../Components/common/ProfileHeader';
import SettingsPage from './userPage/settingsPage';
import HistoryDashboard from './userPage/historyPage';
import TargetDashboard from './userPage/TargetPage';
import AcheivementDashboard from './userPage/acheivementPage';
import {
  FaEdit, FaUser, FaEnvelope, FaIdBadge, FaBriefcase, FaUserTie, FaUserCircle
} from 'react-icons/fa';

// Reusable ToggleSwitch component
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
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('Target');
  const [showForm, setShowForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    cFull_name: '',
    cUser_name: '',
    cEmail: '',
    cjob_title: '',
    reports_to: ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [reportToUsers, setReportToUsers] = useState([]);
  const [isProfileCardVisible, setIsProfileCardVisible] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${ENDPOINTS.USER_GET}/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        setUser(data);
        // Initialize edit form data
        setEditFormData({
          cFull_name: data.cFull_name || '',
          cUser_name: data.cUser_name || '',
          cEmail: data.cEmail || '',
          cjob_title: data.cjob_title || '',
          reports_to: data.reports_to || '',
        });
      } catch (err) {
        setErrorMessage(err.message);
      }
    };
    if (userId) fetchUser();
  }, [userId]);

  // Fetch users for 'Reports To'
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(ENDPOINTS.USER_GET, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        const filtered = data.filter(u => u.iUser_id !== parseInt(userId));
        setReportToUsers(filtered);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAllUsers();
  }, [userId]);

  const handleToggleUserActive = useCallback(async () => {
    if (!user || typeof user.bactive === 'undefined') {
      console.warn("User data or bactive status not available for toggle.");
      return;
    }

    const newStatus = !user.bactive;
    const token = localStorage.getItem('token');

    if (!newStatus) {
      const confirmDeactivation = window.confirm("Are you sure you want to deactivate this user's account? They will no longer be able to log in.");
      if (!confirmDeactivation) return;
    } else {
      const confirmActivation = window.confirm("Are you sure you want to activate this user's account?");
      if (!confirmActivation) return;
    }

    try {
      const res = await fetch(`${ENDPOINTS.USER_GET}/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bactive: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update user status');
      setUser(prev => ({ ...prev, bactive: newStatus }));
      alert(`User account successfully set to ${newStatus ? 'active' : 'inactive'}!`);
    } catch (err) {
      console.error(err);
      alert(`Failed to change user status: ${err.message}. Please try again.`);
    }
  }, [user, userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: name === 'reports_to' ? (value === '' ? '' : parseInt(value)) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch(`${ENDPOINTS.USER_GET}/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editFormData),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.message);
      
      setUser(updated);
      setShowForm(false);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormClose = () => {
    // Reset form data to current user data when closing
    setEditFormData({
      cFull_name: user.cFull_name || '',
      cUser_name: user.cUser_name || '',
      cEmail: user.cEmail || '',
      cjob_title: user.cjob_title || '',
      reports_to: user.reports_to || '',
    });
    setShowForm(false);
  };

  if (errorMessage) {
    return <div className="text-red-500 p-4">Error: {errorMessage}</div>;
  }

  if (!user) {
    return <div className="p-10">Loading...</div>;
  }

  return (
    <div className="min-h-screen p-4">
      <ProfileHeader />

      {/* Top Section - Profile & Tabs */}
      <div className="flex items-center gap-4 flex-wrap mt-6">
        {isProfileCardVisible ? (
          <div className="bg-white p-4 rounded-xl shadow flex items-center gap-4">
            <FaUserCircle size={60} className="text-gray-500" />
            <div>
              <h3 className="text-lg font-semibold">{user.cFull_name}</h3>
              <p className="text-sm text-gray-600">@{user.cUser_name}</p>
              {user.bactive !== undefined && (
                <span className={`px-2 py-1 mt-1 rounded-full text-xs font-semibold capitalize inline-block ${
                  user.bactive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {user.bactive ? 'Active' : 'Disabled'}{user.role?.cRole_name ? ` - ${user.role.cRole_name}` : ''}
                </span>
              )}
            </div>
            <div className="ml-auto flex gap-2">
              <button 
                onClick={() => setIsProfileCardVisible(false)} 
                className="text-blue-600 hover:text-gray-800"
              >
                Collapse
              </button>
              <button 
                onClick={() => setShowForm(true)} 
                className="text-gray-600 hover:text-gray-800"
              >
                <FaEdit />
              </button>
            </div>
          </div>
        ) : (
          <FaUserCircle
            size={60}
            className="text-gray-500 hover:text-gray-700 cursor-pointer"
            onClick={() => setIsProfileCardVisible(true)}
          />
        )}

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-xl text-sm font-medium border border-slate-600 transition-colors duration-200
                ${activeTab === tab ? 'bg-blue-900 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-grow mt-4">
        {activeTab === 'Target' && (
          <div className="p-4 bg-white rounded-xl shadow-md">
            <TargetDashboard userId={userId} />
          </div>
        )}
        {activeTab === 'History' && (
          <div className="p-4 bg-white rounded-xl shadow-md">
            <HistoryDashboard userId={userId} />
          </div>
        )}
        {activeTab === 'Settings' && (
          <div className="p-4 bg-white rounded-xl shadow-md">
            <SettingsPage userId={userId} />
          </div>
        )}
        {activeTab === 'Achievement' && (
          <div className="p-4 bg-white rounded-xl shadow-md">
            <AcheivementDashboard userId={userId} />
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl relative">
            <button 
              onClick={handleFormClose} 
              className="absolute top-3 right-3 text-xl hover:text-gray-600"
            >
              ✖
            </button>
            <h3 className="text-2xl font-semibold mb-6">Edit Profile</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative">
                <FaUser className="absolute top-3 left-3 text-gray-500" />
                <input
                  type="text"
                  name="cFull_name"
                  placeholder="Full Name"
                  value={editFormData.cFull_name}
                  onChange={handleChange}
                  className="w-full border p-3 pl-10 rounded-lg"
                  required
                  maxLength={40}
                />
              </div>
              <div className="relative">
                <FaIdBadge className="absolute top-3 left-3 text-gray-500" />
                <input
                  type="text"
                  name="cUser_name"
                  placeholder="Username"
                  value={editFormData.cUser_name}
                  onChange={handleChange}
                  className="w-full border p-3 pl-10 rounded-lg"
                  required
                  maxLength={40}
                />
              </div>
              <div className="relative">
                <FaEnvelope className="absolute top-3 left-3 text-gray-500" />
                <input
                  type="email"
                  name="cEmail"
                  placeholder="Email"
                  value={editFormData.cEmail}
                  onChange={handleChange}
                  className="w-full border p-3 pl-10 rounded-lg"
                  required
                  maxLength={40}
                />
              </div>
              
              <div className="relative">
                <FaBriefcase className="absolute top-3 left-3 text-gray-500" />
                <input
                  type="text"
                  name="cjob_title"
                  placeholder="Job Title"
                  value={editFormData.cjob_title}
                  onChange={handleChange}
                  className="w-full border p-3 pl-10 rounded-lg"
                  maxLength={40}
                />
              </div>
              <div className="relative">
                <FaUserTie className="absolute top-3 left-3 text-gray-500" />
                <select
                  name="reports_to"
                  value={editFormData.reports_to}
                  onChange={handleChange}
                  className="w-full border p-3 pl-10 rounded-lg"
                >
                  <option value="">Select Reports To</option>
                  {reportToUsers.map(u => (
                    <option key={u.iUser_id} value={u.iUser_id}>
                      {u.cFull_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* User Active/Inactive Toggle inside the edit modal */}
              {user.bactive !== undefined && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <ToggleSwitch
                    label="Account Status"
                    isChecked={user.bactive}
                    onToggle={handleToggleUserActive}
                  />
                  <p className="text-xs text-gray-500 mt-2">Toggle to activate or deactivate this user's account.</p>
                </div>
              )}

              <button
                type="submit"
                className={`w-full p-3 text-white rounded-full ${
                  isSubmitting ? 'bg-gray-500' : 'bg-gray-800 hover:bg-gray-900'
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;