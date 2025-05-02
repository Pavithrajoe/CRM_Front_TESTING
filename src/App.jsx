import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ForgetPassword from "./Components/ForgetPassword";
import SuccessMessage from "./pages/credential/SuccessMessage";
import VerifyCodePage from "./pages/credential/verify_code"; 
import LeadsDashboard from "./pages/dashboard/teamLeadDashboard";
// App.jsx
import Layout from './Components/Layout';
import Login from './pages/credential/login';
import SignupRes from './pages/credential/signup_res';
import RemainderPage from './pages/RemainderPage';

function App() {
  return (
    <Routes>

      <Route path="/" element={<ForgetPassword />} />
      <Route path="/success" element={<SuccessMessage />} />
      <Route path="/verify" element={<VerifyCodePage />} /> 
      <Route path="/leads" element={<LeadsDashboard />} />

      {/* Public Routes */}
      <Route path="/" element={<Login />} />
      <Route path="/signupres" element={<SignupRes />} />

      {/* Protected Layout with Sidebar */}
      <Route element={<Layout />}>
        <Route path="/remainderpage" element={<RemainderPage />} />
        {/* Add more routes here */}
      </Route>
    </Routes>
  );
}

export default App;
