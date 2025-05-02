// App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './Components/Layout';
import Login from './pages/credential/login';
import SignupRes from './pages/credential/signup_res';
import RemainderPage from './pages/RemainderPage';
import ReminderHistory from './pages/reminderHistory';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Login />} />
      <Route path="/signupres" element={<SignupRes />} />

      {/* Protected Layout with Sidebar */}
      <Route element={<Layout />}>
        <Route path="/remainderpage" element={<RemainderPage />} />
        <Route path="/reminderhistory" element={<ReminderHistory />} />
        {/* Add more routes here */}
      </Route>
    </Routes>
  );
}

export default App;
