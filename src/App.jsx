import React from "react";
import { Routes, Route } from "react-router-dom";
import ForgetPassword from "./Components/ForgetPassword";
import SuccessMessage from "./pages/credential/SuccessMessage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<ForgetPassword />} />
      <Route path="/success" element={<SuccessMessage />} />
    </Routes>
  );
}

export default App;
