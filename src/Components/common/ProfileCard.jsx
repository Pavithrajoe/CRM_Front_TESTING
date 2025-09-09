
import React, { useEffect, useState, useRef, useCallback } from "react";
import {FiEdit,FiPhone,FiMail,FiMapPin,FiUpload,FiEye,FiCheckCircle ,FiX,FiMove,FiCodesandbox,FiCamera,FiDollarSign,FiUser
} from "react-icons/fi";
import { TbWorld } from "react-icons/tb";
import axios from "axios";
import { useParams } from "react-router-dom";
import Loader from "./Loader";
import { Dialog } from "@headlessui/react";
import { useDropzone } from "react-dropzone";
import FilePreviewer from "./FilePreviewer";
import DemoSessionDetails from "./demo_session_details";
import EditProfileForm from "../common/EditForms/B2B_edit_form";
import EditProfileForm_Customer from "../common/EditForms/B2C_edit_form";
import { ENDPOINTS } from "../../api/constraints";
import { usePopup } from "../../context/PopupContext";

const apiEndPoint = import.meta.env.VITE_API_URL;
const apiNoEndPoint = import.meta.env.VITE_NO_API_URL;

const ProfileCard = () => {
  const { leadId } = useParams();
  const [history, setHistory] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  const [selectedAssignToUser, setSelectedAssignToUser] = useState(null);
  const [selectedNotifyToUser, setSelectedNotifyToUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [assignedToList, setAssignedToList] = useState([]);
  const [isAssignedToModalOpen, setIsAssignedToModalOpen] = useState(false);
  const [showAssignConfirmation, setShowAssignConfirmation] = useState(false);
  // EDIT FORM STATES
  const [editingLead, setEditingLead] = useState(null);
  const [editFormType, setEditFormType] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);

  // LEAD EDIT FORM
  const handleEditLead = async (lead) => {
  try {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));
    const companyId = user?.iCompany_id;

    if (!token || !companyId) {
      console.error("Token or company ID is missing.");
      return;
    }
    const res = await axios.get(`${apiEndPoint}/company`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    const companyData = res.data?.find(c => c.iCompany_id === companyId);

    if (companyData) {
      const businessTypeId = companyData.ibusiness_type;
      console.log("Found company business type:", businessTypeId);

      if (businessTypeId === 1) { 
        setEditFormType(1);
      } else if (businessTypeId === 2) { 
        setEditFormType(2);
      } else {
        setEditFormType(null);
      }
      
      setEditingLead(lead);
      setShowEditForm(true);
      
    } else {
      console.error("Could not find company data.");
    }

  } catch (err) {
    console.error("Error fetching company data:", err);
  }
};

  const getUserIdFromToken = () => {
    const token = localStorage.getItem("token");
    console.log("Retrieved token:", token);
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

  const handleNotifyLead = (event) => {
    const userId = event.target.value === "" ? null : event.target.value;
    setSelectedNotifyToUser(userId);
  };

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

//   const handleEditProfile = (lead) => {
//   setEditingLead(lead);
//   console.log("Editing lead:", lead);
//   const businessTypeId = lead.ibusiness_type; 
  
//   if (businessTypeId === 1) { // B2B
//     setEditFormType(1); 
//   } else if (businessTypeId === 2) { // B2C
//     setEditFormType(2);
//   } else {
//     setEditFormType(null); 
//   }

//   setShowEditForm(true);
// };

//   const handleEditProfile = (lead) => {
//   setEditingLead(lead); // store lead data to pass to form

//   if (lead.business_type_id === 1) setEditFormType(1); // B2B
//   else if (lead.business_type_id === 2) setEditFormType(2); // B2C
//   else setEditFormType(null); // optional for others

//   setShowEditForm(true); // open the edit form modal
// };


  // const handleEditProfile = () => {
  //   setIsEditModalOpen(true);
  // };

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

  const handleAssignButtonClick = () => {
    if (!selectedAssignToUser) {
      alert("Please select a user to assign to.");
      return;
    }
    setShowAssignConfirmation(true);
  };

  const confirmAssignment = async () => {
    setShowAssignConfirmation(false);

    const userIdToAssign = Number(selectedAssignToUser);
    const notifyUserId = selectedNotifyToUser;
    const token = localStorage.getItem("token");
    const loggedInUserId = getUserIdFromToken();

    if (!loggedInUserId) {
      alert("User not logged in or token invalid.");
      return;
    }

    if (!userIdToAssign || userIdToAssign === 0) {
      alert("Please select a valid user to assign the lead to.");
      return;
    }

    setSelectedAssignToUser(null);
    setSelectedNotifyToUser(null);

    try { await axios.post(`${apiEndPoint}/assigned-to`,{
          iassigned_by: loggedInUserId,
          iassigned_to: userIdToAssign,
          ilead_id: Number(leadId),
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      const isConverted = profile?.bisConverted === true || profile?.bisConverted === 'true';
      const successMessage = isConverted ? "Won Lead assigned successfully." : "Lead assigned successfully.";
      alert(successMessage);

      fetchAssignedToList();

      const assignedUser = users.find(
        (user) => String(user.iUser_id) === String(userIdToAssign)
      );
      const notifiedPerson = users.find(
        (user) => String(user.iUser_id) === String(notifyUserId)
      );

      if (assignedUser && profile) {
        const mailPayload = {
          userName: assignedUser.cUser_name,
          time: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
          leadName: profile.clead_name,
          leadURL: window.location.href,
          mailId: assignedUser.cEmail,
          assignedTo: assignedUser.cUser_name,
          notifyTo: notifiedPerson ? notifiedPerson.cEmail : null,
        };

        try {
          await axios.post(`${apiEndPoint}/assigned-to-mail`, mailPayload, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
        } catch (mailErr) {
          console.error("Failed to send notification email:", mailErr);
        }
      }
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
    const userId = getUserIdFromToken();

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
      <div className="p-4 text-gray-700">No profile found.</div>
    );

  const latestAssignments = assignedToList.slice(0, 2);
  const activeUsers = users.filter(user => user.bactive === true);
  const usersForNotify = activeUsers.filter(
    (user) => String(user.iUser_id) !== String(selectedAssignToUser)
  );

  return (
    <>
<div className="w-full p-6 lg:p-6 bg-white rounded-3xl shadow-md">
   <div className="flex justify-end w-full"> 

</div>
  <div className="flex items-center justify-between  border-b border-gray-100">
    <h2 className="text-xl sm:text-2xl text-grey-600 tracking-tight">
      {profile.corganization || "-"}'s Details
    </h2>
    

  </div>
  <div class="border-t border-gray-900 my-2 w-full "></div>
   <div className="flex items-center space-x-2 justify-end ">
    <button
      onClick={() => setShowDetails(true)}
      className="p-2 rounded-xl bg-blue-900 text-white hover:bg-blue-600 hover:text-gray-800 transition-all duration-300 transform hover:scale-110 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
      aria-label="View Full Details"
      title="View Details"
    >
      <FiEye size={18} />
    </button>
    <button
      onClick={() =>  handleEditLead(profile)}
      className="p-2 rounded-xl bg-blue-900 text-white hover:bg-blue-600 transition-all duration-300 transform hover:scale-110 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300"
      aria-label="Edit Profile"
      title="Edit Profile"
>
    <FiEdit size={18} />
</button>
    
  </div>

        
        <div className=" items-start and w-full sm:items-startsm:gap-6 pt-6">
  {/* Profile Info */}
  <div className="flex-1 text-center sm:text-left">

     <div>
      {profile.isUpdated && (
        <span className="inline-flex items-center px-3 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full transition-all duration-300 transform hover:scale-105">
          <FiCheckCircle className="w-3 h-3 mr-1" />
          Edited Profile
        </span>
      )}
      </div>
    <div className="flex mt-6 flex-col sm:flex-row items-center gap-2">
      <h3 className="text-2xl font-bold w-[240px] text-gray-900 break-words">
        {profile.clead_name || "Lead Name"}
      </h3>
     

    </div>
    <p className="text-sm sm:text-base break-words text-gray-900 mt-1 font-semibold">
      {profile.corganization || "Organization"}
    </p>
  </div>
</div>
        <div className="text-sm sm:text-base text-gray-700 break-words space-y-3 pt-4">
          <div className="flex items-center gap-3">
            <FiPhone className="text-gray-900 break-words w-4 h-4 sm:w-5 sm:h-5" />
            <span className="break-words text-grey-900 font-bold">{profile.iphone_no || "-"}</span>
          </div>
          <div className="flex items-center gap-3">
            <FiMail className="text-gray-900 break-words w-4 h-4 sm:w-5 sm:h-5" />
            <span className="w-[180px] break-words text-grey-900 font-bold">{profile.cemail || "-"}</span>
          </div>
          <div className="flex items-start gap-3">
            <FiMapPin className="text-gray-900 w-4 h-4 sm:w-5 sm:h-5 mt-1" />
            <span className="bw-[180px] break-words text-grey-900 ">{profile.clead_address1 || "-"}</span>
          </div>
          <div className="flex items-start gap-3">
            <FiMove className="text-gray-900 w-4 h-4 sm:w-5 sm:h-5 mt-1" />
            <span className="w-[180px] break-words text-grey-900 ">{profile.clead_address2 || "-"}</span>
          </div>
          <div className="flex items-start gap-3">
            <TbWorld className="text-gray-900 w-4 h-4 sm:w-5 sm:h-5 mt-1" />
            {profile.cwebsite ? (
              <a
                href={profile.cwebsite.startsWith("http")
                  ? profile.cwebsite
                  : `https://${profile.cwebsite}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-900 hover:underline w-[180px] break-words text-grey-900"
              >
                {profile.cwebsite}
              </a>
            ) : (
              <span>-</span>
            )}
          </div>

          <div className="flex items-start gap-3">
            <FiCodesandbox className="text-gray-900 w-4 h-4 sm:w-5 sm:h-5 mt-1" />
            <span className="w-[180px] break-words text-grey-900">{profile.corganization || "-"}</span>
          </div>

          {profile.bactive === false && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-semibold text-center mt-4">
              LOST LEAD
            </div>
          )}

          {(profile.website_lead === true || profile.remarks) && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl shadow-sm mt-5 text-sm text-green-800 flex flex-col gap-3">
              {profile.website_lead === true && (
                <div className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-600 flex-shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.083 9.922A6.955 6.955 0 0010 16a6.955 6.955 0 005.917-6.078 2.5 2.5 0 010-4.844A6.955 6.955 0 0010 4a6.955 6.955 0 00-5.917 6.078 2.5 2.5 0 010 4.844zM10 18a8 8 0 100-16 8 8 0 000 16zm-7.5-8a7.5 7.5 0 1015 0 7.5 7.5 0 00-15 0zM10 7a3 3 0 100 6 3 3 0 000-6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="font-semibold">This is a Website Lead.</p>
                </div>
              )}

              {profile.remarks && (
                <div className="flex items-start gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-600 flex-shrink-0 mt-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-9-4a1 1 0 112 0v4a1 1 0 01-2 0V6zm1 8a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="font-medium break-words">
                    <span className="text-gray-700 font-semibold">Remarks:</span> {profile.remarks}
                  </p>
                </div>
              )}
            </div>
          )}

         <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl shadow-sm mt-5 space-y-4">
  {/* Assign To */}
  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5">
    <label htmlFor="assignUser" className="text-sm font-semibold text-gray-700 min-w-[90px]">
      Assign to:
    </label>
    <div className="relative w-full sm:w-64">
      <select
        id="assignUser"
        className={`appearance-none w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm text-gray-800 bg-white shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200 ${
          profile.bactive === false ? "bg-gray-100 cursor-not-allowed" : ""
        }`}
        onChange={(e) => {
          if (profile.bactive === false) return;
          setSelectedAssignToUser(e.target.value === "" ? null : e.target.value);
        }}
        value={selectedAssignToUser || ""}
        disabled={profile.bactive === false}
      >
        <option value="" disabled>
          Select User
        </option>
        {activeUsers.map((user) => (
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
  
  {/* Notify To */}
  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5">
    <label htmlFor="notifyUser" className="text-sm font-semibold text-gray-700 min-w-[90px]">
      Notify to:
    </label>
    <div className="relative w-full sm:w-64">
      <select
        id="notifyUser"
        className={`appearance-none w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm text-gray-800 bg-white shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200 ${
          profile.bactive === false ? "bg-gray-100 cursor-not-allowed" : ""
        }`}
        onChange={(e) => {
          if (profile.bactive === false) return;
          const userId = e.target.value === "" ? null : e.target.value;
          setSelectedNotifyToUser(userId);
        }}
        value={selectedNotifyToUser || ""}
        disabled={profile.bactive === false}
      >
        <option value="">
          Select User
        </option>
        {usersForNotify.map((user) => (
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
</div>

{/* Assign Button  */}
{profile.bactive !== false && (
  <div className="flex justify-center">
    <button
      className="inline-flex items-center px-4 py-2 bg-blue-900 text-white text-sm font-semibold rounded-full hover:bg-blue-700 transition-colors shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
      disabled={!selectedAssignToUser}
      onClick={handleAssignButtonClick}
    >
      Assign Lead
    </button>
  </div>
)}
          </div>
       

        {/* Assigned to list */}
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
                    {assignment.user_assigned_to_iassigned_toTouser?.cFull_name || "-"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="font-medium">Assigned By:</span>{" "}
                    {assignment.user_assigned_to_iassigned_byTouser?.cFull_name || "-"} on{" "}
                    {new Date(assignment.dcreate_dt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Attachments Section */}
      <div className="p-4 sm:p-6 bg-gray-50 border border-gray-200 rounded-2xl shadow-md mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Manage Attachments
        </label>

        <button
          onClick={() => setIsAttachmentModalOpen(true)}
          className="inline-flex items-center px-4 sm:px-6 py-2 bg-blue-900 text-white text-sm font-semibold rounded-full hover:bg-blue-600 transition-colors shadow-md"
        >
          <FiUpload className="mr-2" /> Upload New File
        </button>

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

      {/* Attachment Upload Modal */}
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
                    <span className="text-blue-900 font-medium">
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
                className="px-4 py-2 text-sm text-gray-900 rounded-lg hover:bg-gray-200 transition-colors"
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
                    : "bg-blue-900 hover:bg-blue-600"
                } transition-colors`}
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Assigned To History Modal */}
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
                      {assignment.user_assigned_to_iassigned_toTouser?.cFull_name || "-"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      <span className="font-medium">Assigned By:</span>{" "}
                      {assignment.user_assigned_to_iassigned_byTouser?.cFull_name || "-"}{" "}
                      on {new Date(assignment.dcreate_dt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Assignment Confirmation Modal */}
      <Dialog
        open={showAssignConfirmation}
        onClose={() => setShowAssignConfirmation(false)}
        className="relative z-50"
      >
        <div
          className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm"
          aria-hidden="true"
        />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-xs bg-white p-6 rounded-2xl shadow-lg text-center">
            <Dialog.Title className="text-lg font-semibold text-gray-800 mb-4">
              Confirm Assignment
            </Dialog.Title>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to assign this lead?
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowAssignConfirmation(false)}
                className="px-5 py-2 text-sm font-semibold rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAssignment}
                className="px-5 py-2 text-sm font-semibold rounded-lg text-white bg-blue-700 hover:bg-blue-600 transition-colors"
              >
                Confirm
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Success Message */}
      {editSuccess && (
        <div className="text-blue-600 bg-green-50 border border-blue-200 rounded-lg p-3 text-center text-sm mt-5">
          Profile updated successfully!
        </div>
      )}

      {/* Full Details Modal */}
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
  {(profile?.clead_name
    ? profile.clead_name
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "Lead")}'s Profile Details
</h3>


            <div className="space-y-4 text-sm sm:text-base text-gray-700">
              <div className="flex items-center gap-3">
                <FiPhone className="text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
                <span>
                  <span className="font-medium">Phone:</span>{" "}
                  {profile.iphone_no || "-"}
                </span>
              </div>
              <div className="flex items-center break-words gap-3">
                <FiMail className="text-gray-500 break-words w-4 h-4 sm:w-5 sm:h-5" />
                <span>
                  <span className="font-medium">Email:</span>{" "}
                  {profile.cemail || "-"}
                </span>
              </div>
              

              <div className="flex items-start gap-3">
                <FiMapPin className="text-gray-500 w-4 h-4 sm:w-5 sm:h-5 mt-1" />
                <span className="w-[180px] break-words text-grey-900">
                    <span className="font-medium">Address:</span>{" "}
                    {(() => {
                        const addressParts = [];
                        if (profile.clead_address1) {
                            addressParts.push(profile.clead_address1);
                        }
                        if (profile.clead_address2) {
                            addressParts.push(profile.clead_address2);
                        }
                        if (profile.city?.cCity_name) {
                            addressParts.push(profile.city.cCity_name);
                        }
                        if (profile.city?.district?.cDistrict_name) {
                            addressParts.push(profile.city.district.cDistrict_name);
                        }
                        if (profile.city?.district?.state?.cState_name) {
                            addressParts.push(profile.city.district.state.cState_name);
                        }
                        if (profile.city?.district?.state?.country?.cCountry_name) {
                            addressParts.push(profile.city.district.state.country.cCountry_name);
                         }
                        return addressParts.length > 0 ? addressParts.join(", ") : "-";
                    })()}
                </span>
            </div>
              <div className="flex items-start gap-3">
                <TbWorld className="text-gray-500 w-4 h-4 sm:w-5 sm:h-5 mt-1" />
                <span>
                  <span className="font-medium">Website:</span>{" "}
                  {profile.cwebsite || "-"}
                </span>
              </div>

              <div className="flex items-start gap-3">
                <FiCodesandbox className="text-gray-500 w-4 h-4 sm:w-5 sm:h-5 mt-1" />
                <span>
                  <span className="font-medium">Organisation:</span>{" "}
                  {profile.corganization || "-"}
                </span>
              </div>
              
              <div className="flex items-start gap-3">
                <FiDollarSign className="text-gray-500 w-4 h-4 sm:w-5 sm:h-5 mt-1" />
                <span>
                  <span className="font-medium">Project Value:</span>{" "}
                  {profile.iproject_value || "-"}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <FiUser className="text-gray-500 w-4 h-4 sm:w-5 sm:h-5 mt-1" />
                <span>
                  <span className="font-medium">Employee:</span>{" "}
                  {profile.ino_employee || "-"}
                </span>
              </div>
            </div>

            {profile.website_lead === true && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl shadow-sm text-sm mt-10 text-yellow-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.344a1.5 1.5 0 012.986 0l2.376 6.07a1.5 1.5 0 01-.734 1.944l-4.136 1.84a1.5 1.5 0 01-1.944-.734l-6.07-2.376a1.5 1.5 0 01-.734-1.944l1.84-4.136a1.5 1.5 0 011.944-.734l2.376 6.07a.5.5 0 00.986-.388l-2.136-5.462a.5.5 0 00-.986.388l2.136 5.462a.5.5 0 00.388.986l5.462 2.136a.5.5 0 00.388-.986l-5.462-2.136a.5.5 0 00-.986-.388l5.462-2.136z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-7.75a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0v-3.5zM10 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
                <p className="font-semibold">This lead originated from the website.</p>
              </div>
            )}
          </div>
          <div className="space-y-4">
            {history.length === 0 ? (
              <div className="text-gray-500 italic">
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
      )}

      <DemoSessionDetails leadId={leadId} />

        {/* Edit Profile Modal */}
       {showEditForm && (
      <div className="fixed inset-0 z-40 bg-black bg-opacity-30 flex justify-center items-center">
        <div className="bg-white p-6 rounded-3xl shadow-2xl w-11/12 md:w-3/4 max-h-[80vh] overflow-y-auto">
          {editFormType === 1 && <EditProfileForm profile={editingLead} onClose={() => setShowEditForm(false)} onSave = {handleSaveProfile} />}
          {editFormType === 2 && <EditProfileForm_Customer profile={editingLead} onClose={() => setShowEditForm(false)} onSave = {handleSaveProfile} />}

        </div>
      </div>
    )}

    </>
  );
};

export default ProfileCard;
