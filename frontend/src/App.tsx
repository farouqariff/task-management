import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import type { ReactNode } from "react";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/ErrorPages/NotFound";
import Profile from "./pages/Users/Profile";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import ResetPassword from "./pages/AuthPages/ResetPassword";
import NewPassword from "./pages/AuthPages/NewPassword";
import Log from "./pages/Log";
import Task from "./pages/MyTasks";
import Users from "./pages/Users/Index";
import Projects from "./pages/Projects/Index";
import ProjectDetail from "./pages/Projects/ProjectDetail";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Unauthorized from "./pages/ErrorPages/Unauthorized";
import Forbidden from "./pages/ErrorPages/Forbidden";

function PrivateRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/signin" replace />;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/tasks" replace /> : <>{children}</>;
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return user?.is_admin ? (
    <>{children}</>
  ) : (
    <Navigate to="/error-401" replace />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Protected Dashboard Layout */}
          <Route
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          >
            <Route index path="/" element={<Navigate to="/tasks" replace />} />

            {/* Admin Pages */}
            <Route
              path="/log"
              element={
                <AdminRoute>
                  <Log />
                </AdminRoute>
              }
            />
            <Route
              path="/users"
              element={
                <AdminRoute>
                  <Users />
                </AdminRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <AdminRoute>
                  <Projects />
                </AdminRoute>
              }
            />

            {/* Task */}
            <Route path="/tasks" element={<Task />} />

            {/* Project Detail */}
            <Route path="/project/:id" element={<ProjectDetail />} />

            {/* Profile */}
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Public Auth Routes — redirect to dashboard if already logged in */}
          <Route
            path="/signin"
            element={
              <PublicRoute>
                <SignIn />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <SignUp />
              </PublicRoute>
            }
          />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/new-password/:token" element={<NewPassword />} />

          {/* Fallback */}
          <Route path="/error-401" element={<Unauthorized />} />
          <Route path="/error-403" element={<Forbidden />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
