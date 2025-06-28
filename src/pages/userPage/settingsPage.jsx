import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { FaCloudUploadAlt } from 'react-icons/fa';
import { Eye, EyeOff } from 'lucide-react'; // Ensure lucide-react is installed: npm install lucide-react
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Correct path and casing
import { UserContext } from '../../context/UserContext'; // Adjust path as needed
import { ENDPOINTS } from '../../api/constraints'; // Adjust path as needed

// --- Reusable InputGroup component (Modified for internal icon) ---
// Note: Removed mb-5 from here, parent container will manage margin/gap
const InputGroup = ({ label, placeholder, type = 'text', value, onChange, className = '', hasRightIcon = false, children }) => (
  <div className={`${className}`}> {/* Removed mb-5 here */}
    <label className="block mb-2 font-semibold text-sm text-gray-800">{label}</label>
    <div className="relative"> {/* This div is now relative to contain the absolutely positioned icon */}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        // Conditional padding-right to make space for the icon
        className={`w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 shadow-sm transition duration-200 ${
          hasRightIcon ? 'pr-10' : '' // Add right padding if an icon is expected
        }`}
      />
      {children} {/* Renders any children passed into InputGroup (like the Eye icon) */}
    </div>
  </div>
);

// --- Reusable Button component (Sharpened) ---
const Button = ({ text, onClick, className = '', type = 'button', disabled = false }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`px-6 py-2.5 rounded-md font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${className} ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 active:scale-98'
    }`}
  >
    {text}
  </button>
);

// --- Reusable ToggleSwitch component (Sharpened) ---
const ToggleSwitch = ({ label, isChecked, onToggle }) => (
  <div className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0">
    <span className="text-gray-700 font-medium">{label}</span>
    <div
      onClick={onToggle}
      className={`relative w-12 h-7 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ease-in-out ${
        isChecked ? 'bg-blue-600' : 'bg-gray-300' // Distinct active color
      }`}
    >
      <div
        className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
          isChecked ? 'translate-x-5' : 'translate-x-0'
        }`}
      ></div>
    </div>
  </div>
);

const SettingsPage = () => {
  const { userId: urlUserId } = useParams();
  const { users } = useContext(UserContext);

  // State for user profile inputs
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // State for general settings toggles
  const [whatsappActive, setWhatsappActive] = useState(false);
  const [mailActive, setMailActive] = useState(false);
  const [websiteActive, setWebsiteActive] = useState(false);
  const [phoneActive, setPhoneActive] = useState(false);

  // Loading states for data fetching
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false); // To disable save button during API call

  // Effect to fetch user profile details based on URL userId
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!urlUserId) {
        if (users && users.length > 0) {
          setName(users[0].cFull_name || '');
          setUsername(users[0].cUser_name || '');
          setEmail(users[0].cEmail || '');
        }
        setLoadingProfile(false);
        return;
      }

      setLoadingProfile(true);
      const authToken = localStorage.getItem("token");
      if (!authToken) {
        toast.error("Authentication required to fetch user details.");
        setLoadingProfile(false);
        return;
      }

      try {
        const response = await fetch(`${ENDPOINTS.USER_GET}/${urlUserId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Error fetching user details");

        setName(data.cFull_name || '');
        setUsername(data.cUser_name || '');
        setEmail(data.cEmail || '');
      } catch (err) {
        console.error("Error fetching user details:", err);
        toast.error("Failed to load user profile: " + err.message);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchUserProfile();
  }, [urlUserId, users]);

  // Function to fetch general settings
  const fetchGeneralSettings = async () => {
    setLoadingSettings(true);
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      toast.error("Please login to access settings.");
      setLoadingSettings(false);
      return;
    }

    try {
      const response = await fetch(ENDPOINTS.GET_SETTINGS, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const data = await response.json();
      console.log("General settings data received from API on page load/after save:", data);

      if (!response.ok) throw new Error(data.message || "Error fetching settings");
      
      const settings = data.result && Array.isArray(data.result) && data.result.length > 0
                       ? data.result[0]
                       : {};

      setWhatsappActive(settings.whatsapp_active || false);
      setMailActive(settings.mail_active || false);
      setWebsiteActive(settings.website_active || false);
      setPhoneActive(settings.phone_active || false);
    } catch (err) {
      console.error("Error fetching general settings:", err);
      toast.error("Failed to load settings: " + err.message);
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    fetchGeneralSettings(); // Call on mount
  }, []);

  // Handler for saving all changes
  const handleSaveChanges = async () => {
    setIsSaving(true);
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      toast.error("Authentication required to save changes.");
      setIsSaving(false);
      return;
    }

    try {
      // --- User Profile Update ---
      const profileUpdateResponse = await fetch(`${ENDPOINTS.USERS}/${urlUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          cFull_name: name,
          cUser_name: username,
          cEmail: email,
        }),
      });

      const profileUpdateResult = await profileUpdateResponse.json();
      if (!profileUpdateResponse.ok) {
        throw new Error(profileUpdateResult.message || 'Failed to update profile');
      }

      // --- General Settings Update/Create ---
      try {
        let generalSettingsResponse = await fetch(ENDPOINTS.GENERAL_SETTINGS_UPDATE, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            whatsapp_active: whatsappActive,
            mail_active: mailActive,
            website_active: websiteActive,
            phone_active: phoneActive,
          }),
        });

        if (!generalSettingsResponse.ok) {
          const errorData = await generalSettingsResponse.json();
          if (generalSettingsResponse.status === 404 && errorData.error === "General setting not found for this user and company") {
            console.warn("General setting not found, attempting to create it via POST...");
            generalSettingsResponse = await fetch(ENDPOINTS.GENERAL_SETTINGS_UPDATE, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
              },
              body: JSON.stringify({
                whatsapp_active: whatsappActive,
                mail_active: mailActive,
                website_active: websiteActive,
                phone_active: phoneActive,
              }),
            });

            if (!generalSettingsResponse.ok) {
              throw new Error(errorData.message || generalSettingsResponse.statusText || 'Failed to create general settings');
            }
          } else {
            throw new Error(errorData.message || generalSettingsResponse.statusText || 'Failed to update general settings');
          }
        }
      } catch (gsError) {
        console.error('Error with general settings operation:', gsError);
        toast.error(`Failed to save general settings: ${gsError.message}`);
      }

      toast.success('Changes saved successfully!');
      
      // Re-fetch settings after successful save to ensure UI reflects backend state
      await fetchGeneralSettings(); 

    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error(`Failed to save changes: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Placeholder for email change functionality
  const handleChangeEmail = async () => {
    toast.info('Email change functionality triggered. (Backend implementation needed for verification)');
  };

  // Handler for changing password
  const handleChangePassword = async () => {
    const authToken = localStorage.getItem("token");
    if (!authToken) return toast.error("Authentication required.");

    if (!currentPassword || !newPassword) {
      toast.warn("Please fill both current and new passwords.");
      return;
    }

    if (newPassword.length < 8) {
      toast.warn("New password must be at least 8 characters.");
      return;
    }

    try {
      const response = await fetch(ENDPOINTS.UPDATE_PASSWORD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          email: email,
          password: newPassword,
          // currentPassword: currentPassword, // Uncomment if your backend requires current password for verification
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to update password');

      setCurrentPassword('');
      setNewPassword('');
      toast.success('Password updated successfully.');
    } catch (error) {
      console.error('Password update error:', error);
      toast.error(`Password update failed: ${error.message}`);
    }
  };

  // Handler for uploading picture
  const handleUploadPicture = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      toast.error("File exceeds 500kb.");
      return;
    }

    toast.info(`Selected file "${file.name}" for upload.`);
    // Here you would typically send the file to an API endpoint for image upload
  };

  const isLoading = loadingProfile || loadingSettings;

  return (
    <div className="p-4 md:p-6 bg-gray-100 min-h-screen">
      <div className="bg-white p-6 md:p-8 space-y-5 rounded-xl shadow-xl w-full mx-auto border border-gray-200">
        
        {/* User Profile Settings Section */}
        <section className="mb-8 pb-6 border-b space-y-5 border-gray-200">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-8 text-blue-900 border-b-4 border-blue-400 pb-3 text-center tracking-tight animate-fade-in-down">User Profile Settings</h2>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded-md mb-5"></div>
              <div className="h-10 bg-gray-200 rounded-md mb-5"></div>
              <div className="h-10 bg-gray-200 rounded-md mb-5"></div>
              <div className="h-10 bg-gray-200 rounded-md mb-5"></div>
              <div className="h-10 bg-gray-200 rounded-md mb-5"></div>
            </div>
          ) : (
            <div className="flex flex-col space-y-5 md:flex-row gap-8">
              <div className="flex-grow space-y-5">
                <InputGroup label="Full Name" placeholder="Enter your full name" value={name} onChange={(e) => setName(e.target.value)} />
                <InputGroup label="Username" placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} />
                
                <div className="flex flex-col sm:flex-row items-end gap-4 mb-5">
                  <InputGroup
                    label="Email ID"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-grow"
                  />
                  {/* <Button text="Change Email" onClick={handleChangeEmail} className="bg-gray-700 text-white w-full sm:w-auto" /> */}
                </div>

                {/* Current Password Field with Eye Icon INSIDE */}
                <div className="mb-5"> {/* This div adds the margin-bottom for spacing below this password field */}
                  <InputGroup
                    label="Current Password"
                    placeholder="Enter your current password"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    hasRightIcon={true} 
                  >
                    {/* The Eye icon rendered as a child of InputGroup */}
                    <div
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer p-1"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </div>
                  </InputGroup>
                </div>

                {/* --- CORRECTED ALIGNMENT FOR NEW PASSWORD FIELD AND BUTTON --- */}
                {/* Both the InputGroup and Button are now siblings within this flex container, which also provides the mb-5 */}
                <div className="flex flex-col sm:flex-row items-end gap-4 mb-5"> {/* This div now handles the bottom margin */}
                  <InputGroup
                    label="New Password"
                    placeholder="Enter new password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="flex-grow" /* Allows input to take up available space */
                    hasRightIcon={true} /* Tell InputGroup to make space for the icon */
                  >
                    {/* The Eye icon rendered as a child of InputGroup */}
                    <div
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer p-1"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </div>
                  </InputGroup>
                  {/* The Button is now a direct flex item alongside the InputGroup */}
                  <Button
                    text="Update Password"
                    onClick={handleChangePassword}
                    className="bg-blue-900 text-white hover:bg-blue-700 focus:ring-blue-500 min-w-[150px]" /* Added min-w to prevent button from shrinking too much on smaller screens if text is long */
                  />
                </div>
              </div>

              <div className="md:w-64 text-center p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50 flex flex-col items-center justify-center">
                <h3 className="text-lg font-medium mb-4 text-gray-700">Profile Picture</h3>
                <label
                  htmlFor="picture-upload"
                  className="flex flex-col items-center justify-center w-36 h-36 border-2 border-gray-300 border-dashed rounded-full mx-auto cursor-pointer bg-white hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200 text-gray-500 hover:text-blue-600 shadow-sm"
                >
                  <FaCloudUploadAlt className="text-4xl" />
                  <span className="mt-2 text-sm">Upload Image</span>
                  <input id="picture-upload" type="file" accept="image/*" onChange={handleUploadPicture} className="hidden" />
                </label>
                <p className="text-xs text-gray-500 mt-2">Max size 500kb</p>
              </div>
            </div>
          )}
        </section>

        {/* Preferences Section */}
        <section className="mb-8 pt-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Preferences</h2>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded-md my-3"></div>
              <div className="h-10 bg-gray-200 rounded-md my-3"></div>
              <div className="h-10 bg-gray-200 rounded-md my-3"></div>
              <div className="h-10 bg-gray-200 rounded-md my-3"></div>
            </div>
          ) : (
            <>
              <ToggleSwitch label="WhatsApp Active" isChecked={whatsappActive} onToggle={() => setWhatsappActive(!whatsappActive)} />
              <ToggleSwitch label="Mail Active" isChecked={mailActive} onToggle={() => setMailActive(!mailActive)} />
              <ToggleSwitch label="Website Active" isChecked={websiteActive} onToggle={() => setWebsiteActive(!websiteActive)} />
              <ToggleSwitch label="Phone Active" isChecked={phoneActive} onToggle={() => setPhoneActive(!phoneActive)} />
            </>
          )}
        </section>

        {/* Save Changes Button */}
        <div className="flex justify-center mt-8">
          <Button
            text={isSaving ? 'Saving...' : 'Save All Changes'}
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="bg-black text-white hover:bg-gray-800 focus:ring-gray-900 w-full max-w-xs shadow-lg"
          />
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
    </div>
  );
};

export default SettingsPage;