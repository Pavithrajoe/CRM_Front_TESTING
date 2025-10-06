import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { FaCloudUploadAlt } from 'react-icons/fa';
import { Eye, EyeOff } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { UserContext } from '../../context/UserContext';
import { ENDPOINTS } from '../../api/constraints';

// --- Shared Components ---

const InputGroup = ({ 
  label, 
  placeholder, 
  type = 'text', 
  value, 
  onChange, 
  className = '', 
  hasRightIcon = false, 
  children,
  maxLength = 60,
  validationError = '',
  onBlur
}) => (
  <div className={`${className}`}>
    <label className="block mb-2 font-semibold text-sm text-gray-800">
      {label}
      {maxLength && (
        <span className="text-xs text-gray-500 ml-1">
          ({value.length}/{maxLength})
        </span>
      )}
    </label>
    <div className="relative">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        onBlur={onBlur}
        className={`w-full px-4 py-2.5 border ${
          validationError ? 'border-red-500' : 'border-gray-300'
        } rounded-xl focus:outline-none focus:ring-2 ${
          validationError ? 'focus:ring-red-500' : 'focus:ring-blue-500'
        } focus:border-transparent text-gray-900 placeholder-gray-500 shadow-sm transition duration-200 ${
          hasRightIcon ? 'pr-10' : ''
        }`}
      />
      {children}
      {validationError && (
        <p className="mt-1 text-xs text-red-500">{validationError}</p>
      )}
    </div>
  </div>
);

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

const ToggleSwitch = ({ label, isChecked, onToggle }) => (
  <div className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0">
    <span className="text-gray-700 font-medium">{label}</span>
    <div
      onClick={onToggle}
      className={`relative w-12 h-7 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ease-in-out ${
        isChecked ? 'bg-blue-600' : 'bg-gray-300'
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

// --- SettingsPage Component ---

const SettingsPage = ({ settingsData }) => {
  const { userId: urlUserId } = useParams();
  const { users } = useContext(UserContext);

  // This state holds the *master* settings to determine if a toggle should be shown
  const [settingsProps, setSettingsProps] = useState({
    mail_active: false,
    phone_active: false,
    website_active: false,
    whatsapp_active: false,
  });

  // Profile fields state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  
  // Password fields state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Communication Channel Toggle states (Current User Access)
  const [whatsappActive, setWhatsappActive] = useState(false);
  const [mailActive, setMailActive] = useState(false);
  const [websiteActive, setWebsiteActive] = useState(false);
  const [phoneActive, setPhoneActive] = useState(false);

  // Loading and Saving states
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Validation Error states
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [usernameError, setUsernameError] = useState('');

  // 1. Fetch User Profile Details (Name, Email, initial Toggle values)
  useEffect(() => {
    const fetchUserProfile = async () => {
      // Logic for user without URL ID (e.g., current logged-in user from context)
      if (!urlUserId) {
        if (users && users.length > 0) {
          const user = users[0];
          setName(user.cFull_name || '');
          setUsername(user.cUser_name || '');
          setEmail(user.cEmail || '');
          // Set initial toggle states from user profile
          setWhatsappActive(user.whatsapp_access || false);
          setMailActive(user.mail_access || false);
          setWebsiteActive(user.website_access || false);
          setPhoneActive(user.phone_access || false);
        }
        setLoadingProfile(false);
        return;
      }

      // Logic for fetching profile by URL ID
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
        // Set initial toggle states from user profilez
        setWhatsappActive(data.whatsapp_access || false);
        setMailActive(data.mail_access || false);
        setWebsiteActive(data.website_access || false);
        setPhoneActive(data.phone_access || false);
      } catch (err) {
        console.error("Error fetching user details:", err);
        toast.error("Failed to load user profile: " + err.message);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchUserProfile();
  }, [urlUserId, users]);

  // 2. Fetch General Settings (Master Channel Activation - Determines if toggle is shown)
  const fetchGeneralSettings = async () => {
    setLoadingSettings(true);
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      // User must be logged in, handled by parent/profile fetch, but good for redundancy
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
      if (!response.ok) throw new Error(data.message || "Error fetching settings");
      
      const settings = data.result && !Array.isArray(data.result) 
        ? data.result
        : (Array.isArray(data.result) && data.result.length > 0) ? data.result[0] : {};

      const updatedSettings = {
        whatsapp_active: settings.whatsapp_active || false,
        mail_active: settings.mail_active || false,
        website_active: settings.website_active || false,
        phone_active: settings.phone_active || false,
      };

      // Set the master settings that control visibility
      setSettingsProps(updatedSettings);

    } catch (err) {
      console.error("Error fetching general settings:", err);
      toast.error("Failed to load general settings: " + err.message);
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    fetchGeneralSettings();
  }, []);

  // Use the optional prop settingsData if provided (e.g., from a parent component)
  useEffect(() => {
    if (settingsData && settingsData.result) {
      const result = settingsData.result;

      const updatedSettings = {
        whatsapp_active: result.whatsapp_active || false,
        mail_active: result.mail_active || false,
        website_active: result.website_active || false,
        phone_active: result.phone_active || false,
      };
      // Overwrite master settings if settingsData prop is provided
      setSettingsProps(updatedSettings);
    }
  }, [settingsData]);


  // --- Validation Handlers ---

  const validateName = () => {
    if (!name.trim()) {
      setNameError('Full Name is required');
      return false;
    }
    if (name.length > 60) {
      setNameError('Full Name must be 60 characters or less');
      return false;
    }
    setNameError('');
    return true;
  };

  const validateEmail = () => {
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }
    if (email.length > 60) {
      setEmailError('Email must be 60 characters or less');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validateUsername = () => {
    if (username.length > 60) {
      setUsernameError('Username must be 60 characters or less');
      return false;
    }
    setUsernameError('');
    return true;
  };

  const handleNameBlur = () => validateName();
  const handleEmailBlur = () => validateEmail();
  const handleUsernameBlur = () => validateUsername();

  const handleNameChange = (e) => {
    if (e.target.value.length <= 60) {
      setName(e.target.value);
    }
  };

  const handleEmailChange = (e) => {
    if (e.target.value.length <= 60) {
      setEmail(e.target.value);
    }
  };

  const handleUsernameChange = (e) => {
    if (e.target.value.length <= 60) {
      setUsername(e.target.value);
    }
  };

  // --- API Handlers ---

  // Handler for Profile Information changes (Name, Username, Email)
  const handleSaveChanges = async () => {
    const isNameValid = validateName();
    const isEmailValid = validateEmail();
    const isUsernameValid = validateUsername();

    if (!isNameValid || !isEmailValid || !isUsernameValid) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    setIsSaving(true);
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      toast.error("Authentication required to save changes.");
      setIsSaving(false);
      return;
    }

    try {
      // NOTE: Removed channel access properties here, as they are handled by updateCallLogAccess
      const response = await fetch(`${ENDPOINTS.USERS}/${urlUserId}`, {
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

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update profile');
      }

      toast.success('Profile changes saved successfully!');
      
    } catch (error) {
      console.error('Error saving profile changes:', error);
      toast.error(`Failed to save profile changes: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };
  

  // Handler for Password changes
  const handleChangePassword = async () => {
    const authToken = localStorage.getItem("token");
    if (!authToken) return toast.error("Authentication required.");

    if (!currentPassword || !newPassword) {
      toast.warn("Please fill both current and new passwords.");
      return;
    }

    if (newPassword.length < 6) {
      toast.warn("New password must be at least 6 characters.");
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
          email: email, // Assuming the API uses email to identify the user for password change
          password: newPassword, // The API seems to just take the new password for update.
          // Ideally this should include the currentPassword for verification.
          // current_password: currentPassword, // <-- Add this if your API supports it!
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

  // Handler for Communication Channel Toggles
  const updateCallLogAccess = async (newMailActive, newPhoneActive, newWebsiteActive, newWhatsappActive) => {
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      toast.error("Authentication required.");
      return false;
    }
    if (!urlUserId) {
        toast.error("User ID is required for access update.");
        return false;
    }

    try {
      const response = await fetch(ENDPOINTS.CALLLOG_ACCESS, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: Number(urlUserId),
          isMailActive: newMailActive,
          isPhoneActive: newPhoneActive,
          isWebsiteActive: newWebsiteActive,
          isWhatsappActive: newWhatsappActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update call log access');
      }

      // Update state with the confirmed values from the server response
      if (data.result) {
        setMailActive(data.result.isMailActive || false);
        setPhoneActive(data.result.isPhoneActive || false);
        setWebsiteActive(data.result.isWebsiteActive || false);
        setWhatsappActive(data.result.isWhatsappActive || false);
      }

      toast.success(data.Message || "Access saved successfully.");
      return true;
    } catch (error) {
      console.error('Error updating call log access:', error);
      toast.error(`Failed to update access: ${error.message}`);
      return false;
    }
  };

  // Unified toggle handler
  const handleToggle = async (type) => {
    // Determine the new state for the specific toggle and prepare the full payload
    let newState = {
      mail: mailActive,
      phone: phoneActive,
      website: websiteActive,
      whatsapp: whatsappActive
    };

    const toggleSetter = {
        'whatsapp': setWhatsappActive,
        'mail': setMailActive,
        'website': setWebsiteActive,
        'phone': setPhoneActive,
    };

    // Calculate the new value for the toggled item
    const currentValue = newState[type];
    const newValue = !currentValue;
    newState[type] = newValue;

    // Optimistic UI update
    toggleSetter[type](newValue);

    // Sync with server using the calculated new states for all four
    const success = await updateCallLogAccess(
        newState.mail,
        newState.phone,
        newState.website,
        newState.whatsapp
    );

    if (!success) {
      // Revert state if API call failed
      toggleSetter[type](currentValue);
    }
  };

  const handleUploadPicture = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      toast.error("File exceeds 500kb.");
      return;
    }

    toast.info(`Selected file "${file.name}" for upload.`);
  };

  const isLoading = loadingProfile || loadingSettings;

  return (
    <div className="">
      <div className="bg-white p-6 space-y-8 rounded-xl w-full mx-auto">
        <section className="animate-fade-in-down">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-blue-900 border-b-4 border-blue-400 pb-3 text-center tracking-tight">
            Personal Information
          </h2>
          {isLoading ? (
            <div className="animate-pulse space-y-5">
              <div className="h-10 bg-gray-200 rounded-md"></div>
              <div className="h-10 bg-gray-200 rounded-md"></div>
              <div className="h-10 bg-gray-200 rounded-md"></div>
              <div className="h-10 bg-gray-200 rounded-md"></div>
            </div>
          ) : (
            <div className="flex flex-col space-y-5 md:flex-row md:space-y-0 md:gap-8">
              <div className="flex-grow space-y-5">
                <InputGroup 
                  label="Full Name" 
                  placeholder="Enter your full name" 
                  value={name} 
                  onChange={handleNameChange}
                  onBlur={handleNameBlur}
                  validationError={nameError}
                  maxLength={60}
                />
                <InputGroup 
                  label="Username" 
                  placeholder="Enter your username" 
                  value={username} 
                  onChange={handleUsernameChange}
                  onBlur={handleUsernameBlur}
                  validationError={usernameError}
                  maxLength={60}
                />
                <InputGroup 
                  label="Email ID" 
                  placeholder="Enter your email" 
                  value={email} 
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                  validationError={emailError}
                  maxLength={60}
                />
              </div>

              <div className="md:w-64 text-center p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50 flex flex-col items-center justify-center shadow-inner">
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

        <div className="section-divider"></div>

        <section className="animate-fade-in-down">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-blue-900 border-b-4 border-blue-400 pb-3 text-center tracking-tight">
            Password Settings
          </h2>
          {isLoading ? (
            <div className="animate-pulse space-y-5">
              <div className="h-10 bg-gray-200 rounded-md"></div>
              <div className="h-10 bg-gray-200 rounded-md"></div>
              <div className="h-10 bg-gray-200 rounded-md"></div>
            </div>
          ) : (
            <div className="space-y-5">
              <InputGroup
                label="Current Password"
                placeholder="Enter your current password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                hasRightIcon={true}
              >
                <div
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer p-1"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </div>
              </InputGroup>

              <div className="flex flex-col sm:flex-row items-end gap-4">
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer p-1"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <Eye size={20} /> : <EyeOff size={20}/>}
                  </div>
                </InputGroup>
                <Button
                  text="Update Password"
                  onClick={handleChangePassword}
                  className="bg-blue-900 text-white hover:bg-blue-700 focus:ring-blue-500 min-w-[150px] shadow-md"
                />
              </div>
            </div>
          )}
        </section>

        <div className="section-divider"></div>

        <section className="animate-fade-in-down">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-blue-900 border-b-4 border-blue-400 pb-3 text-center tracking-tight">
            Communication Channel Access
          </h2>
          <p className="text-center text-sm text-gray-600 mb-6">
            Control which communication channels are active for your profile. Only channels enabled by administration are shown.
          </p>
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-10 bg-gray-200 rounded-md"></div>
              <div className="h-10 bg-gray-200 rounded-md"></div>
              <div className="h-10 bg-gray-200 rounded-md"></div>
              <div className="h-10 bg-gray-200 rounded-md"></div>
            </div>
          ) : (
            <>
              {/* Communication Channel Toggles - only show if master setting is true */}
              {settingsProps.whatsapp_active && (
                <ToggleSwitch 
                  label="WhatsApp Access" 
                  isChecked={whatsappActive} 
                  onToggle={() => handleToggle('whatsapp')}
                />
              )}
              {settingsProps.mail_active && (
                <ToggleSwitch 
                  label="Mail Access" 
                  isChecked={mailActive} 
                  onToggle={() => handleToggle('mail')}
                />)}
              {settingsProps.website_active && (
                <ToggleSwitch 
                  label="Website Access" 
                  isChecked={websiteActive} 
                  onToggle={() => handleToggle('website')}
                />
              )}
              {settingsProps.phone_active && (
                <ToggleSwitch 
                  label="Phone Access" 
                  isChecked={phoneActive} 
                  onToggle={() => handleToggle('phone')}
                />
              )}
            </>
          )}
        </section>

        <div className="flex justify-center mt-8 pt-6 border-t border-gray-200">
            <Button
              text={isSaving ? 'Saving Profile...' : 'Save All Profile Changes'}
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="bg-black text-white hover:bg-gray-800 focus:ring-gray-900 w-full max-w-[280px] shadow-2xl transform active:scale-95 transition-transform"
            />
          </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
    </div>
  );
};

export default SettingsPage;