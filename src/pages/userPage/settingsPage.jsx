import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { FaCloudUploadAlt } from 'react-icons/fa';
import { Eye, EyeOff } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { UserContext } from '../../context/UserContext';
import { ENDPOINTS } from '../../api/constraints';

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


const SettingsPage = () => {
  const { userId: urlUserId } = useParams();
  const { users } = useContext(UserContext);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [whatsappActive, setWhatsappActive] = useState(false);
  const [mailActive, setMailActive] = useState(false);
  const [websiteActive, setWebsiteActive] = useState(false);
  const [phoneActive, setPhoneActive] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [usernameError, setUsernameError] = useState('');
useEffect(() => {
  const fetchUserProfile = async () => {
    if (!urlUserId) {
      if (users && users.length > 0) {
        const user = users[0];
        setName(user.cFull_name || '');
        setUsername(user.cUser_name || '');
        setEmail(user.cEmail || '');
        // Set access settings from user data
        setWhatsappActive(user.whatsapp_access || false);
        setMailActive(user.mail_access || false);
        setWebsiteActive(user.website_access || false);
        setPhoneActive(user.phone_access || false);
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
      // Set access settings from user data
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
      // console.log("General Settings Data:", data);
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
    fetchGeneralSettings();
  }, []);

  const validateName = () => {
    if (!name.trim()) {
      setNameError('Name is required');
      return false;
    }
    if (name.length > 60) {
      setNameError('Name must be 60 characters or less');
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
        whatsapp_access: whatsappActive,
        mail_access: mailActive,
        website_access: websiteActive,
        phone_access: phoneActive,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to update profile');
    }

    toast.success('Changes saved successfully!');
  } catch (error) {
    console.error('Error saving changes:', error);
    toast.error(`Failed to save changes: ${error.message}`);
  } finally {
    setIsSaving(false);
  }
};

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
          email: email,
          password: newPassword,
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

const updateCallLogAccess = async () => {
  try {
    const response = await fetch(ENDPOINTS.CALLLOG_ACCESS, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("token")}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: Number(urlUserId),
        isMailActive: mailActive,
        isPhoneActive: phoneActive,
        isWebsiteActive: websiteActive,
        isWhatsappActive: whatsappActive,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update call log access');
    }

    // Update local state with the response data
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

const handleToggle = async (type) => {
  // Save original state in case we need to revert
  const originalState = {
    whatsapp: whatsappActive,
    mail: mailActive,
    website: websiteActive,
    phone: phoneActive
  };

  // Update local state immediately for responsive UI
  switch(type) {
    case 'whatsapp': setWhatsappActive(prev => !prev); break;
    case 'mail': setMailActive(prev => !prev); break;
    case 'website': setWebsiteActive(prev => !prev); break;
    case 'phone': setPhoneActive(prev => !prev); break;
    default: break;
  }

  // Then make the API call
  const success = await updateCallLogAccess();
  
  // If the API call failed, revert the state
  if (!success) {
    setWhatsappActive(originalState.whatsapp);
    setMailActive(originalState.mail);
    setWebsiteActive(originalState.website);
    setPhoneActive(originalState.phone);
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
    <div className="  font-Montserrat">
      <div className="bg-white p-6 space-y-8 rounded-xl w-full mx-auto">
        <section className="animate-fade-in-down">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-blue-900 border-b-4 border-blue-400 pb-3 text-center tracking-tight">Personal Information</h2>
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
                 <div className=" justify-center mt-8 pt-6 border-t border-gray-200">
          <Button
            text={isSaving ? 'Saving...' : 'Save All Changes'}
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="bg-black text-white hover:bg-gray-800 focus:ring-gray-900 w-full max-w-[180px] shadow-2xl transform active:scale-95 transition-transform"
          />
        </div>
        </section>

        <div className="section-divider"></div>

        <section className="animate-fade-in-down">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-blue-900 border-b-4 border-blue-400 pb-3 text-center tracking-tight">Password Settings</h2>
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
                  {showCurrentPassword ? <Eye size={20} /> : <EyeOff size={20} /> }
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
            Communication Channel Activation
          </h2>
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-10 bg-gray-200 rounded-md"></div>
              <div className="h-10 bg-gray-200 rounded-md"></div>
              <div className="h-10 bg-gray-200 rounded-md"></div>
              <div className="h-10 bg-gray-200 rounded-md"></div>
            </div>
          ) : (
            <>
              <ToggleSwitch 
                label="WhatsApp" 
                isChecked={whatsappActive} 
                onToggle={() => handleToggle('whatsapp')}
              />
              <ToggleSwitch 
                label="Mail" 
                isChecked={mailActive} 
                onToggle={() => handleToggle('mail')}
              />
              <ToggleSwitch 
                label="Website" 
                isChecked={websiteActive} 
                onToggle={() => handleToggle('website')}
              />
              <ToggleSwitch 
                label="Phone" 
                isChecked={phoneActive} 
                onToggle={() => handleToggle('phone')}
              />
            </>
          )}
        </section>

        <div className="flex justify-center mt-8 pt-6 border-t border-gray-200">
         {/* <Button
  text={isSaving ? 'Saving...' : 'Save the Access'}
  onClick={updateCallLogAccess}
  disabled={isSaving}
  className="bg-black text-white hover:bg-gray-800 focus:ring-gray-900 w-full max-w-[180px] shadow-2xl transform active:scale-95 transition-transform"
/> */}
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
    </div>
  );
};

export default SettingsPage;