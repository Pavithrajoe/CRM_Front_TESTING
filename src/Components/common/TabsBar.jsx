import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Mail, Phone, Globe, MessageSquare } from 'lucide-react';


const tabs = [
  // { name: 'History', path: '/history' },
  { name: 'Comments', path: '/Commandpage' },
  { name: 'Remainders', path: '/remainderpage' },
  { name: 'Analytics', path: '/analytics' },
];

export default function TabsBar() {
  const [activePanel, setActivePanel] = useState(null);
  const [panelPosition, setPanelPosition] = useState('left');
  const [sent, setSent] = useState(false);
  const location = useLocation();

  const togglePanel = (panel) => {
    setSent(false);
    setActivePanel((prev) => (prev === panel ? null : panel));

    // Decide position based on panel
    if (panel === 'email' || panel === 'phone') {
      setPanelPosition('right');
    } else if (panel === 'whatsapp' || panel === 'web') {
      setPanelPosition('right');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 2000);
  };

  const renderPanelContent = () => {
    switch (activePanel) {
      case 'email':
        return (
          <form onSubmit={handleSubmit} className="space-y-5">
            <input type="email" placeholder="Recipient Email" className="w-full border p-2 rounded" required />
            <input type="text" placeholder="Subject" className="w-full border p-2 rounded" required />
            <textarea placeholder="Message" className="w-full border p-2 rounded h-24" required />
            <button type="submit" className="bg-blue-900 text-white px-4 py-2 rounded-3xl">Send Email</button>
            {sent && <p className="text-green-600 mt-2">Email sent successfully!</p>}
          </form>
        );
      case 'phone':
        return (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="tel" placeholder="Enter phone number" className="w-full border p-2 rounded" required />
            <textarea placeholder="Message or Notes" className="w-full border p-2 rounded h-24" />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Start Call</button>
            {sent && <p className="text-green-600 mt-2">Call initiated successfully!</p>}
          </form>
        );
      case 'whatsapp':
        return (
          <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
            <div className="bg-green-100 p-3 rounded text-sm">Hi, how can I help you today?</div>
            <textarea placeholder="Type your WhatsApp message..." className="border rounded p-2 h-24" required />
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-3xl">Send Message</button>
            {sent && <p className="text-green-600">Message sent on WhatsApp!</p>}
          </form>
        );
      case 'web':
        return (
          <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
            <p>Web content can be added here.</p>
            <input type="email" placeholder="Recipient Email" className="w-full border p-2 rounded" required />
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col w-full">
      {/* Tab Navigation Bar */}
      <div className="flex w-full ">
        <div className="flex items-center space-x-2">
          {tabs.map((tab) => (
            <NavLink
              key={tab.name}
              to={tab.path}
              className={({ isActive }) =>
                `px-4 py-2 rounded-full text-sm font-medium border ${
                  isActive
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'bg-white text-black border-gray-300 hover:bg-gray-100'
                }`
              }
            >
              {tab.name}
            </NavLink>
          ))}
        </div>
        <div className="border-l border-dotted border-blue-900 h-8 mx-3" />
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => togglePanel('email')} 
            className={`w-8 h-8 border rounded flex items-center justify-center hover:bg-gray-100 ${
              activePanel === 'email' ? 'bg-blue-100 border-blue-900' : ''
            }`}
          >
            <Mail className="w-4 h-4" />
          </button>
          <button 
            onClick={() => togglePanel('phone')} 
            className={`w-8 h-8 border rounded flex items-center justify-center hover:bg-gray-100 ${
              activePanel === 'phone' ? 'bg-blue-100 border-blue-300' : ''
            }`}
          >
            <Phone className="w-4 h-4" />
          </button>
          <button 
            onClick={() => togglePanel('web')} 
            className={`w-8 h-8 border rounded flex items-center justify-center hover:bg-gray-100 ${
              activePanel === 'web' ? 'bg-blue-100 border-blue-300' : ''
            }`}
          >
            <Globe className="w-4 h-4" />
          </button>
          <button 
            onClick={() => togglePanel('whatsapp')} 
            className={`w-8 h-8 border rounded flex items-center justify-center hover:bg-gray-100 ${
              activePanel === 'whatsapp' ? 'bg-blue-100 border-blue-300' : ''
            }`}
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Area for Tabs */}
      <div className="ms-[390px] mt-4 w-[calc(100%-390px)]">
        <Outlet />
      </div>

      {/* Action Panels */}
      {activePanel && (
        <div className={`fixed bottom-0 ${panelPosition === 'right' ? 'right-0 animate-slide-in-right' : 'left-0 animate-slide-in-left'} w-full md:w-1/3 p-5 bg-white shadow-lg border-t z-50`}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold capitalize">{activePanel} Panel</h3>
            <button onClick={() => setActivePanel(null)} className="text-sm text-gray-500">Close</button>
          </div>
          {renderPanelContent()}
        </div>
      )}

      {/* Inline CSS for animation */}
      <style>
        {`
          @keyframes slideInFromRight {
            0% {
              transform: translateX(100%);
            }
            100% {
              transform: translateX(0%);
            }
          }

          @keyframes slideInFromLeft {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(0%);
            }
          }

          .animate-slide-in-right {
            animation: slideInFromRight 0.3s ease-out;
          }

          .animate-slide-in-left {
            animation: slideInFromLeft 0.3s ease-out;
          }
        `}
      </style>
    </div>
  );
}