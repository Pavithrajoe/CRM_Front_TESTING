import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom'; 
export default function ProfileHeader() {
  const [image, setImage] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedImage = localStorage.getItem('profileImage');
    if (savedImage) {
      setImage(savedImage);
    }
  }, []);

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

  const handleLogout = () => {
  // When you want to log out or clear the token:
    localStorage.removeItem('token');
    console.log('Token removed from localStorage');
    localStorage.removeItem('profileImage');
    navigate('/'); 
  };

  return (
    <div className="flex justify-end items-center gap-10 mb-6 relative">
      <Link to="/notifications">
        <Bell className="w-10 h-10 border rounded-full ms-[-50px] p-2 text-blue-600 cursor-pointer" />
      </Link>

      <div className="relative">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setShowDropdown(!showDropdown)}
        >
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
            <div className="font-semibold">Ravi Kumar</div>
            <div className="text-gray-500 text-xs">ravikumar79@gmail.com</div>
          </div>
          <div className="text-xl">▾</div>
        </div>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg p-4 text-sm z-50">
            <div className="font-bold text-gray-800">Ravi Kumar</div>
            <div className="text-gray-500">Department: Development</div>
            <div className="text-gray-500">Team: UI/UX</div>
            <hr className="my-2" />
           
          </div>
        )}
      </div>
    </div>
  );
}
