import React, { useEffect, useState } from "react";
import axios from "axios";
import { ENDPOINTS } from "../api/constraints";

const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(new Set());
  const [selectedNotification, setSelectedNotification] = useState(null);

  const token = localStorage.getItem("token");
  const userString = localStorage.getItem("user");
  let userId = null;

  if (userString) {
    try {
      const userObject = JSON.parse(userString);
      userId = userObject.iUser_id;
    } catch (e) {
      console.error("Error parsing user object from localStorage", e);
    }
  }

  useEffect(() => {
    const savedReads = JSON.parse(localStorage.getItem("readNotifications") || "[]");
    setReadIds(new Set(savedReads));

    if (!userId || !token) return;

    axios
      .get(`${ENDPOINTS.NOTIFICATIONS}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const sorted = res.data.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        setNotifications(sorted);
      })
      .catch((err) => console.error("Error fetching notifications", err));
  }, [userId, token]);

  const markAsRead = (id) => {
    const updated = new Set(readIds);
    updated.add(id);
    setReadIds(updated);
    localStorage.setItem("readNotifications", JSON.stringify([...updated]));
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const groupNotificationsByDate = (data) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (d1, d2) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    const groups = { Today: [], Yesterday: [], Earlier: [] };

    data.forEach((item) => {
      const date = new Date(item.created_at);
      if (isSameDay(date, today)) groups.Today.push(item);
      else if (isSameDay(date, yesterday)) groups.Yesterday.push(item);
      else groups.Earlier.push(item);
    });

    return groups;
  };

  const grouped = groupNotificationsByDate(notifications);

  const renderGroup = (label, items) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-6 border-t pt-4">
        <h3 className="text-sm font-semibold text-gray-500 mb-2 pl-2 uppercase tracking-wide">
          {label}
        </h3>
        <div className="space-y-3">
          {items.map((item) => {
            const isUnread = !readIds.has(item.id);

            return (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedNotification(item);
                  markAsRead(item.id);
                }}
                className={`cursor-pointer transition hover:shadow-md hover:scale-[1.01] duration-200 px-4 py-3 rounded-xl border ${
                  isUnread
                    ? "bg-blue-50 border-blue-200"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[12px] text-gray-400 capitalize">{item.type}</span>
                  <span className="text-[12px] text-gray-400">{formatTime(item.created_at)}</span>
                </div>
                <h4 className="text-[15px] font-medium text-gray-800 leading-tight">
                  {item.title}
                </h4>
                <p className="text-[13.5px] text-gray-600 mt-0.5 truncate">{item.message}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      className="p-6 bg-[#f7f8fa] min-h-screen font-sans"
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',borderRadius:'10px'
      }}
    >
      <div className="flex items-center gap-3 mb-6">
  <button
    onClick={() => window.history.back()}
    className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition"
  >
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
    <span>Back</span>
  </button>

 
</div>
 <h1 className="text-[22px] font-medium text-gray-900 tracking-tight">Notifications</h1>

      {notifications.length === 0 ? (
        <p className="text-center text-gray-500 mt-20 text-sm italic">
          No notifications found.
        </p>
      ) : (
        <div>
          {renderGroup("Today", grouped.Today)}
          {renderGroup("Yesterday", grouped.Yesterday)}
          {renderGroup("Earlier", grouped.Earlier)}
        </div>
      )}

      {/* Modal */}
      {selectedNotification && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          onClick={() => setSelectedNotification(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">{selectedNotification.title}</h2>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setSelectedNotification(null)}
              >
                &times;
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">{selectedNotification.message}</p>
            <div className="text-xs text-gray-400 text-right">
              {formatTime(selectedNotification.created_at)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPage;
