import React from 'react';

const SettingsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto bg-white shadow-md rounded-2xl p-6">
        <h2 className="text-2xl font-semibold mb-4">Settings</h2>

        {/* Example setting: Notification toggle */}
        <div className="flex justify-between items-center py-4 border-b">
          <span className="text-gray-700">Enable Notifications</span>
          <input type="checkbox" className="toggle toggle-primary" />
        </div>

        {/* Example setting: Username input */}
        <div className="py-4 border-b">
          <label className="block text-gray-700 mb-1">Username</label>
          <input
            type="text"
            placeholder="Enter your username"
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Example setting: Theme selection */}
        <div className="py-4">
          <label className="block text-gray-700 mb-1">Theme</label>
          <select className="w-full border rounded-lg px-3 py-2">
            <option>Light</option>
            <option>Dark</option>
            <option>System Default</option>
          </select>
        </div>

        {/* Save Button */}
        <div className="pt-6 text-right">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
