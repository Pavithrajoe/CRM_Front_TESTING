import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/credential/login";
import SignupRes from "./pages/credential/signup_res";
import RemainderPage from "./pages/RemainderPage";

// New imports for layout and authenticated pages
import SidebarLayout from "./Components/SidebarLayout";


function App() {
  return (
    
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/signupres" element={<SignupRes />} />

        {/* Protected Routes with Sidebar */}
        <Route element={<SidebarLayout />}>
        <Route path="/remainderpage" element={<RemainderPage />} />
      
          {/* Add more sidebar-wrapped routes here */}
        </Route>
      </Routes>
    
  );
}

export default App;
