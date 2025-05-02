import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProfileHeader() {
  const [image, setImage] = useState(null);

  // Load saved image from localStorage
  useEffect(() => {
    const savedImage = localStorage.getItem('profileImage');
    if (savedImage) {
      setImage(savedImage);
    }
  }, []);

  // Handle image upload and save to localStorage
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setImage(base64);
      localStorage.setItem('profileImage', base64);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex justify-end items-center gap-10 mb-6 relative">
    <Link to="/notifications">
  <Bell className="w-10 h-10 border rounded-full ms-[-50px] p-2 text-blue-600 cursor-pointer" />
   </Link>
      <div className="flex items-center gap-2 cursor-pointer">
        <label htmlFor="profile-upload">
          <img
            src={image || 'https://i.pravatar.cc/40'}
            alt="avatar"
            className="w-10 h-10 rounded-full object-cover border-2 border-gray-300 hover:opacity-80 transition"
          />
        </label>
        <input
          type="file"
          accept="image/*"
          id="profile-upload"
          onChange={handleImageChange}
          className="hidden"
        />
        <div className="text-sm leading-tight">
          <div className="font-semibold">Ravi kumar</div>
          <div className="text-gray-500 text-xs">ravikumar79@gmail.com</div>
        </div>
        <div className="text-xl">▾</div>
      </div>
    </div>
  );
}
