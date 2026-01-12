import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const allowed = localStorage.getItem("access") === "true";
  return allowed ? <Outlet /> : <Navigate to="/" replace />;
}
