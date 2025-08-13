import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { UserContext } from "../context/UserContext";

export default function PrivateRoute() {
  const { isLoggedIn } = useContext(UserContext);
  return isLoggedIn ? <Outlet /> : <Navigate to="/active-leads" replace />;
}
