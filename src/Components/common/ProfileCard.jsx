import React, { useEffect, useState, useRef, useContext, useMemo } from "react";
import { FiEdit, FiPhone, FiMail, FiMapPin, FiUpload, FiEye, FiCheckCircle, FiX, FiMove, FiCodesandbox, FiTag,} from "react-icons/fi";
import { TbWorld } from "react-icons/tb";
import axios from "axios";
import { useParams } from "react-router-dom";
import Loader from "./Loader";
import { Dialog } from "@headlessui/react";
import { useDropzone } from "react-dropzone";
import FilePreviewer from "./FilePreviewer";
import DemoSessionDetails from "./demo_session_details";
import LeadProfileView from "./ProfileCardComponents/ViewProfile/LeadProfileView";
import EditProfileForm from "./ProfileCardComponents/EditForms/B2B_edit_form";
import EditProfileForm_Customer from "./ProfileCardComponents/EditForms/B2C_edit_form";
import EditProfileFormBoth from "./ProfileCardComponents/EditForms/BothEditFormB2B_B2C.jsx";
import { ENDPOINTS } from "../../api/constraints";
import { usePopup } from "../../context/PopupContext";
import LeadMailStorage from "./ProfileCardComponents/MailStorage/LeadMailStorage.jsx";
import { useUserAccess } from "../../context/UserAccessContext";
import { GlobUserContext } from "../../context/userContex.jsx";
import { useDemoSession } from "../../context/demo_session_session_context.jsx";

import InteriorDesignEditForm from "../../Industries/InteriorDesigning/InteriorDesignEditForm.jsx"

const apiEndPoint = import.meta.env.VITE_API_URL;
const apiNoEndPoint = import.meta.env.VITE_NO_API_URL;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("ProfileCard ErrorBoundary:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg"> Something went wrong loading this section. </div>
      );
    }
    return this.props.children;
  }
}

const ProfileCard = ({ settingsData,  isLoadingSettings = false,  leadData,  isDeal,  isLost, setShowSummary }) => {
  const { user } = useContext(GlobUserContext);
  const { userModules } = useUserAccess();
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
  const [isMailHistoryModalOpen, setIsMailHistoryModalOpen] = useState(false);
  // EDIT FORM STATES
  const [editingLead, setEditingLead] = useState(null);
  const [editFormType, setEditFormType] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const popup = usePopup?.();
  const editFormRef = useRef(null);
  const getUserIdFromToken = () => {
  const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const base64Payload = token.split(".")[1];
      if (!base64Payload) return null;
      const decodedPayload = atob(
        base64Payload.replace(/-/g, "+").replace(/_/g, "/")
      );
      const payloadObject = JSON.parse(decodedPayload);
      return (
        payloadObject.user_id ??
        payloadObject.userId ??
        payloadObject.iUser_id ??
        payloadObject.iUserId ??
        null
      );
    } catch (e) {
      console.error("Error decoding token:", e);
      return null;
    }
  };

  // Use the passed leadData directly
  useEffect(() => {
    if (leadData) {
      setProfile(leadData);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [leadData]);

  //for FileUpload
  const dynamicFileUpload = useMemo(() => {
    return userModules.filter(
      (attr) =>
        attr.module_id === 5 && attr.bactive && (attr.attributes_id === 10 || attr.attribute_name === "File attachment")
    );
  }, [userModules]);

  useEffect(() => {
    if (settingsData) {
      // console.log("ProfileCard received settings:", settingsData);
    }
  }, [settingsData]);

  if (isLoadingSettings) {
    return <div>Loading settings...</div>;
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showEditForm &&
        editFormRef.current &&
        !editFormRef.current.contains(event.target)
      ) {
        setShowEditForm(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEditForm]);

  // Fetch users when component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      const companyFilteredUser = user.filter(
        (user) => user.bactive === true || user.bactive === "true"
      );
      setUsers(companyFilteredUser);
    };

    if (leadId) {
      fetchUsers();
    }
  }, [leadId, user]);

  // Fetch attachments
  const fetchAttachments = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${apiEndPoint}/lead-attachments/${leadId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const fetched = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data)
        ? res.data
        : [];
      setAttachments(fetched);
    } catch (err) {
      console.error("Failed to fetch attachments", err);
      setAttachments([]);
    }
  };

  // Fetch assigned to list
  const fetchAssignedToList = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${apiEndPoint}/assigned-to/${leadId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const list = Array.isArray(res?.data) ? res.data : [];
      const sortedList = list
        .slice()
        .sort((a, b) => new Date(b.dcreate_dt) - new Date(a.dcreate_dt));
      setAssignedToList(sortedList);
    } catch (err) {
      console.error("Failed to fetch assigned to list", err);
      setAssignedToList([]);
    }
  };

  useEffect(() => {
    if (leadId) {
      fetchAttachments();
      fetchAssignedToList();
    } else {
      setAttachments([]);
      setAssignedToList([]);
    }
  }, [leadId]);

  // const handleEditLead = async (lead) => {
  //   try {
  //     const token = localStorage.getItem("token");
  //     const user = JSON.parse(localStorage.getItem("user") || "{}");
  //     const companyId = user?.iCompany_id ?? user?.iCompanyId ?? null;

  //     if (!token || !companyId) {
  //       console.error("Token or company ID is missing.");
  //       if (popup?.show)
  //         popup.show("Missing authentication or company info.", {
  //           type: "error",
  //         });
  //       return;
  //     }

  //     const res = await axios.get(`${apiEndPoint}/company/${companyId}`, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });
  //     const companyData = res?.data?.result ?? null;

  //     if (companyData) {
  //       const businessTypeId = Number(companyData?.ibusiness_type);
  //       if (businessTypeId === 1) {
  //         setEditFormType(1);
  //       } else if (businessTypeId === 2) {
  //         setEditFormType(2);
  //       }else if (businessTypeId === 3) {
  // setEditFormType(3);}
  //        else {
  //         setEditFormType(null);
  //       }
  //       setEditingLead(lead);
  //       setShowEditForm(true);
  //     } else {
  //       console.error("Could not find company data.");
  //       if (popup?.show)
  //         popup.show("Could not find company data.", { type: "error" });
  //     }
  //   } catch (err) {
  //     console.error("Error fetching company data:", err);
  //     if (popup?.show)
  //       popup.show("Failed to fetch company data.", { type: "error" });
  //   }
  // };

  // Save profile after edit
 
 const handleEditLead = async (lead) => {
  try {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const companyId = user?.iCompany_id ?? user?.iCompanyId ?? null;

    if (!token || !companyId) {
      console.error("Token or company ID is missing.");
      if (popup?.show)
        popup.show("Missing authentication or company info.", {
          type: "error",
        });
      return;
    }

    const res = await axios.get(`${apiEndPoint}/company/${companyId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const companyData = res?.data?.result ?? null;
    console.log("company data", companyData)

    if (companyData && lead) {
      const isMultiServiceCompany = Number(lead.cindustry_id) === 5;
      
      if (isMultiServiceCompany) {
        setEditFormType(5);  
      } else {
        // Normal forms (unchanged)
        const businessTypeId = Number(companyData?.ibusiness_type);
        if (businessTypeId === 1) {
          setEditFormType(1);
        } else if (businessTypeId === 2) {
          setEditFormType(2);
        } else if (businessTypeId === 3) {
          setEditFormType(3);
        } else {
          setEditFormType(null);
        }
      }
      
      setEditingLead(lead);
      setShowEditForm(true);
    } else {
      console.error("Could not find company data.");
      if (popup?.show)
        popup.show("Could not find company data.", { type: "error" });
    }
  } catch (err) {
    console.error("Error fetching company data:", err);
    if (popup?.show)
      popup.show("Failed to fetch company data.", { type: "error" });
  }
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
      setProfile((prev) => ({ ...(prev ?? {}), ...(updatedFormData ?? {}) }));
      setHistory((prev) => [
        {
          date: new Date().toLocaleString(),
          updatedProfile: updatedFormData,
        },
        ...(Array.isArray(prev) ? prev : []),
      ]);
    } catch (err) {
      console.error("Failed to save profile", err);
      alert("Failed to save profile.");
    }
  };

  // Assign lead handlers
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

    try {
      await axios.post(
        `${apiEndPoint}/assigned-to`,
        {
          iassigned_by: loggedInUserId,
          iassigned_to: userIdToAssign,
          ilead_id: Number(leadId),
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : undefined,
          },
        }
      );

      const isConverted = profile?.bisConverted === true || profile?.bisConverted === "true";
      const successMessage = isConverted   ? "Won Lead assigned successfully." : "Lead assigned successfully.";
      alert(successMessage);

      // refresh assigned list
      fetchAssignedToList();
      const assignedUser = Array.isArray(users)
        ? users.find((user) => String(user.iUser_id) === String(userIdToAssign))
        : null;
      const notifiedPerson = Array.isArray(users)
        ? users.find((user) => String(user.iUser_id) === String(notifyUserId))
        : null;

      if (assignedUser && profile) {
        const mailPayload = {
          userName: assignedUser?.cUser_name ?? assignedUser?.cFull_name ?? "",
          time: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
          }),
          leadName: profile?.clead_name ?? "",
          leadURL: window.location.href,
          mailId: assignedUser?.cEmail ?? "",
          assignedTo:
            assignedUser?.cUser_name ?? assignedUser?.cFull_name ?? "",
          notifyTo: notifiedPerson ? notifiedPerson?.cEmail : null,
        };

        try {
          await axios.post(`${apiEndPoint}/assigned-to-mail`, mailPayload, {
            headers: {
              "Content-Type": "application/json",
              Authorization: token ? `Bearer ${token}` : undefined,
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

  // Dropzone for attachments
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/pdf": [".pdf"], "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"], },
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
          Authorization: token ? `Bearer ${token}` : undefined,
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

  // Render status badge based on props
  const renderStatusBadge = () => {
    if (isLost) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-semibold text-center mt-4">
          LOST LEAD
        </div>
      );
    }
    
    if (isDeal) {
      return (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm font-semibold text-center mt-4">
          CONVERTED TO WON
        </div>
      );
    }
    
    return null;
  };

  if (loading) return <Loader />;
  if (error) return <div className="text-red-500 p-4">{error}</div>;
  if (!profile)
    return <div className="p-4 text-gray-700">No profile found.</div>;

  const latestAssignments = Array.isArray(assignedToList)
    ? assignedToList.slice(0, 2)
    : [];
  const activeUsers = user.filter(
    (user) => user.bactive === true || user.bactive === "true"
  );
  const usersForNotify = activeUsers.filter(
    (user) => String(user?.iUser_id) !== String(selectedAssignToUser)
  );

  const renderWebsite = (url) => {
    if (!url) return <span>-</span>;
    try {
      const safeUrl =
        typeof url === "string" && url.trim() !== ""
          ? url.startsWith("http")
            ? url
            : `https://${url}`
          : null;
      if (!safeUrl) return <span>-</span>;
      return (
        <a
          href={safeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-900 hover:underline w-[180px] break-words text-grey-900"
        >
          {url}
        </a>
      );
    } catch (err) {
      return <span>-</span>;
    }
  };

  return (
    <ErrorBoundary>
      <div className="w-full p-6 lg:p-6 bg-white rounded-3xl shadow-md">
        <div className="flex justify-end w-full"></div>

        <div className="flex items-center justify-between border-b border-gray-100">
          <h2 className="text-xl sm:text-2xl text-grey-600 tracking-tight">
            {profile?.corganization ?? "-"}'s Details
          </h2>
        </div>

        <div className="border-t border-gray-900 my-2 w-full"></div>

        <div className="flex items-center space-x-2 justify-end">
          <button
            onClick={() => setShowDetails(true)}
            className="p-2 rounded-xl bg-blue-900 text-white hover:bg-blue-600 hover:text-gray-800 transition-all duration-300 transform hover:scale-110 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            aria-label="View Full Details"
            title="View Details"
          >
            <FiEye size={18} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              const token = localStorage.getItem("token");
              let detectedRoleId = user?.irol_id || user?.iRole_id || user?.role;
              if (!detectedRoleId && token) {
                try {
                  const base64Payload = token.split(".")[1];
                  const payload = JSON.parse(atob(base64Payload.replace(/-/g, "+").replace(/_/g, "/")));
                  detectedRoleId = payload.irol_id || payload.iRole_id || payload.role_id || payload.role;
                } catch (err) {
                  console.error("Token decode error:", err);
                }
              }

              if (Number(detectedRoleId) === 3) {
                if (popup?.show) {
                  popup.show("Access Denied: As a user, you don't have access to edit. Contact your admin.", {
                    type: "error",
                  });
                } else {
                  alert("Access Denied: As a user, you don't have access to edit. Contact your admin.");
                }
                return; 
              }
              handleEditLead(profile);
            }}
            className="p-2 rounded-xl bg-blue-900 text-white hover:bg-blue-600 transition-all duration-300 transform hover:scale-110 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300"
            aria-label="Edit Profile"
            title="Edit Profile"
          >
            <FiEdit size={18} />
          </button>

         
          {/* <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditLead(profile);
            }}
            className="p-2 rounded-xl bg-blue-900 text-white hover:bg-blue-600 transition-all duration-300 transform hover:scale-110 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300"
            aria-label="Edit Profile"
            title="Edit Profile"
          >
            <FiEdit size={18} />
          </button> */}
          {settingsData?.mail_access && (
            <button
              onClick={() => {
                setIsMailHistoryModalOpen(true);
              }}
              className="p-2 rounded-xl bg-blue-900 text-white hover:bg-blue-600 transition-all duration-300 transform hover:scale-110 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300"
              aria-label="Mail History"
              title="Mail History"
            >
              <FiMail size={18} />
            </button>
          )}
        </div>

        <div className="items-start w-full sm:items-start sm:gap-6 pt-6">
          {/* Profile Info */}
          <div className="flex-1 text-center sm:text-left">
            <div>
              {profile?.isUpdated && (
                <span className="inline-flex items-center px-3 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full transition-all duration-300 transform hover:scale-105">
                  <FiCheckCircle className="w-3 h-3 mr-1" />
                  Edited Profile
                </span>
              )}
            </div>

            <div className="flex mt-6 flex-col sm:flex-row items-center gap-2">
              <h3 className="text-2xl font-bold w-[240px] text-gray-900 break-words">
                {profile?.clead_name ?? "Lead Name"}
              </h3>
            </div>

            <p className="text-sm sm:text-base break-words text-gray-900 mt-1 font-semibold">
              {profile?.corganization ?? "Organization"}
            </p>
          </div>
        </div>

        <div className="text-sm sm:text-base text-gray-700 break-words space-y-3 pt-4">
          <div className="flex items-center gap-3">
            <FiPhone className="text-gray-900 break-words w-4 h-4 sm:w-5 sm:h-5" />
            <span className="break-words text-grey-900 font-bold">
              {profile?.iphone_no ?? "-"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <FiMail className="text-gray-900 break-words w-4 h-4 sm:w-5 sm:h-5" />
            <span className="w-[180px] break-words text-grey-900 font-bold">
              {profile?.cemail ?? "-"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <FiTag className="text-gray-900 break-words w-4 h-4 sm:w-5 sm:h-5" />
            <span className="w-[180px] break-words text-grey-900 font-bold">
              {profile?.lead_status?.clead_name ?? "-"}
            </span>
          </div>

          <div className="flex items-start gap-3">
            <FiMapPin className="text-gray-900 w-4 h-4 sm:w-5 sm:h-5 mt-1" />
            <span className="bw-[180px] break-words text-grey-900">
              {profile?.clead_address1 ?? "-"}
            </span>
          </div>

          <div className="flex items-start gap-3">
            <FiMove className="text-gray-900 w-4 h-4 sm:w-5 sm:h-5 mt-1" />
            <span className="w-[180px] break-words text-grey-900">
              {profile?.clead_address2 ?? "-"}
            </span>
          </div>

          <div className="flex items-start gap-3">
            <TbWorld className="text-gray-900 w-4 h-4 sm:w-5 sm:h-5 mt-1" />
            {renderWebsite(profile?.cwebsite)}
          </div>

          <div className="flex items-start gap-3">
            <FiCodesandbox className="text-gray-900 w-4 h-4 sm:w-5 sm:h-5 mt-1" />
            <span className="w-[180px] break-words text-grey-900">
              {profile?.corganization ?? "-"}
            </span>
          </div>

          {/* Status Badge */}
          {renderStatusBadge()}

          {(profile?.website_lead === true || profile?.remarks) && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl shadow-sm mt-5 text-sm text-green-800 flex flex-col gap-3">
              {profile?.website_lead === true && (
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

              {profile?.remarks && (
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
                    <span className="text-gray-700 font-semibold">
                      Remarks:
                    </span>{" "}
                    {profile?.remarks}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl shadow-sm mt-5 space-y-4">
            {/* Assign To */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5">
              <label
                htmlFor="assignUser"
                className="text-sm font-semibold text-gray-700 min-w-[90px]"
              >
                Assign to:
              </label>
              <div className="relative w-full sm:w-64">
                <select
                  id="assignUser"
                  className={`appearance-none w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm text-gray-800 bg-white shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200 ${
                    profile?.bactive === false || isLost || isDeal
                      ? "bg-gray-100 cursor-not-allowed"
                      : ""
                  }`}
                  onChange={(e) => {
                    if (profile?.bactive === false || isLost || isDeal) return;
                    setSelectedAssignToUser(
                      e.target.value === "" ? null : e.target.value
                    );
                  }}
                  value={selectedAssignToUser ?? ""}
                  disabled={profile?.bactive === false || isLost || isDeal}
                >
                  <option value="" disabled> Select User </option>
                  {activeUsers.map((user) => (
                    <option key={String(user?.iUser_id ?? user?.id ?? Math.random())} value={user?.iUser_id ?? user?.id} >
                      {user?.cUser_name ?? user?.cFull_name ?? "Unnamed"}
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
              <label htmlFor="notifyUser" className="text-sm font-semibold text-gray-700 min-w-[90px]" > Notify to: </label>
              <div className="relative w-full sm:w-64">
                <select
                  id="notifyUser"
                  className={`appearance-none w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm text-gray-800 bg-white shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200 ${
                    profile?.bactive === false || isLost || isDeal
                      ? "bg-gray-100 cursor-not-allowed"
                      : ""
                  }`}
                  onChange={(e) => {
                    if (profile?.bactive === false || isLost || isDeal) return;
                    const userId =
                      e.target.value === "" ? null : e.target.value;
                    setSelectedNotifyToUser(userId);
                  }}
                  value={selectedNotifyToUser ?? ""}
                  disabled={profile?.bactive === false || isLost || isDeal}
                >
                  <option value="">Select User</option>
                  {usersForNotify.map((user) => (
                    <option
                      key={String(user?.iUser_id ?? user?.id ?? Math.random())}
                      value={user?.iUser_id ?? user?.id}
                    >
                      {user?.cUser_name ?? user?.cFull_name ?? "Unnamed"}
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

          {/* Assign Button */}
          {profile?.bactive !== false && !isLost && !isDeal && (
            <div className="flex justify-center mt-4">
              <button
                className="inline-flex items-center px-4 py-2 bg-blue-900 text-white text-sm font-semibold rounded-full hover:bg-blue-700 transition-colors shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={!selectedAssignToUser} onClick={handleAssignButtonClick}
              >
                Assign Lead
              </button>
            </div>
          )}
        </div>

        {/* Assigned to list */}
        <div className="p-4 sm:p-6 bg-gray-50 border border-gray-200 rounded-2xl shadow-sm mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-gray-700"> Lead Assigned to </h3>
            {Array.isArray(assignedToList) && assignedToList.length > 2 && (
              <button onClick={() => setIsAssignedToModalOpen(true)} className="text-blue-600 hover:underline text-sm font-medium" > View All </button>
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
                  key={assignment?.iassigned_id ?? Math.random()}
                  className="text-sm text-gray-800 bg-white border border-gray-200 rounded-lg p-3 shadow-sm"
                >
                  <p>
                    <span className="font-medium">Assigned To:</span>{" "}
                    {assignment?.user_assigned_to_iassigned_toTouser
                      ?.cFull_name ?? "-"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="font-medium">Assigned By:</span>{" "}
                    {assignment?.user_assigned_to_iassigned_byTouser
                      ?.cFull_name ?? "-"}{" "}
                    on{" "}
                    {assignment?.dcreate_dt
                      ? new Date(assignment.dcreate_dt).toLocaleString()
                      : "-"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attachments Section */}
        <div className="p-4 sm:p-6 bg-gray-50 border border-gray-200 rounded-2xl shadow-md mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-4">Manage Attachments</label>
          {dynamicFileUpload.map((i) => (
            <button
              key={i.attributes_id}                   
              onClick={() => setIsAttachmentModalOpen(true)} 
              className="inline-flex items-center px-4 sm:px-6 py-2 bg-blue-900 text-white text-sm font-semibold rounded-full hover:bg-blue-600 transition-colors shadow-md"
            >
              <FiUpload className="mr-2" /> {i.attribute_name}
            </button>
          ))}

          <div className="mt-5 space-y-3">
            {(!Array.isArray(attachments) || attachments.length === 0) && (
              <p className="text-sm text-gray-500 italic"> No attachments uploaded yet. </p>
            )}

            {Array.isArray(attachments) &&
              attachments.map((file) => {
                const filePath =
                  file?.cattechment_path ??
                  file?.attachment_path ??
                  file?.path ??
                  null;
                const filename =
                  typeof filePath === "string"
                    ? filePath.split("/").pop()
                    : file?.file_name ?? "attachment";

                return (
                  <div
                    key={file?.ilead_id ?? file?.id ?? filename}
                    className="text-sm text-gray-800 bg-white border border-gray-200 rounded-lg p-3 shadow-sm flex justify-between items-center"
                  >
                    <span className="font-medium truncate max-w-[70%] sm:max-w-[80%]">
                      {filename}
                    </span>
                    <FilePreviewer
                      filePath={filePath}
                      apiBaseUrl={apiNoEndPoint}
                    />
                  </div>
                );
              })}
          </div>
        </div>

        {/* Attachment Upload Modal */}
        <Dialog open={isAttachmentModalOpen} onClose={() => setIsAttachmentModalOpen(false)} className="relative z-50">
          <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-sm sm:max-w-md bg-white p-6 rounded-2xl shadow-lg">
              <Dialog.Title className="text-lg font-semibold text-gray-800 mb-4"> Upload File
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
                  <p className="text-sm text-gray-700 font-medium"> {selectedFile.name} </p>
                ) : (
                  <>
                    <p className="text-sm text-gray-500"> Drag & drop a file here, or{" "} <span className="text-blue-900 font-medium"> click to select </span> </p>
                    <p className="text-xs text-gray-400">  Only PDF, PNG and JPEG files can be uploaded </p>
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
        <Dialog open={isAssignedToModalOpen}  onClose={() => setIsAssignedToModalOpen(false)} className="relative z-50" >
          <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-sm sm:max-w-md bg-white p-6 rounded-2xl shadow-lg max-h-[90vh] overflow-y-hidden">
              <Dialog.Title className="text-lg font-semibold text-gray-800 mb-4 flex justify-between items-center">
                All Assigned To History
                <button onClick={() => setIsAssignedToModalOpen(false)} className="text-gray-500 hover:text-gray-700 transition-colors" >
                  <FiX size={20} />
                </button>
              </Dialog.Title>

              {!Array.isArray(assignedToList) || assignedToList.length === 0 ? (
                <p className="text-sm text-gray-500 italic"> No assignment history available. </p>
              ) : (
                <div className="space-y-3">
                  {assignedToList.map((assignment) => (
                    <div key={assignment?.iassigned_id ?? Math.random()} className="text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3 shadow-sm" >
                      <p> <span className="font-medium">Assigned To:</span>{" "} {assignment?.user_assigned_to_iassigned_toTouser ?.cFull_name ?? "-"}  </p>
                      <p className="text-xs text-gray-500 mt-1">
                        <span className="font-medium">Assigned By:</span>{" "}
                        {assignment?.user_assigned_to_iassigned_byTouser
                          ?.cFull_name ?? "-"}{" "}
                        on{" "}
                        {assignment?.dcreate_dt
                          ? new Date(assignment.dcreate_dt).toLocaleString()
                          : "-"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Dialog.Panel>
          </div>
        </Dialog>

        {/* Assignment Confirmation Modal */}
        <Dialog open={showAssignConfirmation} onClose={() => setShowAssignConfirmation(false)} className="relative z-50" >
          <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-xs bg-white p-6 rounded-2xl shadow-lg text-center">
              <Dialog.Title className="text-lg font-semibold text-gray-800 mb-4"> Confirm Assignment </Dialog.Title>
              <p className="text-sm text-gray-600 mb-6"> Are you sure you want to assign this lead? </p>
              <div className="flex justify-center space-x-4">
                <button onClick={() => setShowAssignConfirmation(false)} className="px-5 py-2 text-sm font-semibold rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors" >
                  Cancel
                </button>
                <button onClick={confirmAssignment} className="px-5 py-2 text-sm font-semibold rounded-lg text-white bg-blue-700 hover:bg-blue-600 transition-colors">
                  Confirm
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>

        {/* Mail History Modal */}
        <LeadMailStorage
          leadId={leadId}
          isOpen={isMailHistoryModalOpen}
          onClose={() => setIsMailHistoryModalOpen(false)}
        />

        {/* Full Details Modal */}
        <LeadProfileView
          profile={profile}
          showDetails={showDetails}
          onClose={() => setShowDetails(false)}
        />

        <DemoSessionDetails leadId={leadId} />

        {/* Edit Profile Modal */}
        {showEditForm && (
          <div className="fixed inset-0 z-40 bg-black bg-opacity-30 flex justify-center items-center">
            <div ref={editFormRef} className="bg-white p-6 rounded-3xl shadow-2xl w-11/12 md:w-3/4 max-h-[80vh] overflow-y-hidden" >
              {editFormType === 1 && (
                <EditProfileForm
                  profile={editingLead}
                  onClose={() => setShowEditForm(false)}
                  onSave={handleSaveProfile}
                />
              )}
              {editFormType === 2 && (
                <EditProfileForm_Customer
                  profile={editingLead}
                  onClose={() => setShowEditForm(false)}
                  onSave={handleSaveProfile}
                />
              )}
              {editFormType === 3 && (
  <EditProfileFormBoth
    profile={editingLead}
    onClose={() => setShowEditForm(false)}
    onSave={handleSaveProfile}
  />
)}
{editFormType === 5 && (  // 🔥 ADD THIS BLOCK
  <InteriorDesignEditForm
    profile={editingLead}
    onClose={() => setShowEditForm(false)}
    onSave={handleSaveProfile}
  />)}
              {editFormType === null && (
                <div className="p-6">
                  <p className="text-sm text-gray-500"> Unable to determine which edit form to show. </p>
                  <div className="mt-4 flex justify-end">
                    <button onClick={() => setShowEditForm(false)} className="px-4 py-2 bg-gray-200 rounded-lg"> Close </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default ProfileCard;

