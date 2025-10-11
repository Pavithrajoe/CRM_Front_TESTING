import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTabs } from '../../context/TabContext';
import { Tabs, Tab, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Tooltip from '@mui/material/Tooltip';

// Target company ID is retrieved from the environment variable
const TARGET_COMPANY_ID = Number(import.meta.env.VITE_XCODEFIX_FLOW);

const Sidebar = () => {
    // Moved companyId state declaration to the top with other states
    const [companyId, setCompanyId] = useState(null); 
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [userRoleId, setUserRoleId] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const { tabs, activeTab, openTab, closeTab } = useTabs();
    const navigate = useNavigate();

    // Define a function to generate menu items conditionally based on companyId
    const getFullMenuItems = (currentCompanyId) => {
        const isTargetCompany = currentCompanyId === TARGET_COMPANY_ID;
        const leadLabel = isTargetCompany ? 'My Leads' : 'Lead';
        const leadRoute = isTargetCompany ? 'xcodefix_leadcardview' : '/leadcardview';

        return [
            { iconPath: '/images/nav/home.png', label: 'Home', route: '/leaddashboard' },
            // Conditional Lead Menu Item based on company ID
            { iconPath: '/images/nav/group.png', label: leadLabel, route: leadRoute },
            { iconPath: '/images/nav/customers.png', label: 'Customer', route: '/customers' },
            { iconPath: '/images/nav/calen.png', label: 'Calendar', route: '/calenderpage' },
            { iconPath: '/images/nav/userss.png', label: 'Users', route: '/userpage' },
            { iconPath: '/images/nav/reports.png', label: 'Reports', route: '/reportpage' },
            { iconPath: '/images/nav/org.png', label: 'Organisation', route: '/companydashboard' },
            { iconPath: '/images/nav/masterss.png', label: 'Masters', route: '/companymaster' },
            { iconPath: '/images/nav/settings.png', label: 'Settings', route: '/settingspage/account' },
        ];
    };


    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, '+').replace(/_/g, '/')));
                const roleId = payload.role_id;
                // Extract and set company ID from the token payload
                const compId = payload.company_id ? Number(payload.company_id) : null;
                
                setUserRoleId(roleId);
                setCompanyId(compId); // Set company ID state

                // Get the menu items with the correct label/route
                const fullItems = getFullMenuItems(compId);

                if (roleId === 1) {
                    setMenuItems(fullItems);
                } else if (roleId === 5) {
                    setMenuItems(fullItems.filter(item =>
                        ['Home', 'Organisation', 'Reports', 'Chat', 'Settings', 'Support'].includes(item.label)
                    ));
                } else {
                    // For other roles, filter based on the new/old 'Lead' label.
                    setMenuItems(fullItems.filter(item =>
                        ['Home', 'Lead', 'My Leads', 'Customer', 'Calendar', 'Chat'].includes(item.label)
                    ));
                }
            } catch {
                setUserRoleId(null);
                setCompanyId(null);
                setMenuItems([]);
            }
        } else {
            setUserRoleId(null);
            setCompanyId(null);
            setMenuItems([]);
        }
    }, []); // Empty dependency array means this runs once after the initial render


    const toggleSidebar = () => setIsCollapsed(prev => !prev);
    const handleLogout = () => {
        localStorage.clear();
        navigate('/', { replace: true });
    };

    return (
        <div className="flex h-screen w-full">
            <div className={`bg-white border-r flex flex-col justify-between transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
                <div className="flex items-center justify-center mt-6 h-20">
                    <img
                        src={isCollapsed ? '/images/nav/shortinkli.png' : '/images/nav/loginkli.png'}
                        alt="Logo"
                        className={`transition-all duration-300 ${isCollapsed ? 'w-12' : 'w-48'} h-auto`}
                    />
                </div>

                <div className="flex flex-col items-center py-4 space-y-2">
                    {menuItems.length > 0 ? (
                        menuItems.map(item => (
                            <NavLink
                                key={item.route}
                                to={item.route}
                                end
                                className={({ isActive }) =>
                                    `flex items-center w-full rounded-lg px-4 py-2 transition-all duration-200 text-gray-700 ${
                                    isActive ? 'bg-blue-100 font-semibold text-blue-600' : 'hover:bg-blue-100'
                                    }`
                                }
                                onClick={() => openTab(item.route, item.label)}
                            >
                                <Tooltip
                                    title={isCollapsed ? item.label : ''}
                                    placement="right"
                                    arrow
                                    componentsProps={{
                                        tooltip: {
                                            sx: {
                                                backgroundColor: '#374151',
                                                color: '#fff',
                                                fontSize: '0.75rem',
                                                fontWeight: '500',
                                                letterSpacing: '0.1em',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                            }
                                        },
                                        arrow: { sx: { color: '#374151' } }
                                    }}
                                >
                                    <div className="flex items-center justify-center w-8">
                                        <img src={item.iconPath} alt={item.label} className="w-5 h-5 object-contain" />
                                    </div>
                                </Tooltip>
                                {!isCollapsed && <span className="ml-3 text-sm font-medium">{item.label}</span>}
                            </NavLink>
                        ))
                    ) : (
                        <p className="text-gray-400 text-sm mt-4">No menu available for your role.</p>
                    )}
                </div>

                <div className="flex flex-col items-center py-6 space-y-4 mb-4">
                    <button onClick={toggleSidebar} className="flex items-center justify-center space-x-2 px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-100 transition">
                        <img src="/images/nav/collab.png" alt="Toggle" className="w-6 h-6" />
                        {!isCollapsed && <span className="text-sm font-medium">Collapse</span>}
                    </button>
                    <button onClick={handleLogout} className="flex items-center bg-black text-white space-x-2 px-4 py-2 hover:bg-red-600 rounded transition">
                        <img src="/images/nav/logout.png" alt="Logout" className="w-5 h-5" />
                        {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                <Box sx={{ borderBottom: 1, borderColor: 'divider', backgroundColor: '#f9fafb', width: '100%' }}>
                    <Tabs
                        value={activeTab}
                        onChange={(_, newValue) => {
                            const sel = menuItems.find(m => m.route === newValue);
                            navigate(newValue);
                            // Pass the correct label to openTab
                            openTab(newValue, sel?.label || 'New');
                        }}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{ minHeight: 48, width: '100%' }}
                    >
                        {tabs.map(tab => (
                            <Tab
                                key={tab.path}
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        {tab.label}
                                        <IconButton size="small" onClick={e => { e.stopPropagation(); closeTab(tab.path); }} sx={{ ml: 1 }}>
                                            <CloseIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </Box>
                                }
                                value={tab.path}
                                sx={{
                                    textTransform: 'none',
                                    minHeight: 48,
                                    minWidth: 'unset',
                                    px: 2,
                                    '&.Mui-selected': { color: 'primary.main', fontWeight: 'bold' },
                                }}
                            />
                        ))}
                    </Tabs>
                </Box>

                <div className="flex-1 overflow-x-hidden w-full h-full p-4">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default Sidebar;

// import React, { useState, useEffect } from 'react';
// import { NavLink, Outlet, useNavigate } from 'react-router-dom';
// import { useTabs } from '../../context/TabContext';
// import { Tabs, Tab, IconButton, Box } from '@mui/material';
// import CloseIcon from '@mui/icons-material/Close';
// import Tooltip from '@mui/material/Tooltip';

// const TARGET_COMPANY_ID = Number(import.meta.env.VITE_XCODEFIX_FLOW);

// const Sidebar = () => {
//   const [companyId, setCompanyId] = useState(null);
//   const [isCollapsed, setIsCollapsed] = useState(true);
//   const [userRoleId, setUserRoleId] = useState(null);
//   const [menuItems, setMenuItems] = useState([]);
//   const { tabs, activeTab, openTab, closeTab } = useTabs();
//   const navigate = useNavigate();

//   const fullMenuItems = [
//     { iconPath: '/images/nav/home.png', label: 'Home', route: '/leaddashboard' },
//     { iconPath: '/images/nav/group.png', label: 'Lead', route: '/leadcardview' },
//     { iconPath: '/images/nav/customers.png', label: 'Customer', route: '/customers' },
//     { iconPath: '/images/nav/calen.png', label: 'Calendar', route: '/calenderpage' },
//     { iconPath: '/images/nav/userss.png', label: 'Users', route: '/userpage' },
//     { iconPath: '/images/nav/reports.png', label: 'Reports', route: '/reportpage' },
//     { iconPath: '/images/nav/org.png', label: 'Organisation', route: '/companydashboard' },
//     { iconPath: '/images/nav/masterss.png', label: 'Masters', route: '/companymaster' },
//     { iconPath: '/images/nav/settings.png', label: 'Settings', route: '/settingspage/account' },
//   ];

//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (token) {
//       try {
//         const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g,'+').replace(/_/g,'/')));
//         const roleId = payload.role_id;
//         setUserRoleId(roleId);
//         if (roleId === 1) {
//           setMenuItems(fullMenuItems);
//         } else if (roleId === 5) {
//           setMenuItems(fullMenuItems.filter(item =>
//             ['Home', 'Organisation', 'Reports', 'Chat', 'Settings', 'Support'].includes(item.label)
//           ));
//         } else {
//           setMenuItems(fullMenuItems.filter(item =>
//             ['Home', 'Lead', 'Customer', 'Calendar', 'Chat'].includes(item.label)
//           ));
//         }
//       } catch {
//         setUserRoleId(null);
//         setMenuItems([]);
//       }
//     } else {
//       setUserRoleId(null);
//       setMenuItems([]);
//     }
//   }, []);

//   const toggleSidebar = () => setIsCollapsed(prev => !prev);
//   const handleLogout = () => {
//     localStorage.clear();
//     navigate('/', { replace: true });
//   };

//   return (
//     <div className="flex h-screen w-full">
//       <div className={`bg-white border-r flex flex-col justify-between transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
//         <div className="flex items-center justify-center mt-6 h-20">
//           <img
//             src={isCollapsed ? '/images/nav/shortinkli.png' : '/images/nav/loginkli.png'}
//             alt="Logo"
//             className={`transition-all duration-300 ${isCollapsed ? 'w-12' : 'w-48'} h-auto`}
//           />
//         </div>

//         <div className="flex flex-col items-center py-4 space-y-2">
//           {menuItems.length > 0 ? (
//             menuItems.map(item => (
//               <NavLink
//                 key={item.route}
//                 to={item.route}
//                 end
//                 className={({ isActive }) =>
//                   `flex items-center w-full rounded-lg px-4 py-2 transition-all duration-200 text-gray-700 ${
//                     isActive ? 'bg-blue-100 font-semibold text-blue-600' : 'hover:bg-blue-100'
//                   }`
//                 }
//                 onClick={() => openTab(item.route, item.label)}
//               >
//                 <Tooltip
//                   title={isCollapsed ? item.label : ''}
//                   placement="right"
//                   arrow
//                   componentsProps={{
//                     tooltip: {
//                       sx: {
//                         backgroundColor: '#374151',
//                         color: '#fff',
//                         fontSize: '0.75rem',
//                         fontWeight: '500',
//                         letterSpacing: '0.1em',
//                         padding: '4px 8px',
//                         borderRadius: '6px',
//                         boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
//                       }
//                     },
//                     arrow: { sx: { color: '#374151' } }
//                   }}
//                 >
//                   <div className="flex items-center justify-center w-8">
//                     <img src={item.iconPath} alt={item.label} className="w-5 h-5 object-contain" />
//                   </div>
//                 </Tooltip>
//                 {!isCollapsed && <span className="ml-3 text-sm font-medium">{item.label}</span>}
//               </NavLink>
//             ))
//           ) : (
//             <p className="text-gray-400 text-sm mt-4">No menu available for your role.</p>
//           )}
//         </div>

//         <div className="flex flex-col items-center py-6 space-y-4 mb-4">
//           <button onClick={toggleSidebar} className="flex items-center justify-center space-x-2 px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-100 transition">
//             <img src="/images/nav/collab.png" alt="Toggle" className="w-6 h-6" />
//             {!isCollapsed && <span className="text-sm font-medium">Collapse</span>}
//           </button>
//           <button onClick={handleLogout} className="flex items-center bg-black text-white space-x-2 px-4 py-2 hover:bg-red-600 rounded transition">
//             <img src="/images/nav/logout.png" alt="Logout" className="w-5 h-5" />
//             {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
//           </button>
//         </div>
//       </div>

//       <div className="flex-1 flex flex-col overflow-hidden">
//         <Box sx={{ borderBottom: 1, borderColor: 'divider', backgroundColor: '#f9fafb', width: '100%' }}>
//           <Tabs
//             value={activeTab}
//             onChange={(_, newValue) => {
//               const sel = menuItems.find(m => m.route === newValue);
//               navigate(newValue);
//               openTab(newValue, sel?.label || 'New');
//             }}
//             variant="scrollable"
//             scrollButtons="auto"
//             sx={{ minHeight: 48, width: '100%' }}
//           >
//             {tabs.map(tab => (
//               <Tab
//                 key={tab.path}
//                 label={
//                   <Box sx={{ display: 'flex', alignItems: 'center' }}>
//                     {tab.label}
//                     <IconButton size="small" onClick={e => { e.stopPropagation(); closeTab(tab.path); }} sx={{ ml: 1 }}>
//                       <CloseIcon sx={{ fontSize: 16 }} />
//                     </IconButton>
//                   </Box>
//                 }
//                 value={tab.path}
//                 sx={{
//                   textTransform: 'none',
//                   minHeight: 48,
//                   minWidth: 'unset',
//                   px: 2,
//                   '&.Mui-selected': { color: 'primary.main', fontWeight: 'bold' },
//                 }}
//               />
//             ))}
//           </Tabs>
//         </Box>

//         <div className="flex-1 overflow-x-hidden w-full h-full p-4">
//           <Outlet />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Sidebar;
