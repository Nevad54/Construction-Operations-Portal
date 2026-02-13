import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { ProjectProvider } from './context/ProjectContext';
import './App.css';

// Lazy load components for code splitting
const Home = lazy(() => import('./Home'));
const About = lazy(() => import('./About'));
const Services = lazy(() => import('./Services'));
const VisionMission = lazy(() => import('./VisionMission'));
const CoreValues = lazy(() => import('./CoreValues'));
const Safety = lazy(() => import('./Safety'));
const Projects = lazy(() => import('./components/Projects'));
const Contact = lazy(() => import('./Contact'));
const Admin = lazy(() => import('./components/Admin'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const UserDashboard = lazy(() => import('./components/UserDashboard'));
const UserFiles = lazy(() => import('./components/UserFiles'));
const ClientFiles = lazy(() => import('./components/ClientFiles'));
const RoleLogin = lazy(() => import('./components/auth/RoleLogin'));
const ProtectedRoute = lazy(() => import('./components/auth/ProtectedRoute'));

// Loading component for Suspense
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-600 text-sm">Loading...</p>
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
      <Router>
        <ScrollToTop />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/vision-mission" element={<VisionMission />} />
            <Route path="/core-values" element={<CoreValues />} />
            <Route path="/safety" element={<Safety />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login/admin" element={<RoleLogin role="admin" />} />
            <Route path="/login/user" element={<RoleLogin role="user" />} />
            <Route
              path="/admin"
              element={(
                <ProtectedRoute role="admin">
                  <Admin />
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
                  <UserFiles />
                </ProtectedRoute>
              )}
            />
            <Route path="/client/files" element={<ClientFiles />} />
          </Routes>
        </Suspense>
      </Router>
    </ProjectProvider>
  );
}

export default App;
