import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { ProjectProvider } from './context/ProjectContext';
import './App.css';

const routerFutureFlags = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

// Lazy load components for code splitting
const Home = lazy(() => import('./Home'));
const About = lazy(() => import('./About'));
const ClientPortal = lazy(() => import('./ClientPortal'));
const Services = lazy(() => import('./Services'));
const IndustrialLandingPage = lazy(() => import('./IndustrialLandingPage'));
const CommercialLandingPage = lazy(() => import('./CommercialLandingPage'));
const RenovationLandingPage = lazy(() => import('./RenovationLandingPage'));
const ResidentialLandingPage = lazy(() => import('./ResidentialLandingPage'));
const Safety = lazy(() => import('./Safety'));
const Projects = lazy(() => import('./components/Projects'));
const Contact = lazy(() => import('./Contact'));
const Admin = lazy(() => import('./components/Admin'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const UserDashboard = lazy(() => import('./components/UserDashboard'));
const ClientWorkspace = lazy(() => import('./components/ClientWorkspace'));
const ClientFiles = lazy(() => import('./components/ClientFiles'));
const RoleLogin = lazy(() => import('./components/auth/RoleLogin'));
const AdminBootstrap = lazy(() => import('./components/auth/AdminBootstrap'));
const ForgotPassword = lazy(() => import('./components/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./components/auth/ResetPassword'));
const ProtectedRoute = lazy(() => import('./components/auth/ProtectedRoute'));

// Loading component for Suspense
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-surface-page dark:bg-gray-950">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
      <p className="text-text-secondary dark:text-gray-400 text-sm">Loading...</p>
    </div>
  </div>
);

// Scroll to top component
const ScrollToTop = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

function App() {
  return (
    <ProjectProvider>
      <Router future={routerFutureFlags}>
        <ScrollToTop />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/client-portal" element={<ClientPortal />} />
            <Route path="/services" element={<Services />} />
            <Route path="/solutions/industrial" element={<IndustrialLandingPage />} />
            <Route path="/solutions/commercial" element={<CommercialLandingPage />} />
            <Route path="/solutions/renovation" element={<RenovationLandingPage />} />
            <Route path="/solutions/residential" element={<ResidentialLandingPage />} />
            <Route path="/safety" element={<Safety />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/signin" element={<RoleLogin variant="public" />} />
            <Route path="/signup" element={<RoleLogin variant="signup" />} />
            <Route path="/staff/signin" element={<RoleLogin variant="staff" />} />
            <Route path="/setup/admin" element={<AdminBootstrap />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/login/admin" element={<Navigate to="/staff/signin" replace />} />
            <Route path="/login/user" element={<Navigate to="/staff/signin" replace />} />
            <Route path="/login/client" element={<Navigate to="/signin" replace />} />
            <Route
              path="/admin"
              element={(
                <ProtectedRoute role="admin">
                  <Admin />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/admin/dashboard"
              element={(
                <ProtectedRoute role="admin">
                  <Navigate to="/admin/dashboard/projects" replace />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/admin/dashboard/*"
              element={(
                <ProtectedRoute role="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              )}
            />
            <Route path="/admin/projects" element={<Navigate to="/admin/dashboard/projects" replace />} />
            <Route path="/admin/files" element={<Navigate to="/admin/dashboard/files" replace />} />
            <Route path="/admin/clients" element={<Navigate to="/admin/dashboard/clients" replace />} />
            <Route path="/admin/reports" element={<Navigate to="/admin/dashboard/reports" replace />} />
            <Route path="/admin/settings" element={<Navigate to="/admin/dashboard/settings" replace />} />
            <Route
              path="/user"
              element={(
                <ProtectedRoute role="user">
                  <Navigate to="/user/dashboard" replace />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/user/dashboard/*"
              element={(
                <ProtectedRoute role="user">
                  <UserDashboard />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/user/files"
              element={(
                <ProtectedRoute role="user">
                  <Navigate to="/user/dashboard/files" replace />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/client"
              element={(
                <ProtectedRoute role="client">
                  <Navigate to="/client/workspace" replace />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/client/workspace"
              element={(
                <ProtectedRoute role="client">
                  <ClientWorkspace />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/client/files"
              element={(
                <ProtectedRoute role="client">
                  <ClientFiles />
                </ProtectedRoute>
              )}
            />
          </Routes>
        </Suspense>
      </Router>
    </ProjectProvider>
  );
}

export default App;
