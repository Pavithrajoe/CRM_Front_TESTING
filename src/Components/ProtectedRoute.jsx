import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  // This could be a login check, token, or even a localStorage flag
  const allowed = localStorage.getItem("access") === "true";

  return allowed ? <Outlet /> : <Navigate to="/" replace />;
}
