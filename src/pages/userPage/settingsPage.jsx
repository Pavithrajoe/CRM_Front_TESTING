import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // Assuming react-router-dom is available for useParams

// --- Placeholder for ENDPOINTS (since external import is not possible) ---
// In a real application, these would come from your API configuration file.
const ENDPOINTS = {
  USER_GET: '/api/user', // Placeholder, adjust as per your backend
  USERS: '/api/users', // Placeholder, adjust as per your backend (for PUT)
  GET_SETTINGS: '/api/settings', // Placeholder, adjust as per your backend
  GENERAL_SETTINGS_UPDATE: '/api/settings', // Placeholder, adjust as per your backend (for PUT/POST)
  UPDATE_PASSWORD: '/api/update-password', // Placeholder, adjust as per your backend
};

// --- Custom Message Display (Replaces react-toastify) ---
const MessageDisplay = ({ message, type, onClose }) => {
  if (!message) return null;

  const typeClasses = {
    success: 'bg-green-100 border-green-400 text-green-700',
    error: 'bg-red-100 border-red-400 text-red-700',
    warn: 'bg-yellow-100 border-yellow-400 text-yellow-700',
    info: 'bg-blue-100 border-blue-400 text-blue-700',
  };

  return (
    <div className={`fixed top-4 right-4 p-3 rounded-md border shadow-lg z-50 text-sm ${typeClasses[type]}`}>
      <div className="flex justify-between items-center">
        <span>{message}</span>
        <button onClick={onClose} className="ml-3 text-base font-bold">
          &times;
        </button>
      </div>
    </div>
  );
};

// --- Reusable InputGroup component ---
const InputGroup = ({ label, placeholder, type = 'text', value, onChange, className = '', hasRightIcon = false, children }) => (
  <div className={`${className}`}>
    <label className="block mb-1 font-semibold text-sm text-gray-800">{label}</label>
    <div className="relative">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        // Adjusted padding for shorter height
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 shadow-sm transition duration-200 text-sm ${
          hasRightIcon ? 'pr-9' : '' // Adjusted right padding for icon
        }`}
      />
      {children}
    </div>
  </div>
);

// --- Reusable Button component ---
const Button = ({ text, onClick, className = '', type = 'button', disabled = false }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    // Adjusted padding and font size for shorter height
    className={`px-4 py-2 text-sm rounded-md font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${className} ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 active:scale-98'
    }`}
  >
    {text}
  </button>
);

// --- Reusable ToggleSwitch component ---
const ToggleSwitch = ({ label, isChecked, onToggle }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
    <span className="text-gray-700 font-medium text-sm">{label}</span>
    <div
      onClick={onToggle}
      // Adjusted width and height for shorter toggle
      className={`relative w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ease-in-out ${
        isChecked ? 'bg-blue-600' : 'bg-gray-300'
      }`}
    >
      <div
        // Adjusted size and translation for shorter toggle
        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
          isChecked ? 'translate-x-4' : 'translate-x-0'
        }`}
      ></div>
    </div>
  </div>
);

const SettingsPage = () => {
  const { userId: urlUserId } = useParams();

  // State for custom message display
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');

  const showMessage = (msg, type = 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000); // Clear message after 3 seconds
  };

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
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Effect to fetch user profile details based on URL userId
  useEffect(() => {
    const fetchUserProfile = async () => {
      // If no userId in URL, use mock data or default empty values
      if (!urlUserId) {
        setName('John Doe'); // Mock data
        setUsername('john.doe'); // Mock data
        setEmail('john.doe@example.com'); // Mock data
        setLoadingProfile(false);
        return;
      }

      setLoadingProfile(true);
      const authToken = localStorage.getItem("token");
      if (!authToken) {
        showMessage("Authentication required to fetch user details.", "error");
        setLoadingProfile(false);
        return;
      }

      try {
        // Using a mock fetch for demonstration as actual API is not available
        const response = await new Promise(resolve => setTimeout(() => {
          resolve({
            ok: true,
            json: () => Promise.resolve({
              cFull_name: "Mock User",
              cUser_name: "mockuser123",
              cEmail: "mock@example.com"
            })
          });
        }, 500));
        // const response = await fetch(`${ENDPOINTS.USER_GET}/${urlUserId}`, {
        //   method: 'GET',
        //   headers: {
        //     'Content-Type': 'application/json',
        //     'Authorization': `Bearer ${authToken}`,
        //   },
        // });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Error fetching user details");

        setName(data.cFull_name || '');
        setUsername(data.cUser_name || '');
        setEmail(data.cEmail || '');
      } catch (err) {
        console.error("Error fetching user details:", err);
        showMessage("Failed to load user profile: " + err.message, "error");
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchUserProfile();
  }, [urlUserId]); // Removed 'users' from dependency array as UserContext is removed

  // Function to fetch general settings
  const fetchGeneralSettings = async () => {
    setLoadingSettings(true);
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      showMessage("Please login to access settings.", "error");
      setLoadingSettings(false);
      return;
    }

    try {
      // Using a mock fetch for demonstration
      const response = await new Promise(resolve => setTimeout(() => {
        resolve({
          ok: true,
          json: () => Promise.resolve({
            result: [{
              whatsapp_active: true,
              mail_active: false,
              website_active: true,
              phone_active: false
            }]
          })
        });
      }, 500));
      // const response = await fetch(ENDPOINTS.GET_SETTINGS, {
      //   method: 'GET',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${authToken}`,
      //   },
      // });

      const data = await response.json();
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
      showMessage("Failed to load settings: " + err.message, "error");
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    fetchGeneralSettings(); // Call on mount
  }, []);

  // Handler for saving user profile changes
  const handleSaveProfileChanges = async () => {
    setIsSavingProfile(true);
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      showMessage("Authentication required to save profile changes.", "error");
      setIsSavingProfile(false);
      return;
    }

    try {
      // Mock fetch
      const profileUpdateResponse = await new Promise(resolve => setTimeout(() => {
        resolve({ ok: true, json: () => Promise.resolve({ message: 'Profile updated successfully!' }) });
      }, 1000));
      // const profileUpdateResponse = await fetch(`${ENDPOINTS.USERS}/${urlUserId}`, {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${authToken}`,
      //   },
      //   body: JSON.stringify({
      //     cFull_name: name,
      //     cUser_name: username,
      //     cEmail: email,
      //   }),
      // });

      const profileUpdateResult = await profileUpdateResponse.json();
      if (!profileUpdateResponse.ok) {
        throw new Error(profileUpdateResult.message || 'Failed to update profile');
      }
      showMessage('Profile updated successfully!', "success");
    } catch (error) {
      console.error('Error saving profile changes:', error);
      showMessage(`Failed to save profile changes: ${error.message}`, "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handler for saving general settings
  const handleSaveGeneralSettings = async () => {
    setIsSavingSettings(true);
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      showMessage("Authentication required to save settings.", "error");
      setIsSavingSettings(false);
      return;
    }

    try {
      // Mock fetch
      let generalSettingsResponse = await new Promise(resolve => setTimeout(() => {
        resolve({ ok: true, json: () => Promise.resolve({ message: 'Settings updated!' }) });
      }, 1000));
      // let generalSettingsResponse = await fetch(ENDPOINTS.GENERAL_SETTINGS_UPDATE, {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${authToken}`,
      //   },
      //   body: JSON.stringify({
      //     whatsapp_active: whatsappActive,
      //     mail_active: mailActive,
      //     website_active: websiteActive,
      //     phone_active: phoneActive,
      //   }),
      // });

      if (!generalSettingsResponse.ok) {
        const errorData = await generalSettingsResponse.json();
        if (generalSettingsResponse.status === 404 && errorData.error === "General setting not found for this user and company") {
          console.warn("General setting not found, attempting to create it via POST...");
          // Mock POST fetch
          generalSettingsResponse = await new Promise(resolve => setTimeout(() => {
            resolve({ ok: true, json: () => Promise.resolve({ message: 'Settings created!' }) });
          }, 1000));
          // generalSettingsResponse = await fetch(ENDPOINTS.GENERAL_SETTINGS_UPDATE, {
          //   method: 'POST',
          //   headers: {
          //     'Content-Type': 'application/json',
          //     'Authorization': `Bearer ${authToken}`,
          //   },
          //   body: JSON.stringify({
          //     whatsapp_active: whatsappActive,
          //     mail_active: mailActive,
          //     website_active: websiteActive,
          //     phone_active: phoneActive,
          //   }),
          // });

          if (!generalSettingsResponse.ok) {
            throw new Error(errorData.message || generalSettingsResponse.statusText || 'Failed to create general settings');
          }
        } else {
          throw new Error(errorData.message || generalSettingsResponse.statusText || 'Failed to update general settings');
        }
      }
      showMessage('General settings saved successfully!', "success");
      // Re-fetch settings after successful save to ensure UI reflects backend state
      await fetchGeneralSettings(); 
    } catch (gsError) {
      console.error('Error with general settings operation:', gsError);
      showMessage(`Failed to save general settings: ${gsError.message}`, "error");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Handler for changing password
  const handleChangePassword = async () => {
    setIsSavingPassword(true);
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      showMessage("Authentication required.", "error");
      setIsSavingPassword(false);
      return;
    }

    if (!currentPassword || !newPassword) {
      showMessage("Please fill both current and new passwords.", "warn");
      setIsSavingPassword(false);
      return;
    }

    if (newPassword.length < 6) {
      showMessage("New password must be at least 8 characters.", "warn");
      setIsSavingPassword(false);
      return;
    }

    try {
      // Mock fetch
      const response = await new Promise(resolve => setTimeout(() => {
        resolve({ ok: true, json: () => Promise.resolve({ message: 'Password updated successfully.' }) });
      }, 1000));
      // const response = await fetch(ENDPOINTS.UPDATE_PASSWORD, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${authToken}`,
      //   },
      //   body: JSON.stringify({
      //     email: email,
      //     password: newPassword,
      //     // currentPassword: currentPassword, // Uncomment if your backend requires current password for verification
      //   }),
      // });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to update password');

      setCurrentPassword('');
      setNewPassword('');
      showMessage('Password updated successfully.', "success");
    } catch (error) {
      console.error('Password update error:', error);
      showMessage(`Password update failed: ${error.message}`, "error");
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Handler for uploading picture
  const handleUploadPicture = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      showMessage("File exceeds 500kb.", "error");
      return;
    }

    showMessage(`Selected file "${file.name}" for upload. (Upload functionality is mocked)`, "info");
    // Here you would typically send the file to an API endpoint for image upload
  };

  const isLoading = loadingProfile || loadingSettings;

  return (
    <div className="p-6 md:p-6 bg-gray-100 min-h-screen"> {/* Adjusted overall padding */}
      <div className="bg-white p-5 md:p-6 space-y-4 rounded-xl shadow-xl w-full mx-auto border border-gray-200"> {/* Adjusted section padding */}
        
        {/* User Profile Settings Section */}
        <section className="mb-6 pb-4 border-b space-y-6 border-gray-200"> {/* Adjusted section padding */}
          <h2 className="text-2xl md:text-3xl font-extrabold mb-6 space-y-6 text-blue-900 border-b-4 border-blue-400 pb-2 text-center tracking-tight animate-fade-in-down">User Profile Settings</h2> {/* Adjusted heading size */}
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-9 bg-gray-200 rounded-md mb-4"></div> {/* Adjusted loading placeholder height */}
              <div className="h-9 bg-gray-200 rounded-md mb-4"></div>
              <div className="h-9 bg-gray-200 rounded-md mb-4"></div>
            </div>
          ) : (
            <div className="flex flex-col space-y-4 md:flex-row gap-10"> {/* Adjusted gap */}
              <div className="flex-grow space-y-4">
                <InputGroup label="Full Name" placeholder="Enter your full name" value={name} onChange={(e) => setName(e.target.value)} />
                <InputGroup label="Username" placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} />
                <InputGroup label="Email ID" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div className="md:w-56 text-center p-3 border border-dashed border-gray-300 rounded-lg bg-gray-50 flex flex-col items-center justify-center"> {/* Adjusted width and padding */}
                <h3 className="text-base font-medium mb-3 text-gray-700">Profile Picture</h3> {/* Adjusted heading size */}
                <label
                  htmlFor="picture-upload"
                  className="flex flex-col items-center justify-center w-32 h-32 border-2 border-gray-300 border-dashed rounded-full mx-auto cursor-pointer bg-white hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200 text-gray-500 hover:text-blue-600 shadow-sm"
                >
                  {/* Inline SVG for FaCloudUploadAlt */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-8 h-8 fill-current"> {/* Adjusted icon size */}
                    <path d="M288 109.3V352c0 17.7-14.3 32-32 32s-32-14.3-32-32V109.3L135.2 185.7c-9.2 9.2-22.9 11.9-34.9 6.9s-19.8-16.6-19.8-29.6V128c0-17.7 14.3-32 32-32H384c17.7 0 32 14.3 32 32v34.9c0 13-10.9 23.8-23.8 23.8s-23.8-10.9-23.8-23.8V109.3L288 109.3zM256 80c-17.7 0-32 14.3-32 32v128c0 17.7 14.3 32 32 32s32-14.3 32-32V112c0-17.7-14.3-32-32-32zM256 416c-17.7 0-32 14.3-32 32s14.3 32 32 32h192c17.7 0 32-14.3 32-32s-14.3-32-32-32H256z"/>
                  </svg>
                  <span className="mt-1 text-xs">Upload Image</span> {/* Adjusted text size and margin */}
                  <input id="picture-upload" type="file" accept="image/*" onChange={handleUploadPicture} className="hidden" />
                </label>
                <p className="text-xs text-gray-500 mt-1">Max size 500kb</p> {/* Adjusted text size and margin */}
              </div>
            </div>
          )}
          {/* Save Profile Changes Button - Stays with Profile Section */}
          <div className="flex justify-center mt-6 p-6"> {/* Adjusted margin-top */}
            <Button
              text={isSavingProfile ? 'Saving Profile...' : 'Save Profile Changes'}
              onClick={handleSaveProfileChanges}
              disabled={isSavingProfile}
              className="bg-black text-white hover:bg-gray-800 p-2 py-4 text-lg  focus:ring-gray-900 w-150px rounded-xl max-w-xs shadow-lg"
            />
          </div>
        </section>

        {/* --- Section Line --- */}
        <hr className="my-6 border-gray-300" /> {/* Adjusted margin */}

        {/* Password Management Section */}
        <section className="mb-6 pb-4 border-b space-y-4 border-gray-200"> {/* Adjusted section padding */}
          <h2 className="text-xl font-bold mb-5 text-gray-900">Password Management</h2> {/* Adjusted heading size */}
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-9 bg-gray-200 rounded-md mb-4"></div>
              <div className="h-9 bg-gray-200 rounded-md mb-4"></div>
            </div>
          ) : (
            <>
              {/* Current Password Field with Eye Icon INSIDE */}
              <div className="mb-4"> {/* Adjusted margin-bottom */}
                <InputGroup
                  label="Current Password"
                  placeholder="Enter your current password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  hasRightIcon={true} 
                >
                  <div
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer p-0.5" // Adjusted position and padding
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {/* Inline SVG for Eye / EyeOff */}
                    {showCurrentPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye-off">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a1.8 1.8 0 0 1 0-.31M22 12s-3 7-10 7a9.76 9.76 0 0 1-2.5-3.15"/><path d="M6.76 6.76A3 3 0 1 0 12 12"/><path d="m2 2 20 20"/>
                      </svg>
                    )}
                  </div>
                </InputGroup>
              </div>

              <div className="flex flex-col sm:flex-row items-end gap-3 mb-4"> {/* Adjusted gap and margin */}
                <InputGroup
                  label="New Password"
                  placeholder="Enter new password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="flex-grow" 
                  hasRightIcon={true} 
                >
                  <div
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer p-0.5" // Adjusted position and padding
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {/* Inline SVG for Eye / EyeOff */}
                    {showNewPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye-off">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a1.8 1.8 0 0 1 0-.31M22 12s-3 7-10 7a9.76 9.76 0 0 1-2.5-3.15"/><path d="M6.76 6.76A3 3 0 1 0 12 12"/><path d="m2 2 20 20"/>
                      </svg>
                    )}
                  </div>
                </InputGroup>
                <Button
                  text={isSavingPassword ? 'Updating...' : 'Update Password'}
                  onClick={handleChangePassword}
                  disabled={isSavingPassword}
                  className="bg-blue-900 text-white hover:bg-blue-700 focus:ring-blue-500 min-w-[120px]" // Adjusted min-width
                />
              </div>
            </>
          )}
        </section>

        {/* Preferences Section */}
        <section className="mb-6 pt-4"> {/* Adjusted padding */}
          <h2 className="text-xl font-bold mb-5 text-gray-900">Communication Preferences</h2> {/* Adjusted heading size */}
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-9 bg-gray-200 rounded-md my-2"></div> {/* Adjusted loading placeholder height and margin */}
              <div className="h-9 bg-gray-200 rounded-md my-2"></div>
              <div className="h-9 bg-gray-200 rounded-md my-2"></div>
              <div className="h-9 bg-gray-200 rounded-md my-2"></div>
            </div>
          ) : (
            <>
              <ToggleSwitch label="Deactivate WhatsApp" isChecked={!whatsappActive} onToggle={() => setWhatsappActive(!whatsappActive)} />
              <ToggleSwitch label="Deactivate Mail" isChecked={!mailActive} onToggle={() => setMailActive(!mailActive)} />
              <ToggleSwitch label="Deactivate Website" isChecked={!websiteActive} onToggle={() => setWebsiteActive(!websiteActive)} />
              <ToggleSwitch label="Deactivate Phone" isChecked={!phoneActive} onToggle={() => setPhoneActive(!phoneActive)} />
            </>
          )}
          {/* Save General Settings Button - Stays with Preferences Section */}
          <div className="flex justify-center mt-6"> {/* Adjusted margin-top */}
            <Button
              text={isSavingSettings ? 'Saving Settings...' : 'Save Preferences'}
              onClick={handleSaveGeneralSettings}
              disabled={isSavingSettings}
              className="bg-black text-white text-lg hover:bg-gray-800 focus:ring-gray-900 w-150px py-3 max-w-xs shadow-lg"
            />
          </div>
        </section>
      </div>

      {/* Custom Message Display */}
      <MessageDisplay message={message} type={messageType} onClose={() => setMessage('')} />
    </div>
  );
};

export default SettingsPage;
