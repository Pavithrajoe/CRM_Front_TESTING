
import React, { useEffect, useState } from "react";
import { FiEdit, FiPhone, FiMail, FiMapPin, FiUpload, FiSave, FiEye, FiX, FiMove, FiCodesandbox, FiCamera,} from "react-icons/fi";
import { TbWorld } from "react-icons/tb";
import axios from "axios";
import { useParams } from "react-router-dom";
import Loader from "./Loader";
import { Dialog } from "@headlessui/react";
import { useDropzone } from "react-dropzone";
import FilePreviewer from "./FilePreviewer";

const apiEndPoint = import.meta.env.VITE_API_URL;
const apiNoEndPoint = import.meta.env.VITE_NO_API_URL;

const EditProfileForm = ({ profile, onClose, onSave }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (profile) {
      setFormData({ ...profile });
    }
  }, [profile]);

 // console.log("Form Data in EditProfileForm:", formData);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 md:p-8">
      <div className="bg-white p-6 sm:p-8 rounded-2xl max-w-sm sm:max-w-md w-full shadow-lg relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <FiX size={24} />
        </button>
        <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-6">
          Edit Lead Profile
        </h3>
        <div className="space-y-5">
          <div>
            <label
              htmlFor="clead_name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Name:
            </label>
            <input
              type="text"
              id="clead_name"
              name="clead_name"
              value={formData.clead_name || ""}
              onChange={handleFieldChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 text-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="corganization"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Organization:
            </label>
            <input
              type="text"
              id="corganization"
              name="corganization"
              value={formData.corganization || ""}
              onChange={handleFieldChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 text-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="iphone_no"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone:
            </label>
            <input
              type="text"
              id="iphone_no"
              name="iphone_no"
              value={formData.iphone_no || ""}
              onChange={handleFieldChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 text-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="cemail"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email:
            </label>
            <input
              type="email"
              id="cemail"
              name="cemail"
              value={formData.cemail || ""}
              onChange={handleFieldChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 text-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="website"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Website:
            </label>
            <input
              type="text"
              id="cwebsite"
              name="cwebsite"
              value={formData.cwebsite || ""}
              onChange={handleFieldChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 text-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={handleSave}
              className="bg-blue-500 text-white px-5 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200"
            >
              <FiSave size={16} />
              Save
            </button>
            <button
              onClick={onClose}
              className="bg-gray-200 text-gray-800 px-5 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 transition-colors duration-200"
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
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [users, setUsers] = useState([]);
  const [editSuccess, setEditSuccess] = useState(false);

  const [attachments, setAttachments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [assignedToList, setAssignedToList] = useState([]);
  const [isAssignedToModalOpen, setIsAssignedToModalOpen] = useState(false);

  // Function to get user ID from JWT token
  const getUserIdFromToken = () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const base64Payload = token.split(".")[1];
        const decodedPayload = atob(base64Payload);
        const payloadObject = JSON.parse(decodedPayload);
        return payloadObject.user_id;
      } catch (e) {
        console.error("Error decoding token:", e);
        return null;
      }
    }
    return null;
  };

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
      } catch (err) {
        console.error("Failed to load lead details", err);
        setError("Failed to load lead details.");
      } finally {
        setLoading(false);
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
      fetchUsers();
    }
  }, [leadId]);

  const fetchAttachments = async () => {
    const token = localStorage.getItem("token");

    try {
      const res = await axios.get(`${apiEndPoint}/lead-attachments/${leadId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const fetched = Array.isArray(res.data.data) ? res.data.data : [];
      setAttachments(fetched);
    } catch (err) {
      console.error("Failed to fetch attachments", err);
      setAttachments([]);
    }
  };

  const fetchAssignedToList = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(`${apiEndPoint}/assigned-to/${leadId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Sort the list by dcreate_dt in descending order (latest first)
      const sortedList = res.data.sort(
        (a, b) => new Date(b.dcreate_dt) - new Date(a.dcreate_dt)
      );
      setAssignedToList(sortedList);
    } catch (err) {
      console.error("Failed to fetch assigned to list", err);
      setAssignedToList([]);
    }
  };

  useEffect(() => {
    fetchAttachments();
    fetchAssignedToList();
  }, [leadId]);

  const handleEditProfile = () => {
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditSuccess(false);
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
      } catch (err) {
        console.error("Failed to upload avatar", err);
        alert("Failed to upload avatar.");
      }
    }
  };

  const handleAssignLead = async (e) => {
    const userId = e.target.value;
    const token = localStorage.getItem("token");
    const loggedInUserId = getUserIdFromToken(); // Get the logged-in user's ID dynamically

    if (!loggedInUserId) {
      alert("User not logged in or token invalid.");
      return;
    }

    try {
      await axios.post(
        `${apiEndPoint}/assigned-to`,
        {
          iassigned_by: loggedInUserId, // Use the dynamically obtained user ID
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
      fetchAssignedToList(); // Re-fetch the assigned to list to update the display
    } catch (err) {
      console.error("Failed to assign lead", err);
      alert("Failed to assign lead.");
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
      }
    },
  });

  const handleFileUpload = async () => {
    const token = localStorage.getItem("token");
    const userId = getUserIdFromToken(); // Get the logged-in user's ID dynamically

    if (!userId) {
      alert("User not logged in or token invalid.");
      return;
    }

    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("attachment", selectedFile);
    formData.append("created_by", userId);
    formData.append("lead_id", Number(leadId));
    setUploading(true);

    try {
      await axios.post(`${apiEndPoint}/lead-attachments`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      await fetchAttachments();
      alert("File uploaded successfully.");
      setSelectedFile(null);
      setIsAttachmentModalOpen(false);
    } catch (err) {
      console.error("Failed to upload attachment", err);
      alert("Failed to upload file.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <Loader />;
  if (error) return <div className="text-red-500 p-4">{error}</div>;
  if (!profile)
    return (
      <div className="p-4 text-gray-700">No profile data found.</div>
    );

  const latestAssignments = assignedToList.slice(0, 2);

  return (
    <div className="max-w-2xl sm:max-w-xl md:max-w-2xl lg:max-w-2xl xl:max-w-3xl mx-auto p-4 sm:p-4 md:p-4 bg-white rounded-2xl shadow-lg space-y-6 ">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <h2 className="text-sm sm:text-sm md:text-xl font-semibold text-gray-800">
          Lead Details
        </h2>
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={() => setShowDetails(true)}
            className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            aria-label="View Full Details"
          >
            <FiEye size={15} className="sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={handleEditProfile}
            className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-md"
            aria-label="Edit Profile"
          >
            <FiEdit size={15} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 pt-4">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
          <img
            src={profile.avatar || "https://i.pravatar.cc/150?img=1"}
            alt="Avatar"
            className="w-full h-full rounded-full object-cover border-2 border-gray-100 shadow-sm"
          />
          <label className="absolute -bottom-1 -right-1 bg-white p-2 rounded-full shadow-md cursor-pointer border border-gray-200 hover:bg-gray-50 transition-colors">
            <FiCamera className="w-5 h-5 text-gray-600" />
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </label>
        </div>
        <div className="text-center sm:text-left">
          <h3 className="text-lg sm:text-xl font-bold break-words text-gray-900">
            {profile.clead_name || "N/A"}
          </h3>
          <p className="text-sm sm:text-base break-words text-gray-500">
            {profile.corganization || "N/A"}
          </p>
        </div>
      </div>

      <div className="text-sm sm:text-base text-gray-700 break-words space-y-3 pt-4">
        <div className="flex items-center gap-3">
          <FiPhone className="text-gray-500 reak-words w-4 h-4 sm:w-5 sm:h-5" />
          <span className="break-words">{profile.iphone_no || "N/A"}</span>
        </div>
        <div className="flex items-center gap-3">
          <FiMail className="text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
          <span className="break-words">{profile.cemail || "N/A"}</span>
        </div>
        <div className="flex items-start gap-3">
          <FiMapPin className="text-gray-500 w-4 h-4 sm:w-5 sm:h-5 mt-1" />
          <span className="break-words">{profile.clead_address1 || "N/A"}</span>
        </div>
        <div className="flex items-start gap-3">
          <FiMove className="text-gray-500 w-4 h-4 sm:w-5 sm:h-5 mt-1" />
          <span className="break-words">{profile.clead_address2 || "N/A"}</span>
        </div>
        <div className="flex items-start gap-3">
          <TbWorld className="text-gray-500 w-4 h-4 sm:w-5 sm:h-5 mt-1" />
          {profile.cwebsite ? (
            <a
              href={
                profile.cwebsite.startsWith("http")
                  ? profile.cwebsite
                  : `https://${profile.cwebsite}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {profile.cwebsite}
            </a>
          ) : (
            <span>N/A</span>
          )}
        </div>

        <div className="flex items-start gap-3">
          <FiCodesandbox className="text-gray-500 w-4 h-4 sm:w-5 sm:h-5 mt-1" />
          <span className="break-words">{profile.corganization || "N/A"}</span>
        </div>

        {profile.bactive === false && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-semibold text-center mt-4">
            LOST LEAD
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5 p-4 bg-gray-50 border border-gray-200 rounded-xl shadow-sm mt-5">
          <label
            htmlFor="assignUser"
            className="text-sm font-semibold text-gray-700 min-w-[90px]"
          >
            Assign to:
          </label>
          <div className="relative w-full sm:w-64">
            <select
              id="assignUser"
              className="appearance-none w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm text-gray-800 bg-white shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200"
              onChange={handleAssignLead}
              defaultValue=""
            >
              <option value="" disabled>
                Select User
              </option>
              {users.map((user) => (
                <option key={user.iUser_id} value={user.iUser_id}>
                  {user.cUser_name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
              <svg
                className="w-4 h-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Assigned to me list */}
        <div className="p-4 sm:p-6 bg-gray-50 border border-gray-200 rounded-2xl shadow-sm mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-gray-700">
              Lead Assigned to
            </h3>
            {assignedToList.length > 2 && (
              <button
                onClick={() => setIsAssignedToModalOpen(true)}
                className="text-blue-600 hover:underline text-sm font-medium"
              >
                View All
              </button>
            )}
          </div>
          {latestAssignments.length === 0 ? (
            <p className="text-sm text-gray-500 italic">
              No assignment history available.
            </p>
          ) : (
            <div className="space-y-3">
              {latestAssignments.map((assignment) => (
                <div
                  key={assignment.iassigned_id}
                  className="text-sm text-gray-800 bg-white border border-gray-200 rounded-lg p-3 shadow-sm"
                >
                  <p>
                    <span className="font-medium">Assigned To:</span>{" "}
                    {assignment.user_assigned_to_iassigned_toTouser?.cFull_name || "N/A"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="font-medium">Assigned By:</span>{" "}
                    {assignment.user_assigned_to_iassigned_byTouser?.cFull_name || "N/A"}{" "}
                    on {new Date(assignment.dcreate_dt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attachment Upload Section */}
        <div className="p-4 sm:p-6 bg-gray-50 border border-gray-200 rounded-2xl shadow-sm mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Manage Attachments
          </label>

          <button
            onClick={() => setIsAttachmentModalOpen(true)}
            className="inline-flex items-center px-4 sm:px-6 py-2 bg-blue-500 text-white text-sm font-semibold rounded-full hover:bg-blue-600 transition-colors shadow-md"
          >
            <FiUpload className="mr-2" /> Upload New File
          </button>

          {/* Display attachments list below */}
          <div className="mt-5 space-y-3">
            {attachments.length === 0 && (
              <p className="text-sm text-gray-500 italic">
                No attachments uploaded yet.
              </p>
            )}

            {attachments.map((file) => {
              const filePath = file?.cattechment_path;
              const filename = filePath?.split("/").pop();

              return (
                <div
                  key={file.ilead_id || filename}
                  className="text-sm text-gray-800 bg-white border border-gray-200 rounded-lg p-3 shadow-sm flex justify-between items-center"
                >
                  <span className="font-medium truncate max-w-[70%] sm:max-w-[80%]">
                    {filename}
                  </span>
                  <FilePreviewer filePath={filePath} apiBaseUrl={apiNoEndPoint} />
                </div>
              );
            })}
          </div>
        </div>

        <Dialog
          open={isAttachmentModalOpen}
          onClose={() => setIsAttachmentModalOpen(false)}
          className="relative z-50"
        >
          <div
            className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm"
            aria-hidden="true"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-sm sm:max-w-md bg-white p-6 rounded-2xl shadow-lg">
              <Dialog.Title className="text-lg font-semibold text-gray-800 mb-4">
                Upload File
              </Dialog.Title>

              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 ${
                  isDragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400 bg-gray-50"
                }`}
              >
                <input {...getInputProps()} />
                {selectedFile ? (
                  <p className="text-sm text-gray-700 font-medium">
                    {selectedFile.name}
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-gray-500">
                      Drag & drop a file here, or{" "}
                      <span className="text-blue-500 font-medium">
                        click to select
                      </span>
                    </p>
                    <p className="text-xs text-gray-400">
                      Only PDF,PNG and JPEG files can be uploaded
                    </p>
                  </>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsAttachmentModalOpen(false);
                    setSelectedFile(null);
                  }}
                  className="px-4 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleFileUpload}
                  disabled={!selectedFile || uploading}
                  className={`px-5 py-2 text-sm font-semibold rounded-lg text-white shadow-md ${
                    uploading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-500 hover:bg-blue-600"
                  } transition-colors`}
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>

        {/* Assigned To All List Modal */}
        <Dialog
          open={isAssignedToModalOpen}
          onClose={() => setIsAssignedToModalOpen(false)}
          className="relative z-50"
        >
          <div
            className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm"
            aria-hidden="true"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-sm sm:max-w-md bg-white p-6 rounded-2xl shadow-lg max-h-[90vh] overflow-y-auto">
              <Dialog.Title className="text-lg font-semibold text-gray-800 mb-4 flex justify-between items-center">
                All Assigned To History
                <button
                  onClick={() => setIsAssignedToModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <FiX size={20} />
                </button>
              </Dialog.Title>

              {assignedToList.length === 0 ? (
                <p className="text-sm text-gray-500 italic">
                  No assignment history available.
                </p>
              ) : (
                <div className="space-y-3">
                  {assignedToList.map((assignment) => (
                    <div
                      key={assignment.iassigned_id}
                      className="text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3 shadow-sm"
                    >
                      <p>
                        <span className="font-medium">Assigned To:</span>{" "}
                        {assignment.user_assigned_to_iassigned_toTouser?.cFull_name || "N/A"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        <span className="font-medium">Assigned By:</span>{" "}
                        {assignment.user_assigned_to_iassigned_byTouser?.cFull_name || "N/A"}{" "}
                        on {new Date(assignment.dcreate_dt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Dialog.Panel>
          </div>
        </Dialog>

        {editSuccess && (
          <div className="text-green-600 bg-green-50 border border-green-200 rounded-lg p-3 text-center text-sm mt-5">
            Profile updated successfully!
          </div>
        )}

        {isEditModalOpen && profile && (
          <EditProfileForm
            profile={profile}
            onClose={handleCloseEditModal}
            onSave={handleSaveProfile}
          />
        )}

        {showDetails && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 md:p-8">
            <div className="bg-white p-6 sm:p-8 rounded-2xl max-w-lg sm:max-w-xl md:max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-lg relative">
              <button
                onClick={() => setShowDetails(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FiX size={24} />
              </button>
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-6">
                Full Profile Details
              </h3>
              <div className="space-y-4 text-sm sm:text-base text-gray-700">
                <div className="flex items-center gap-3">
                  <FiPhone className="text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
                  <span>
                    <span className="font-medium">Phone:</span>{" "}
                    {profile.iphone_no || "N/A"}
                  </span>
                </div>
                <div className="flex items-center break-words gap-3">
                  <FiMail className="text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
                  <span>
                    <span className="font-medium">Email:</span>{" "}
                    {profile.cemail || "N/A"}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <FiMapPin className="text-gray-500 w-4 h-4 sm:w-5 sm:h-5 mt-1" />
                  <span>
                    <span className="font-medium">Address:</span>{" "}
                    {profile.clead_address1 || "N/A"}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <FiMove className="text-gray-500 w-4 h-4 sm:w-5 sm:h-5 mt-1" />
                  <span>
                    <span className="font-medium">Address 2:</span>{" "}
                    {profile.clead_address2 || "N/A"}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <TbWorld className="text-gray-500 w-4 h-4 sm:w-5 sm:h-5 mt-1" />
                  <span>
                    <span className="font-medium">Website:</span>{" "}
                    {profile.cwebsite || "N/A"}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <FiCodesandbox className="text-gray-500 w-4 h-4 sm:w-5 sm:h-5 mt-1" />
                  <span>
                    <span className="font-medium">Created At:</span>{" "}
                    {profile.corganization || "N/A"}
                  </span>{" "}
                  {/* This seems to be a placeholder; ideally it should be profile.created_at */}
                </div>
              </div>

              {/* <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mt-8 mb-4 border-t pt-4 border-gray-100">
                Profile Update History
              </h3> */}
              <div className="space-y-4">
                {history.length === 0 ? (
                  <div className="text-gray-500 italic">
                    {/* No history available. */}
                  </div>
                ) : (
                  history.map((entry, index) => (
                    <div
                      key={index}
                      className="p-3 sm:p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-100"
                    >
                      <p className="font-semibold text-sm sm:text-base text-gray-700 mb-2">
                        Updated on: {entry.date}
                      </p>
                      <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                        {entry.updatedProfile?.clead_name && (
                          <div>
                            <span className="font-medium">Name:</span>{" "}
                            {entry.updatedProfile.clead_name}
                          </div>
                        )}
                        {entry.updatedProfile?.cemail && (
                          <div>
                            <span className="font-medium">Email:</span>{" "}
                            {entry.updatedProfile.cemail}
                          </div>
                        )}
                        {entry.updatedProfile?.iphone_no && (
                          <div>
                            <span className="font-medium">Phone:</span>{" "}
                            {entry.updatedProfile.iphone_no}
                          </div>
                        )}
                        {entry.updatedProfile?.caddress && (
                          <div>
                            <span className="font-medium">Address:</span>{" "}
                            {entry.updatedProfile.icity}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;