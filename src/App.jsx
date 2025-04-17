import { Routes, Route, Navigate, useLocation } from "react-router"; // Change from "react-router" to "react-router-dom"
import { useEffect, useState } from "react"; // ลบ useMemo ที่ไม่ได้ใช้
import Login from "./pages/Login";
import RootLayout from "./layout/RootLayout";
import Register from "./pages/Register";
import NotFound from "./components/NotFound";
import Issuestable from "./pages/Issuestable";
import DashboardLayout from "./layout/DashboardLayout";
import Settings from "./pages/Settings";
import Messages from "./pages/Messages";
import Reports from "./pages/Reports";
import ForgotPassword from "./pages/ForgotPassword";
import Overview from "./pages/Overview";
import ManageRoles from "./pages/ManageRoles";
import ResetSetup from "./pages/ResetSetup";
import UserHome from "./pages/UserHome";
import UserDashboardLayout from "./layout/UserDashboardLayout";
import NotAuthorized from "./pages/NotAuthorized";
import { hasRequiredRole } from "./utils/authUtils";
// ตั้งค่าการนำเข้า useUser เพื่อใช้ใน AuthContext ถ้าต้องการ
// แต่เนื่องจากไม่ได้ใช้งานในไฟล์นี้จึงลบออกไป

import PropTypes from "prop-types";
import UserManagement from "./pages/UserManagement";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          setUserRole(user.role);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Failed to parse user data:", error);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }

      setLoading(false);
    };

    checkAuth();
  }, [location.pathname]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !hasRequiredRole(userRole, allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
};

const App = () => {

  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        {/* Public Routes */}
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password/*" element={<ResetSetup />} />
        <Route path="unauthorized" element={<NotAuthorized />} />

        {/* Admin & Super Admin Routes */}
        <Route
          element={
            <ProtectedRoute allowedRoles={["Admin", "SuperAdmin"]}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
          <Route index element={<Overview />} />
          <Route path="table" element={<Issuestable />} />
          <Route path="messages" element={<Messages />} />
          <Route path="settings" element={<Settings />} />

          {/* Super Admin Only Routes */}
          <Route
            path="reports"
            element={
              <ProtectedRoute allowedRoles={["SuperAdmin"]}>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="manage-roles"
            element={
              <ProtectedRoute allowedRoles={["SuperAdmin"]}>
                <ManageRoles />
              </ProtectedRoute>
            }
          />
          <Route
            path="user-management"
            element={
              <ProtectedRoute allowedRoles={["SuperAdmin"]}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* User Routes */}
        <Route
          path="user"
          element={
            <ProtectedRoute allowedRoles={["User"]}>
              <UserDashboardLayout />
            </ProtectedRoute>
          }>
          <Route path="home" element={<UserHome />} />
          <Route path="message" element={<Messages />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Catch-all Route */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default App;
