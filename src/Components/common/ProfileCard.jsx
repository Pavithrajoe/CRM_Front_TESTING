import React, { useEffect, useState } from "react";
import {
  FiEdit,
  FiPhone,
  FiMail,
  FiMapPin,
  FiUpload,
  FiSave,
  FiEye,
  FiX,
  FiMove,
  FiCodesandbox,
} from "react-icons/fi";
import { TbWorld } from "react-icons/tb";
import axios from "axios";
import { useParams } from "react-router-dom";
import Loader from "./Loader";

const apiEndPoint = import.meta.env.VITE_API_URL;

const EditProfileForm = ({ profile, onClose, onSave }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (profile) {
      setFormData({ ...profile });
    }
  }, [profile]);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-black"
        >
          <FiX size={20} />
        </button>
        <h3 className="text-xl font-bold mb-4">Edit Lead Profile</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="clead_name" className="block text-sm font-medium text-gray-700">Name:</label>
            <input
              type="text"
              id="clead_name"
              name="clead_name"
              value={formData.clead_name || ""}
              onChange={handleFieldChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="corganization" className="block text-sm font-medium text-gray-700">Organization:</label>
            <input
              type="text"
              id="corganization"
              name="corganization"
              value={formData.corganization || ""}
              onChange={handleFieldChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="iphone_no" className="block text-sm font-medium text-gray-700">Phone:</label>
            <input
              type="text"
              id="iphone_no"
              name="iphone_no"
              value={formData.iphone_no || ""}
              onChange={handleFieldChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="cemail" className="block text-sm font-medium text-gray-700">Email:</label>
            <input
              type="email"
              id="cemail"
              name="cemail"
              value={formData.cemail || ""}
              onChange={handleFieldChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
            />
          </div>
          {/* Add other editable fields here */}
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleSave}
              className="bg-black text-white px-4 py-2 rounded flex items-center gap-1 text-sm"
            >
              
              Save
            </button>
            <button
              onClick={onClose}
              className="bg-gray-300 text-black px-4 py-2 rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileCard = () => {
  const { leadId } = useParams();
  const [history, setHistory] = useState([]);
  const [profile, setProfile] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); 
  const [showDetails, setShowDetails] = useState(false);
  const [users, setUsers] = useState([]);
  const [editSuccess, setEditSuccess] = useState(false);

  useEffect(() => {
    const fetchLeadDetails = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");

      try {
        const response = await axios.get(`${apiEndPoint}/lead/${leadId}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });
        setProfile(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load lead details", err);
        setError("Failed to load lead details.");
        setLoading(false);
      }
    };

    const fetchHistory = async () => {
      try {
        const response = await axios.get(
          `${apiEndPoint}/lead/${leadId}/history`,
          {
            headers: {
              "Content-Type": "application/json",
              ...(localStorage.getItem("token") && {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              }),
            },
          }
        );
        setHistory(response.data);
      } catch (err) {
        console.error("Failed to load lead history", err);
      }
    };

    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${apiEndPoint}/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUsers(res.data);
      } catch (err) {
        console.error("Failed to load users", err);
      }
    };

    if (leadId) {
      fetchLeadDetails();
      fetchHistory();
      fetchUsers();
    }
  }, [leadId]);

  const handleEditProfile = () => {
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditSuccess(false); // Reset success message on close
  };

  const handleSaveProfile = async (updatedFormData) => {
    const token = localStorage.getItem("token");
    try {
      await axios.put(`${apiEndPoint}/lead/${leadId}`, updatedFormData, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      setEditSuccess(true);
      setIsEditModalOpen(false);
      setProfile(updatedFormData);

   
      setHistory([
        {
          date: new Date().toLocaleString(),
          updatedProfile: updatedFormData,
        },
        ...history, 
      ]);
    } catch (err) {
      console.error("Failed to save profile", err);
      alert("Failed to save profile.");
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfile((prev) => ({ ...prev, avatar: imageUrl }));

      const formData = new FormData();
      formData.append("avatar", file);
      const token = localStorage.getItem("token");

      try {
        await axios.post(
          `${apiEndPoint}/lead/${leadId}/upload-avatar`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          }
        );
        alert("Profile picture updated.");
        // No need to refetch the entire profile here, just the avatar is updated.
      } catch (err) {
        console.error("Failed to upload avatar", err);
        alert("Failed to upload avatar.");
      }
    }
  };

  const handleAssignLead = async (e) => {
    const userId = e.target.value;
    const token = localStorage.getItem("token");
    try {
      await axios.post(
        `${apiEndPoint}/assigned-to`,
        {
          iassigned_by: 6,
          iassigned_to: Number(userId),
          ilead_id: Number(leadId),
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("Lead assigned successfully.");
    } catch (err) {
      console.error("Failed to assign lead", err);
      alert("Failed to assign lead.");
    }
  };

  if (loading) return <Loader />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!profile) return <div>No profile data found.</div>;

  return (
    <div className="max-w-xl p-4 rounded-xl bg-white shadow space-y-6 relative">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Lead Details</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowDetails(true)}>
            <FiEye className="w-5 h-5 text-gray-600 hover:text-black" />
          </button>
          <button onClick={handleEditProfile}>
            <FiEdit className="w-5 h-5 text-gray-600 hover:text-black" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-14 h-14">
          <img
            src={profile.avatar || "https://i.pravatar.cc/100?img=1"}
            alt="Avatar"
            className="w-14 h-14 rounded-full object-cover"
          />
          <label className="absolute -bottom-2 -right-2 bg-white p-1 rounded-full shadow cursor-pointer">
            <FiUpload className="w-4 h-4 text-gray-600" />
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </label>
        </div>
        <div>
          <h3 className="text-sm font-bold">{profile.clead_name || "N/A"}</h3>
          <p className="text-xs text-gray-500">
            {profile.corganization || "N/A"}
          </p>
        </div>
      </div>

      <div className="text-sm space-y-2">
        <div className="flex items-center gap-2">
          <FiPhone className="text-gray-500" />
          {profile.iphone_no || "N/A"}
        </div>
        <div className="flex items-center gap-2">
          <FiMail className="text-gray-500" />
          {profile.cemail || "N/A"}
        </div>
        <div className="flex items-start gap-2">
          <FiMapPin className="text-gray-500 mt-1" />
          {profile.caddress || "N/A"}
        </div>
        <div className="flex items-start gap-2">
          <TbWorld className="text-gray-500 mt-1" />
          {profile.cwebsite || "N/A"}
        </div>
        <div className="flex items-start gap-2">
          <FiMove className="text-gray-500 mt-1" />
          {profile?.status || "N/A"}
        </div>
        <div className="flex items-start gap-2">
          <FiCodesandbox className="text-gray-500 mt-1" />
          {profile.dcreated_at || "N/A"}
        </div>

         {profile.bactive === false && (
            <div className="bg-red-100 text-red-700 px-4 py-2 rounded text-sm font-semibold text-center">
              LOST
            </div>
          )}


       <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
  <label
    htmlFor="assignUser"
    className="text-sm font-semibold text-gray-700 min-w-[70px]"
  >
    Assign to :
  </label>
  <div className="relative w-full sm:w-64">
    <select
      id="assignUser"
      className="appearance-none w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm text-gray-800 bg-white shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition duration-200"
      onChange={handleAssignLead}
      defaultValue=""
    >
      <option value="" disabled>
        Users
      </option>
      {users.map((user) => (
        <option key={user.iUser_id} value={user.iUser_id}>
          {user.cUser_name}
        </option>
      ))}
    </select>

    {/* Chevron icon */}
    <div className="pointer-events-none absolute top-2.5 right-3 text-gray-400">
      <svg
        className="w-4 h-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
</div>

      </div>

      {editSuccess && (
        <div className="text-green-500">Profile updated successfully!</div>
      )}

      {isEditModalOpen && profile && (
        <EditProfileForm
          profile={profile}
          onClose={handleCloseEditModal}
          onSave={handleSaveProfile}
        />
      )}

      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-xl relative">
            <button
              onClick={() => setShowDetails(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-black"
            >
              <FiX size={20} />
            </button>

            {/* Banner for Lost Lead */}
   

            <h3 className="text-xl font-bold mb-4">Profile Details</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FiPhone className="text-gray-500" />
                {profile.iphone_no || "N/A"}
              </div>
              <div className="flex items-center gap-2">
                <FiMail className="text-gray-500" />
                {profile.cemail || "N/A"}
              </div>
              <div className="flex items-start gap-2">
                <FiMapPin className="text-gray-500 mt-1" />
                {profile.caddress || "N/A"}
              </div>
              <div className="flex items-start gap-2">
                <TbWorld className="text-gray-500 mt-1" />
                {profile.cwebsite || "N/A"}
              </div>
              <div className="flex items-start gap-2">
                <FiMove className="text-gray-500 mt-1" />
                {profile?.status || "N/A"}
              </div>
              <div className="flex items-start gap-2">
                <FiCodesandbox className="text-gray-500 mt-1" />
                {profile.dcreated_at || "N/A"}
              </div>
              
            </div>
          </div>
        </div>
      )}

      <h3 className="text-lg font-semibold mt-6">Profile Update History</h3>
      <div className="space-y-4">
        {history.length === 0 ? (
          <div>No history available</div>
        ) : (
          history.map((entry, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-md shadow-md">
              <p className="font-semibold text-sm text-gray-700">
                Updated on: {entry.date}
              </p>
              <div className="text-sm">
                <div>Name: {entry.updatedProfile?.clead_name || "N/A"}</div>
                <div>Email: {entry.updatedProfile?.cemail || "N/A"}</div>
                <div>Phone: {entry.updatedProfile?.iphone_no || "N/A"}</div>
                <div>Address: {entry.updatedProfile?.caddress || "N/A"}</div>
                {/* Display other relevant updated fields */}
              </div>
            </div>
          )))}
      </div>
    </div>
  );
};

export default ProfileCard;