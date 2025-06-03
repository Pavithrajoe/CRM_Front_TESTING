// src/pages/UserProfile.js
import React, { useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import ProfileHeader from '../Components/common/ProfileHeader';
import { ENDPOINTS } from '../api/constraints';
import {
  FaEdit,
  FaEye,
  FaEyeSlash,
  FaFingerprint,
  FaUser,
  FaEnvelope,
  FaIdBadge,
  FaCalendarAlt,
  FaKey,
  FaBriefcase,
  FaUserTie,
} from 'react-icons/fa';

const tabs = ['Target', 'History', 'Settings', 'Achievement'];

const UserProfile = () => {
  const { id } = useParams(); // Get user ID from URL
  const { user: loggedInUser } = useContext(UserContext); // logged-in user (optional)
  const [user, setUser] = useState(null); // user profile data fetched by id
  const [activeTab, setActiveTab] = useState('Target');
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('token');

    const fetchUser = async () => {
      try {
        const res = await fetch(`${ENDPOINTS.USERS}/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error('Failed to fetch user');

        const data = await res.json();
        setUser(data);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };

    fetchUser();
  }, [id]);

  useEffect(() => {
    if (user) {
      setFormData({
        cFull_name: user.cFull_name || '',
        cUser_name: user.cUser_name || '',
        cEmail: user.cEmail || '',
        cPassword: '',
        reports_to: user.reports_to || '',
        cjob_title: user.cjob_title || '',
      });
    }
  }, [user]);

  if (!user) {
    return <div>Loading profile...</div>;
  }

  const openForm = () => setShowForm(true);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${ENDPOINTS.USERS}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Update failed');

      const data = await res.json();
      setUser(data);
      setShowForm(false);
    } catch (error) {
      console.error('Update failed', error);
    }
  };

  return (
    <>
      <ProfileHeader />
      <div className="flex flex-col md:flex-row gap-6 p-6">
        {/* Profile Card */}
        <div className="w-full md:w-1/3 bg-white p-6 rounded-xl shadow relative">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Profile</h2>
            <button onClick={openForm} className="text-black hover:text-blue-800">
              <FaEdit size={18} />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <img
              src={user.cProfile_pic || '/nav/profile.png'}
              alt="avatar"
              className="w-20 h-20 rounded-full border object-cover"
            />
            <div className="flex items-center gap-2">
              <FaUser /> <span>{user.cFull_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaEnvelope /> <span>{user.cEmail}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaIdBadge /> <span>@{user.cUser_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCalendarAlt />
              <span>Joined: {new Date(user.dCreate_dt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaBriefcase /> Job Title: {user.cjob_title || 'Not defined'}
            </div>
            <div className="flex items-center gap-2">
              <FaUserTie /> Reports to: {user.reports_to || 'N/A'}
            </div>
            <div className="flex items-center gap-2">
              <FaFingerprint /> User ID: {user.iUser_id}
            </div>
          </div>
        </div>

        {/* Right Tabs */}
        <div className="w-full md:w-2/3 bg-white p-6 rounded-xl shadow">
          <div className="mb-4 flex gap-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full ${
                  activeTab === tab ? 'bg-black text-white' : 'bg-gray-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-4 min-h-[150px]">
            {activeTab === 'Target' && (
              <div>
                <h3 className="text-lg font-semibold mb-2">🎯 Your Target</h3>
                <p>Track goals, KPIs and milestones here.</p>
              </div>
            )}
            {activeTab === 'History' && (
              <div>
                <h3 className="text-lg font-semibold mb-2">📜 Activity History</h3>
                <p>Your past activity and timeline.</p>
              </div>
            )}
            {activeTab === 'Settings' && (
              <div>
                <h3 className="text-lg font-semibold mb-2">⚙️ Account Settings</h3>
                <p>Adjust preferences, notifications, and privacy.</p>
              </div>
            )}
            {activeTab === 'Achievement' && (
              <div>
                <h3 className="text-lg font-semibold mb-2">🏆 Achievements</h3>
                <p>Your badges, completed goals, and recognitions.</p>
              </div>
            )}
          </div>
        </div>

        {/* Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl relative">
              <button
                onClick={() => setShowForm(false)}
                className="absolute top-2 right-2 text-gray-600"
              >
                ✖
              </button>
              <h3 className="text-lg font-semibold mb-4">Edit Profile</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div className="relative">
                  <FaUser className="absolute top-3 left-3 text-gray-500" />
                  <input
                    type="text"
                    name="cFull_name"
                    placeholder="Full Name"
                    value={formData.cFull_name}
                    onChange={handleChange}
                    className="w-full border p-2 pl-10 rounded"
                  />
                </div>

                {/* Username */}
                <div className="relative">
                  <FaIdBadge className="absolute top-3 left-3 text-gray-500" />
                  <input
                    type="text"
                    name="cUser_name"
                    placeholder="Username"
                    value={formData.cUser_name}
                    onChange={handleChange}
                    className="w-full border p-2 pl-10 rounded"
                  />
                </div>

                {/* Email */}
                <div className="relative">
                  <FaEnvelope className="absolute top-3 left-3 text-gray-500" />
                  <input
                    type="email"
                    name="cEmail"
                    placeholder="Email"
                    value={formData.cEmail}
                    onChange={handleChange}
                    className="w-full border p-2 pl-10 rounded"
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <FaKey className="absolute top-3 left-3 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="cPassword"
                    placeholder="Password"
                    value={formData.cPassword}
                    onChange={handleChange}
                    className="w-full border p-2 pl-10 pr-10 rounded"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-500"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                {/* Job Title */}
                <div className="relative">
                  <FaBriefcase className="absolute top-3 left-3 text-gray-500" />
                  <input
                    type="text"
                    name="cjob_title"
                    placeholder="Job Title"
                    value={formData.cjob_title}
                    onChange={handleChange}
                    className="w-full border p-2 pl-10 rounded"
                  />
                </div>

                {/* Reports To */}
                <div className="relative">
                  <FaUserTie className="absolute top-3 left-3 text-gray-500" />
                  <input
                    type="text"
                    name="reports_to"
                    placeholder="Reports To"
                    value={formData.reports_to}
                    onChange={handleChange}
                    className="w-full border p-2 pl-10 rounded"
                  />
                </div>

                <button
                  type="submit"
                  className="w-[130px] p-2 bg-black text-center text-white py-2 rounded-full hover:bg-blue-900"
                >
                  Save Changes
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UserProfile;
