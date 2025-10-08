
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ENDPOINTS } from '../../src/api/constraints';
import ProfileHeader from '../Components/common/ProfileHeader';
import SettingsPage from './userPage/settingsPage';
import HistoryDashboard from './userPage/historyPage';
import TargetDashboard from './userPage/TargetPage';
import AcheivementDashboard from './userPage/acheivementPage';
import UserCallLogs from './userPage/userCallLogs';
import UserLead from '../pages/userPage/userLead'
import DCRMSettingsForm from './userPage/DCRMsettingsForm';
import UserDashboard from './userPage/userOverview'; 
import {
  FaEdit, FaUser, FaEnvelope, FaIdBadge, FaBriefcase, FaUserTie,
  FaUserCircle, FaCheckCircle, FaTimesCircle, FaPhone, FaMobile,
  FaGlobe, FaWhatsapp, FaEnvelopeOpen
} from 'react-icons/fa';

const OverviewDashboard = ({ userId }) => (
    <div className="text-center p-10">
        <FaChartLine size={50} className="text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">User Overview Dashboard</h2>
        <p className="text-gray-600">Summary and key metrics for user ID: {userId}</p>
        <div className="mt-4 p-4 bg-gray-50 border rounded-lg">
            <p className="text-sm text-gray-500">This area shows an aggregate view of the user's performance.</p>
        </div>
    </div>
);

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

// Reusable MessageDisplay component
const MessageDisplay = ({ message, type, onClose }) => {
  if (!message) return null;

  const bgColor = type === 'success' ? 'bg-green-100' : 'bg-red-100';
  const textColor = type === 'success' ? 'text-green-700' : 'text-red-700';
  const Icon = type === 'success' ? FaCheckCircle : FaTimesCircle;

  return (
    <div className={`mb-4 p-3 rounded-lg text-sm flex items-center shadow-md ${bgColor} ${textColor}`}>
      <Icon className="h-5 w-5 mr-2" />
      <span>{message}</span>
      <button onClick={onClose} className="ml-auto text-current hover:opacity-75">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

// Reusable ConfirmationModal component
const ConfirmationModal = ({ message, onConfirm, onCancel, title = "Confirm Action" }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
    <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl relative">
      <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
      <p className="text-gray-700 mb-6">{message}</p>
      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
);

const tabs = ['Overview', 'Target', 'History', 'Settings', 'Achievement', 'Call Logs', 'User Leads'];

const UserProfile = ({ settingsData, isLoadingSettings = false}) => {
  const { userId } = useParams();
  const token = localStorage.getItem('token'); 
  const [email, setEmail] = useState('');
  const [user, setUser] = useState(null);
  // const [activeTab, setActiveTab] = useState('Target');
  const [activeTab, setActiveTab] = useState('Overview');
  const [showForm, setShowForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    cFull_name: '',
    cUser_name: '',
    cEmail: '',
    cjob_title: '',
    cRole_name:'',
    // reports_to: '',
    i_bPhone_no: '', 
    iphone_no: '',
    bactive: true,
    mail_access: false,
    phone_access: false,
    website_access: false,
    whatsapp_access: false
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [reportToUsers, setReportToUsers] = useState([]);
  const [isProfileCardVisible, setIsProfileCardVisible] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDCRMForm, setShowDCRMForm] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState('');
  const [confirmModalAction, setConfirmModalAction] = useState(null);

const showAppMessage = (message, type = 'success') => {
  if (type === 'success') {
    setSuccessMessage(message);
    setErrorMessage('');
  } else {
    setErrorMessage(message);
    setSuccessMessage('');
  }
  setTimeout(() => {
    setSuccessMessage('');
    setErrorMessage('');
  }, 5000);
};


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
        setEmail(data.cEmail);

        if (!response.ok) throw new Error(data.message);
       
        // Ensure that the user state is updated with the fetched data
        setUser(data);

        setEditFormData({
          cFull_name: data.cFull_name || '',
          cUser_name: data.cUser_name || '',
          cEmail: data.cEmail || '',
          cjob_title: data.cjob_title || '',
          reports_to: data.reports_to || '',
          i_bPhone_no: data.i_bPhone_no || '', 
          iphone_no: data.iphone_no || '',
          mail_access: data.mail_access || false,
          phone_access: data.phone_access || false,
          website_access: data.website_access || false,
          whatsapp_access: data.whatsapp_access || false
        });
      } catch (err) {
        showAppMessage(err.message, 'error');
      }
    };
    if (userId) fetchUser();
  }, [userId]);

  useEffect(() => {
      if (settingsData) {
        console.log("User Profile received settings:", settingsData);
            }
    }, [settingsData]);
  
    if (isLoadingSettings) {
      return <div>Loading settings...</div>;
    }
  
  useEffect(() => {
    console.log("User Profile settings from parent:", settingsData);
  }, [settingsData]);
  

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
        const filtered = data.filter(u => u.iUser_id !== parseInt(userId) && u.bactive === true);
        setReportToUsers(filtered);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAllUsers();
  }, [userId]);

  // Handler for the new 'User Status' toggle
  const handleToggleUserActive = useCallback(() => {
    if (!user || typeof user.bactive === 'undefined') {
      console.warn("User data or bactive status not available for toggle.");
      return;
    }

    const newStatus = !user.bactive;
    const message = newStatus
      ? "Are you sure you want to activate this user's account?"
      : "Are you sure you want to deactivate this user's account? They will no longer be able to log in.";

    setConfirmModalMessage(message);
    setConfirmModalAction(() => async () => {
      try {
        const token = localStorage.getItem('token');
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
        showAppMessage(`User account successfully set to ${newStatus ? 'active' : 'inactive'}!`, 'success');
      } catch (err) {
        console.error(err);
        showAppMessage(`Failed to change user status: ${err.message}. Please try again.`, 'error');
      } finally {
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  }, [user, userId]);

  const handleToggleDCRM = useCallback(() => {
    if (!user) return;
    if (user.DCRM_enabled) {
      setConfirmModalMessage("Are you sure you want to disable DCRM for this user?");
      setConfirmModalAction(() => async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${ENDPOINTS.DCRM_DISABLE}/${userId}`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) throw new Error('Failed to disable DCRM');
          setUser(prev => ({ ...prev, DCRM_enabled: false }));
          showAppMessage('DCRM disabled successfully!', 'success');
        } catch (err) {
          console.error(err);
          showAppMessage(`Error disabling DCRM: ${err.message}`, 'error');
        } finally {
          setShowConfirmModal(false);
        }
      });
      setShowConfirmModal(true);
    } else {
      setShowDCRMForm(true);
    }
  }, [user, userId]);

  const handleDCRMSuccess = useCallback(() => {
    setUser(prev => ({ ...prev, DCRM_enabled: true }));
    setShowDCRMForm(false);
    showAppMessage('DCRM user created and settings configured successfully!', 'success');
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setEditFormData((prev) => ({
      ...prev,
      [name]: 
        type === "checkbox"
          ? checked
          : name === "reports_to"
            ? value === "" ? null : parseInt(value)
            : value,
    }));
  };




 const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    const token = localStorage.getItem("token");
    const payload = {
      ...editFormData,
      reports_to: editFormData.reports_to === "" ? null : editFormData.reports_to,
    };

    const res = await fetch(`${ENDPOINTS.USER_GET}/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const updated = await res.json();

    if (!res.ok) throw new Error(updated.message || "Failed to update profile");

    setUser(updated);
    setShowForm(false);
    showAppMessage("Profile updated successfully!", "success");
  } catch (err) {
    console.error(err);
    showAppMessage(`Failed to update profile: ${err.message}`, "error");
  } finally {
    setIsSubmitting(false);
  }
};

  const handleFormClose = () => {
    setEditFormData({
      cFull_name: user.cFull_name || '',
      cUser_name: user.cUser_name || '',
      cEmail: user.cEmail || '',
      cjob_title: user.cjob_title || '',
      reports_to: user.reports_to || '',
      i_bPhone_no: user.c_bPhone_no || '', 
      irole_id: user.irole_id || '',
      iphone_no: user.iphone_no || '',
      mail_access: user.mail_access || false,
      phone_access: user.phone_access || false,
      website_access: user.website_access || false,
      whatsapp_access: user.whatsapp_access || false
    });
    setShowForm(false);
  };

   useEffect(() => {
      if (settingsData) {
        console.log("ProfileCard received settings:", settingsData);
            }
    }, [settingsData]);
  
    if (isLoadingSettings) {
      return <div>Loading settings...</div>;
    }
  
  useEffect(() => {
    console.log("Profile settings from parent:", settingsData);
  }, [settingsData]);
  

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        <p className="ml-3 text-gray-700">Loading user profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <ProfileHeader />

      <MessageDisplay message={errorMessage} type="error" onClose={() => setErrorMessage('')} />
      <MessageDisplay message={successMessage} type="success" onClose={() => setSuccessMessage('')} />

      <div className="flex items-center gap-4 flex-wrap mt-6">
        {isProfileCardVisible ? (
          <div className="bg-white p-4 rounded-xl shadow flex flex-col gap-4"> 
            <div className="flex items-center gap-4">
              <FaUserCircle size={60} className="text-blue-600" />
              <div className="flex-grow">
                <h3 className="text-lg font-semibold text-gray-800">{user.cFull_name}</h3>
                <p className="text-sm text-gray-600">@{user.cUser_name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2"> 
                  {user.bactive !== undefined && (
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize inline-block ${
                      user.bactive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.bactive ? 'Active' : 'Disabled'}{user.role?.cRole_name ? ` - ${user.role.cRole_name}` : ''}
                    </span>
                  )}

                  {user.DCRM_enabled && (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 inline-block">
                      DCRM Enabled
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 self-start"> 
              <button
                onClick={() => setIsProfileCardVisible(false)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium border border-blue-600 px-3 py-1 rounded-lg transition-colors"
              >
                Collapse
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="text-gray-600 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-colors border border-gray-300"
                aria-label="Edit Profile"
              >
                <FaEdit size={18} />
              </button>
            </div>
          </div>
        ) : (
          <FaUserCircle
            size={60}
            className="text-blue-600 hover:text-blue-800 cursor-pointer transition-colors"
            onClick={() => setIsProfileCardVisible(true)}
            aria-label="Expand Profile Card"
          />
        )}
        {/* {isProfileCardVisible ? (
          <div className="bg-white p-4 rounded-xl shadow flex items-center gap-4">
            <FaUserCircle size={60} className="text-blue-600" />
            <div className="flex-grow">
              <h3 className="text-lg font-semibold text-gray-800">{user.cFull_name}</h3>
              <p className="text-sm text-gray-600">@{user.cUser_name}</p>
              {user.bactive !== undefined && (
                <span className={`px-2 py-1 mt-1 rounded-full text-xs font-semibold capitalize inline-block ${
                  user.bactive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {user.bactive ? 'Active' : 'Disabled'}{user.role?.cRole_name ? ` - ${user.role.cRole_name}` : ''}
                </span>
              )}

              
              {user.DCRM_enabled && (
                <span className="ml-2 px-2 py-1 mt-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 inline-block">
                  DCRM Enabled
                </span>
              )}
            </div>
            <div className="ml-auto flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setIsProfileCardVisible(false)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Collapse
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="text-gray-600 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Edit Profile"
              >
                <FaEdit size={18} />
              </button>
            </div>
          </div>
        ) : (
          <FaUserCircle
            size={60}
            className="text-blue-600 hover:text-blue-800 cursor-pointer transition-colors"
            onClick={() => setIsProfileCardVisible(true)}
            aria-label="Expand Profile Card"
          />
        )} */}

        <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium border border-gray-300 transition-colors duration-200 shadow-sm ${
                activeTab === tab ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-grow mt-6">
         {/* UserDashboard */}
        {activeTab === 'Overview' && (
          <div className="p-4 bg-white rounded-xl shadow-md">
            {/* <UserDashboard profileUserId={userId} />  */}
<UserDashboard userId={userId} />
            {/* <UserDashboard />  */}
          </div>
        )}

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
        {activeTab === 'Call Logs' && (
          <div className="p-4 bg-white rounded-xl shadow-md">
            <UserCallLogs userId={email} />
          </div>
        )}

       {activeTab === 'User Leads' && (
        <div className="p-4 bg-white rounded-xl shadow-md">
          <UserLead userId={userId} token={token} />
        </div>
      )}
    </div>

      {showForm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4"
          onClick={handleFormClose} 
        >
        <div 
          className="bg-white rounded-xl p-6 w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 mt-10 max-h-[90vh] overflow-y-auto shadow-2xl relative mb-10"
          onClick={(e) => e.stopPropagation()} 
        >
      <button
        onClick={handleFormClose}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors rounded-full p-1 hover:bg-gray-100"
        aria-label="Close"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
            <h3 className="text-2xl font-bold text-center text-gray-800 mb-6">Edit Profile</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className="relative">
                  <FaUser className="absolute top-4 left-3 text-gray-500" />
                  <input
                    type="text"
                    name="cFull_name"
                    placeholder="Full Name"
                    value={editFormData.cFull_name}
                    onChange={handleChange}
                    className="w-full border p-3 pl-10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    required
                    maxLength={40}
                  />
                </div>
                <div className="relative">
                  <FaIdBadge className="absolute top-4  left-3 text-gray-500" />
                  <input
                    type="text"
                    name="cUser_name"
                    placeholder="Username"
                    value={editFormData.cUser_name}
                    onChange={handleChange}
                    className="w-full border p-3 pl-10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    required
                    maxLength={40}
                  />
                </div>
              </div>
              
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className="relative">
                  <FaEnvelope className="absolute top-4 left-3 text-gray-500" />
                  <input
                    type="email"
                    name="cEmail"
                    placeholder="Email"
                    value={editFormData.cEmail}
                    onChange={handleChange}
                    className="w-full border p-3 pl-10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    required
                    maxLength={40}
                  />
                </div>

                <div className="relative">
                  <FaBriefcase className="absolute top-4 left-3 text-gray-500" />
                  <input
                    type="text"
                    name="cjob_title"
                    placeholder="Job Title"
                    value={editFormData.cjob_title}
                    onChange={handleChange}
                    className="w-full border p-3 pl-10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    maxLength={40}
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
               <div className="relative">
  <FaUserTie className="absolute top-4 left-3 text-gray-500" />
  <select
    name="reports_to"
    value={editFormData.reports_to}
    onChange={handleChange}
    className="w-full border p-3 pl-10 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
  >
    <option value="">Select Reports To</option>
    {reportToUsers.map(u => (
      <option key={u.iUser_id} value={u.iUser_id}>
        {u.cFull_name}
      </option>
    ))}
  </select>
  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z"/>
    </svg>
  </div>
</div>

                <div className="relative">
                  <FaPhone className="absolute top-4 left-3 text-gray-500" />
                  <input
                    type="text"
                    name="iphone_no"
                    placeholder="Personal Phone"
                    value={editFormData.iphone_no}
                    onChange={handleChange}
                    className="w-full border p-3 pl-10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    maxLength={15}
                  />
                </div>
              </div>
              

             <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>

                {/* <div className="relative">
                  <FaPhone className="absolute top-4 left-3 text-gray-500" />
                  <input
                    type="text"
                    name="Role"
                    placeholder="Personal Phone"
                    value={editFormData.irole_id}
                    onChange={handleChange}
                    className="w-full border p-3 pl-10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    maxLength={15}
                  />
                </div> */}
                
              </div>
{/* 
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Access Permissions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="mail_access"
                      name="mail_access"
                      checked={editFormData.mail_access}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="mail_access" className="ml-2 block text-sm text-gray-700 flex items-center">
                      <FaEnvelopeOpen className="mr-1" /> Mail Access
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="phone_access"
                      name="phone_access"
                      checked={editFormData.phone_access}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="phone_access" className="ml-2 block text-sm text-gray-700 flex items-center">
                      <FaPhone className="mr-1" /> Phone Access
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="website_access"
                      name="website_access"
                      checked={editFormData.website_access}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="website_access" className="ml-2 block text-sm text-gray-700 flex items-center">
                      <FaGlobe className="mr-1" /> Website Access
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="whatsapp_access"
                      name="whatsapp_access"
                      checked={editFormData.whatsapp_access}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="whatsapp_access" className="ml-2 block text-sm text-gray-700 flex items-center">
                      <FaWhatsapp className="mr-1" /> WhatsApp Access
                    </label>
                  </div>
                </div>
              </div> */}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <ToggleSwitch
                  label="User Status"
                  isChecked={user.bactive}
                  onToggle={handleToggleUserActive}
                />
                <p className="text-xs text-gray-500 mt-2">Toggle to activate or deactivate this user's account.</p>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <ToggleSwitch
                  label="DCRM Enable"
                  isChecked={user.DCRM_enabled || false}
                  onToggle={handleToggleDCRM}
                />
                <p className="text-xs text-gray-500 mt-2">Toggle to enable/disable DCRM integration.</p>
              </div>

              <div className="flex justify-center mt-6">
                <button
                  type="submit"
                  className={`w-[150px] p-3 text-white justify-center rounded-xl font-medium transition-colors transform hover:scale-105 active:scale-95 shadow-md ${
                    isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-blue-700'
                  }`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDCRMForm && (
        <DCRMSettingsForm
          userId={userId}
          userProfile={user}
          onClose={() => setShowDCRMForm(false)}
          onSuccess={(createdUser) => {
            setUser(prev => ({ ...prev, DCRM_enabled: true }));
            setShowDCRMForm(false);
            showAppMessage('DCRM user created successfully!', 'success');
          }}
        />
      )}
      {showConfirmModal && (
        <ConfirmationModal
          message={confirmModalMessage}
          onConfirm={confirmModalAction}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
    </div>
  );
};

export default UserProfile;
