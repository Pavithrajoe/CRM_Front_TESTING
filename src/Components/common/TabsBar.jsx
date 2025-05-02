import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Mail, Phone, Globe, MessageSquare } from 'lucide-react';

const tabs = [
  { name: 'History', path: '/history' },
  { name: 'Comments', path: '/comments' },
  { name: 'Remainders', path: '/remainders' },
  { name: 'Analytics', path: '/analytics' },
];

export default function TabsBar() {
  const [activePanel, setActivePanel] = useState(null);

  const togglePanel = (panel) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  return (
    <>
      <div className="flex items-center justify-between w-full ms-[-970px]">
        {/* Left Tabs */}
        <div className="flex items-center space-x-2">
          {tabs.map((tab) => (
            <NavLink
              key={tab.name}
              to={tab.path}
              className={({ isActive }) =>
                `px-4 py-2 rounded-full text-sm font-medium border ${
                  isActive
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'bg-white text-black border-gray-300'
                }`
              }
            >
              {tab.name}
            </NavLink>
          ))}
        </div>

        {/* Vertical Divider */}
        <div className="border-l border-dotted border-blue-500 h-8 mx-3" />

        {/* Icon Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => togglePanel('email')}
            className="w-8 h-8 border rounded flex items-center justify-center hover:bg-gray-100"
          >
            <Mail className="w-4 h-4" />
          </button>
          <button
            onClick={() => togglePanel('phone')}
            className="w-8 h-8 border rounded flex items-center justify-center hover:bg-gray-100"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={() => togglePanel('web')}
            className="w-8 h-8 border rounded flex items-center justify-center hover:bg-gray-100"
          >
            <Globe className="w-4 h-4" />
          </button>
          <button
            onClick={() => togglePanel('whatsapp')}
            className="w-8 h-8 border rounded flex items-center justify-center hover:bg-gray-100"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Slide-up Panel */}
      {activePanel && (
        <div className="fixed bottom-0 left-0 w-full bg-white shadow-lg border-t z-50 transition-all duration-300">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-semibold capitalize">{activePanel}</h3>
            <button onClick={() => setActivePanel(null)} className="text-sm text-gray-500">Close</button>
          </div>
          <div className="p-4">
            {activePanel === 'email' && <p>Email content here…</p>}
            {activePanel === 'phone' && <p>Phone content here…</p>}
            {activePanel === 'web' && <p>Web content here…</p>}
            {activePanel === 'whatsapp' && <p>WhatsApp content here…</p>}
          </div>
        </div>
      )}
    </>
  );
}
