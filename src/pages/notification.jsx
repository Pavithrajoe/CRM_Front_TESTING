import React, { useEffect, useState } from "react";
import axios from "axios";
import { ENDPOINTS } from "../api/constraints";

const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const token = localStorage.getItem("token");
  const [userId, setUserId] = useState(null);

  // Decode user ID from JWT token
  useEffect(() => {
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        // console.log("Decoded token:", decoded);
        setUserId(decoded.user_id);
      } catch (err) {
        console.error("Invalid token", err);
      }
    }
  }, [token]);

const fetchNotifications = async () => {
  if (!token || !userId) return;

  try {
    const res = await axios.get(`${ENDPOINTS.NOTIFICATIONS}/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
   
    const list = res.data.data || [];
    setNotifications(list);
     const unreadCount = res.data.unreadCount ?? list.length;
    window.dispatchEvent(new CustomEvent('notificationsUpdated', { detail: unreadCount }));

  } catch (err) {
    console.error("Error fetching notifications", err);
  }
};

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); 
    return () => clearInterval(interval);
  }, [userId]);

  return (
    <div className="p-6 bg-[#f7f8fa] min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => window.history.back()} className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition">
          <svg  className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>
      </div>

      <h1 className="text-[22px] font-medium text-gray-900 tracking-tight">Notifications</h1>

      {notifications.length === 0 ? (
        <p className="text-center text-gray-500 mt-20 text-sm italic"> No notifications found. </p>
      ) : (
        <div className="space-y-3 mt-4">
          {notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedNotification(item)}
              className="cursor-pointer transition hover:shadow-md hover:scale-[1.01] duration-200 px-4 py-3 rounded-xl border bg-white border-gray-200"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-[12px] text-gray-400 capitalize">{item.type}</span>
                <span className="text-[12px] text-gray-400"> {new Date(item.created_at).toLocaleString()} </span>
              </div>
              <h4 className="text-[15px] font-medium text-gray-800 leading-tight"> {item.title} </h4>
              <p className="text-[13.5px] text-gray-600 mt-0.5 truncate">{item.message}</p>
            </div>
          ))}
        </div>
      )}

      {selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={() => setSelectedNotification(null)} >
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6" onClick={(e) => e.stopPropagation()} >
            <div className="mb-3 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800"> {selectedNotification.title} </h2>
              <button className="text-gray-400 hover:text-gray-600" onClick={() => setSelectedNotification(null)} >
                &times;
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">{selectedNotification.message}</p>
            <div className="text-xs text-gray-400 text-right"> {new Date(selectedNotification.created_at).toLocaleString()} </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPage;

