import React, { useState } from 'react';
import RemindersCard from '../Components/dashboard/teamlead/tlremindercard';
import TaskSameDay from '../Components/common/taskSameDay';

const reminderTask = () => {
  // We use the useState hook to manage which tab is currently active.
  const [activeTab, setActiveTab] = useState('reminders');

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 font-Montserrat">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Tab navigation buttons */}
<div className="flex w-full border-b border-gray-300">
  <div className="flex-1 flex justify-center items-center">
    <button
      onClick={() => setActiveTab('reminders')}
      className={`w-full py-3 px-4 font-semibold text-base transition-colors duration-200 ${
        activeTab === 'reminders'
          ? 'border-b-2 border-blue-600 text-blue-600 text-center'
          : 'text-gray-600 hover:bg-gray-100 text-center'
      }`}
    >
      Reminders
    </button>
  </div>
  <div className="flex-1 flex justify-center items-center">
    <button
      onClick={() => setActiveTab('tasks')}
      className={`w-full py-3 px-4 font-semibold text-base transition-colors duration-200 ${
        activeTab === 'tasks'
          ? 'border-b-2 border-blue-600 text-blue-600 text-center'
          : 'text-gray-600 hover:bg-gray-100 text-center'
      }`}
    >
      Tasks
    </button>
  </div>
</div>






        {/* Conditional rendering of content */}
        <div className="p-8 bg-gray-50">
          {activeTab === 'reminders' ? <RemindersCard /> : <TaskSameDay />}
        </div>
      </div>
    </div>
  );
};

export default reminderTask;