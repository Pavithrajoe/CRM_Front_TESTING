import React from 'react';
import { useTabs } from '../context/TabContext.jsx'; 
import { useNavigate } from 'react-router-dom';
import RemainderPage from '../pages/RemainderPage';
import ReminderHistory from '../pages/reminderHistory';
import CalendarPage from '../pages/calenderpage';
import Commandpage from '../pages/command';

const components = {
  '/remainderpage': <RemainderPage />,
  '/reminderhistory': <ReminderHistory />,
  '/calenderpage': <CalendarPage />,
  '/commandpage': <Commandpage />,
};

const TabManager = () => {
  const { tabs, activeTab, setActiveTab, closeTab } = useTabs();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col w-full">
      {/* Tab header bar */}
      <div className="flex bg-gray-100 border-b">
        {tabs.map((tab) => (
          <div
            key={tab.path}
            className={`px-4 py-2 cursor-pointer ${activeTab === tab.path ? 'bg-white border-t-2 border-blue-600 font-semibold' : ''}`}
            onClick={() => {
              setActiveTab(tab.path);
              navigate(tab.path);
            }}
          >
            {tab.label}
            {tab.path !== '/remainderpage' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.path);
                }}
                className="ml-2 text-red-500"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Active tab content */}
      <div className="p-4">
        {components[activeTab] || <div>Select a tab</div>}
      </div>
    </div>
  );
};

export default TabManager;
