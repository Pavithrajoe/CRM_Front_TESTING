// components/TabsBar.jsx
import { NavLink } from 'react-router-dom';

const tabs = [
  { name: 'History', path: '/history' },
  { name: 'Comments', path: '/comments' },
  { name: 'Remainders', path: '/remainders' },
  { name: 'Analytics', path: '/analytics' },
  { name: 'Assigned To', path: '/assigned' },
];

export default function TabsBar() {
  return (
    <div className="flex gap-4 mt-4">
      {tabs.map((tab) => (
        <NavLink
          key={tab.name}
          to={tab.path}
          className={({ isActive }) =>
            `px-4 py-2 rounded border text-sm font-medium ${
              isActive ? 'bg-blue-700 text-white' : 'bg-white text-black border'
            }`
          }
        >
          {tab.name}
        </NavLink>
      ))}
    </div>
  );
}
