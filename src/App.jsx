
import { Routes, Route } from "react-router-dom";
import ForgetPassword from "./Components/ForgetPassword";
import SuccessMessage from "./pages/credential/SuccessMessage";
import VerifyCodePage from "./pages/credential/verify_code"; 
import LeadsDashboard from "./pages/LeadDashboard";

function App() {
  return (
    <Routes>
      <Route path="/" element={<ForgetPassword />} />
      <Route path="/success" element={<SuccessMessage />} />
      <Route path="/verify" element={<VerifyCodePage />} /> 
      <Route path="/leads" element={<LeadsDashboard />} />
    </Routes>
  );
}

export default App;
