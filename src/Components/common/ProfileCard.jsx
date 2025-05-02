import React, { useEffect, useState } from "react";
import { Pencil, Mail, Phone, MapPin, Upload, Save } from "lucide-react";
import axios from "axios";

const ProfileCard = () => {
  const [history, setHistory] = useState([]);
  const [profile, setProfile] = useState({
    name: "Name",
    organization: "Organization",
    phone: "98745 61230",
    email: "juhdhd456@gmail.com",
    address: "56, KKJ Nagar, Saravanampatti, Coimbatore-09",
    Lead: "Lead",
    Domain: "Domain",
    leadStatus: "Hot Lead",
    avatar: "https://i.pravatar.cc/100?img=5", 
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    axios
      .get("https://your-api.com/history")
      .then((res) => setHistory(res.data))
      .catch((err) => console.error("Failed to load history", err));

    axios
      .get("https://your-api.com/profile")
      .then((res) => setProfile(res.data))
      .catch((err) => console.error("Failed to load profile", err));
  }, []);

  const handleEditProfile = () => {
    setIsEditing(!isEditing);
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = () => {
    axios
      .put("https://your-api.com/profile", profile)
      .then(() => {
        alert("Profile saved successfully.");
        setIsEditing(false);
      })
      .catch((err) => console.error("Failed to save profile", err));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfile((prev) => ({ ...prev, avatar: imageUrl }));

      const formData = new FormData();
      formData.append("avatar", file);

      axios
        .post("https://your-api.com/upload-avatar", formData)
        .then(() => alert("Profile picture updated."))
        .catch((err) => console.error("Failed to upload avatar", err));
    }
  };

  return (
    <div className="max-w-xl p-4 rounded-xl bg-white space-y-6">
      <div className="flex items-start justify-between">
        <h2 className="text-lg font-semibold">Profile</h2>
        <button onClick={handleEditProfile}>
          <Pencil className="w-4 h-4 text-gray-600 hover:text-black" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <img
            src={profile.avatar}
            alt="Profile"
            className="w-14 h-14 rounded-full object-cover"
          />
          <label className="absolute -bottom-2 -right-2 bg-white p-1 rounded-full shadow cursor-pointer">
            <Upload className="w-4 h-4 text-gray-600" />
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
              name="name"
              value={profile.name}
              onChange={handleFieldChange}
              className="text-sm font-bold"
            />
          ) : (
            <h3 className="text-sm font-bold">{profile.name}</h3>
          )}
          <p className="text-xs text-gray-500">
            {isEditing ? (
              <input
                type="text"
                name="organization"
                value={profile.organization}
                onChange={handleFieldChange}
                className="text-xs text-gray-500"
              />
            ) : (
              profile.organization
            )}
          </p>
        </div>
        <span className="ml-auto px-2 py-1 bg-[#FF5722] text-white text-xs rounded">
          {profile.leadStatus}
        </span>
      </div>

      <div className="text-sm space-y-2">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-gray-500" />
          {isEditing ? (
            <input
              type="text"
              name="phone"
              value={profile.phone}
              onChange={handleFieldChange}
              className="text-sm"
            />
          ) : (
            <span>{profile.phone}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-gray-500" />
          {isEditing ? (
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleFieldChange}
              className="text-sm"
            />
          ) : (
            <span>{profile.email}</span>
          )}
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-gray-500 mt-1" />
          {isEditing ? (
            <textarea
              name="address"
              value={profile.address}
              onChange={handleFieldChange}
              className="text-sm resize-none"
            />
          ) : (
            <span>{profile.address}</span>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="flex justify-end space-x-2">
          <button
            onClick={handleSaveProfile}
            className="bg-blue-600 text-white px-3 py-1 rounded"
          >
            <Save className="w-4 h-4 inline-block" /> Save
          </button>
          <button
            onClick={handleEditProfile}
            className="bg-gray-400 text-white px-3 py-1 rounded"
          >
            Cancel
          </button>
        </div>
      )}

      <div>
        <ul className="space-y-1 max-h-40 overflow-auto pr-1">
          {history.map((item, index) => (
            <li key={index} className="text-xs text-gray-600">
              <span className="font-medium">Modified</span> {item.user}'s work
              on {item.date} at {item.time}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ProfileCard;
