import React, { useEffect, useState } from "react";
import { usePopup } from "../../context/PopupContext";

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

const ProfileCard = () => {
  const { showPopup } = usePopup();

  const { leadId } = useParams();
  const [history, setHistory] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDetails,   setShowDetails] = useState(false);
  const [users, setUsers] = useState([]);


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
        console.log("The lead data is:",response.data )
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
        console.log("The user data are",res.data)
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

  const handleEditProfile = () => setIsEditing(!isEditing);

  const handleFieldChange = (e) => {
    
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    const token = localStorage.getItem("token");
    try {
      await axios.put(`${apiEndPoint}/lead/${leadId}`, profile, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      alert("Profile saved successfully.");
      setIsEditing(false);
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
      } catch (err) {
        console.error("Failed to upload avatar", err);
        alert("Failed to upload avatar.");
      }
    }
  };

  const handleAssignLead = async (e) => {
    
    const userId = e.target.value;
    const assigntoUserString = localStorage.getItem("user");

    const assignedToUser = JSON.parse(assigntoUserString);
    console.log('assigned to is:', assignedToUser.iUser_id);
    const token = localStorage.getItem("token");
    try {
     const users= await axios.post(
        `${apiEndPoint}/assigned-to`,
        {iassigned_by:assignedToUser.iUser_id, iassigned_to:Number( userId),ilead_id:Number(leadId) },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
     
      showPopup("Success", "Lead assigned successfully.!", "success")
    } catch (err) {
      console.error("Failed to assign lead", err);
      showPopup("Error", "Failed to assign lead.!", "error")
    }
  };

  if (loading) return <Loader />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!profile) return <div>No profile data found.</div>;

  
const formatValue = (value, key) => {
  if (!value) return "N/A";

  if (key === "dcreated_dt" || key === "dmodified_dt") {
    const date = new Date(value);
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return value;
};
     
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
          {isEditing ? (
            <input
              type="text"
              name="clead_name"
              value={profile.clead_name || ""}
              onChange={handleFieldChange}
              className="text-sm font-bold border border-gray-300 px-2 py-1 rounded"
            />
          ) : (
            <h3 className="text-sm font-bold">{profile.clead_name || "N/A"}</h3>
          )}
          <p className="text-xs text-gray-500">{profile.corganization || "N/A"}</p>
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
<FiMapPin className="text-gray-600 mt-1 w-6 h-6" />
  <span>
    {[
      profile.clead_address1,
      profile.clead_address2,
      profile.clead_address3,
    ]
      .filter(Boolean)         // remove empty/null/undefined
      .join(", ") || "N/A"}
  </span>
</div>
       

        {/* Created At + Assign Dropdown */}
        <div className="flex flex-col gap-2">


          <div className="border-t border-gray-200 my-2"></div>

          <div className="flex items-center gap-3">
              <label
                htmlFor="assignUser"
                className="text-sm font-medium text-gray-700 min-w-max">
                Assign to:
                </label>

                  <select
                    id="assignUser"
                    onChange={handleAssignLead}
                    defaultValue=""
                    className="block w-full sm:w-60 border border-gray-300 rounded-lg bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  >
                    <option value="" disabled>
                      -- Select user --
                    </option>
                    {users.map((user) => (
                      <option key={user.iUser_id} value={user.iUser_id}>
                        {user.cUser_name}
                      </option>
                    ))}
                  </select>
                </div>

            </div>
      </div>

      {isEditing && (
        <div className="flex justify-end space-x-2">
          <button
            onClick={handleSaveProfile}
            className="bg-black text-white px-4 py-1 rounded flex items-center gap-1"
          >
            <FiSave className="w-4 h-4" />
            Save
          </button>
          <button
            onClick={handleEditProfile}
            className="bg-gray-300 text-black px-4 py-1 rounded"
          >
            Cancel
          </button>
        </div>
      )}

     {showDetails && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-xl relative">
      <button
        onClick={() => setShowDetails(false)}
        className="absolute top-3 right-3 text-gray-600 hover:text-black"
      >
        <FiX className="w-5 h-5" />
      </button>
      <h2 className="text-lg font-bold mb-4">Lead Full Details</h2>
      <table className="w-full table-auto border">
        <tbody>
                    {[
              ["clead_name", "Name"],
              ["corganization", "Organization"],
              ["cemail", "Email"],
              ["iphone_no", "Phone"],
              ["clead_address1", "Address Line 1"],
              ["clead_address2", "Address Line 2"],
              ["clead_address3", "Address Line 3"],
              // ["clead_city", "City"], // or use "icity" depending on your logic
              // ["iLeadpoten_id", "Lead Potential ID"], // Replace with label if available
              // ["ileadstatus_id", "Status ID"],         // Replace with label if available
              // ["cindustry_id", "Industry ID"],         // Replace with label if available
              // ["lead_source_id", "Source ID"],         // Replace with label if available
              // ["clead_owner", "Lead Owner"],
              ["dcreated_dt", "Created At"],
              ["dmodified_dt", "Updated At"],
            ]
            .filter(([key]) => profile[key])
            .map(([key, label]) => (
              <tr key={key} className="border-b">
                <td className="p-2 font-medium text-gray-600">{label}</td>
                <td className="p-2 text-gray-800 whitespace-pre-wrap">
          {formatValue(profile[key], key)}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  </div>
)}

    </div>
  );
};

export default ProfileCard;
