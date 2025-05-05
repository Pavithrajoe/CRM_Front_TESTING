import React from 'react';
import { Routes, Route } from 'react-router-dom';

import ForgetPassword from "./Components/ForgetPassword";
import SuccessMessage from "./pages/credential/SuccessMessage";
import VerifyCodePage from "./pages/credential/verify_code";
import Login from './pages/credential/login';
import SignupRes from './pages/credential/signup_res';

import LeadsDashboard from "./pages/dashboard/teamLeadDashboard";
import LeadManagePage from './pages/LeadManagePage';
import LeadListViewPage from './pages/dashboard/LeadListView';
import LeadCardViewPage from './pages/dashboard/LeadCardView';

import RemainderPage from './pages/RemainderPage';
import ReminderHistory from './pages/reminderHistory';
import CalendarPage from './pages/calenderpage';
import Commandpage from './pages/command';
import UserAnalyticsPage from './pages/user_analytics';

import { TabProvider } from "./context/TabContext";
import AppLayout from '@/Components/AppLayout'; // Unified layout

function App() {
  return (
    <TabProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/forgetpassword" element={<ForgetPassword />} />
        <Route path="/success" element={<SuccessMessage />} />
        <Route path="/verify" element={<VerifyCodePage />} />
        <Route path="/signupres" element={<SignupRes />} />

        {/* Lead Dashboard Routes */}
        {/* <Route path="/leads" element={<LeadsDashboard />} />  */}
        <Route path="/leadmanage" element={<LeadManagePage />} />
        <Route path="/leadlistview" element={<LeadListViewPage />} />
        <Route path="/leadcardview" element={<LeadCardViewPage />} />

        {/* Protected Routes with Layout */}
        <Route element={<AppLayout />}>
          <Route path="/remainderpage" element={<RemainderPage />} />
          <Route path="/reminderhistory" element={<ReminderHistory />} />
          <Route path="/calenderpage" element={<CalendarPage />} />
          <Route path="/commandpage" element={<Commandpage />} />
          <Route path="/leads" element={<LeadsDashboard />} /> 
          <Route path="/user_analytics" element={<UserAnalyticsPage />} /> 

        </Route>
      </Routes>
    </TabProvider>

    
  );
}

export default App;
