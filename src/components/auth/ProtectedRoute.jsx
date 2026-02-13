import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api } from '../../services/api';

const roleHome = {
  admin: '/admin/dashboard',
  user: '/user/dashboard',
  client: '/client/files',
};

const roleLogin = {
  admin: '/login/admin',
  user: '/login/user',
  client: '/login/client',
};

export default function ProtectedRoute({ role, children }) {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const data = await api.me();
        if (!active) return;
        setUser(data?.user || null);
      } catch (err) {
        if (!active) return;
        setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    check();
    return () => {
      active = false;
    };
  }, []);

  const loginPath = useMemo(() => roleLogin[role] || '/login/user', [role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-page dark:bg-gray-950 text-text-primary dark:text-gray-100 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-stroke dark:border-gray-700 bg-surface-card dark:bg-gray-900 p-6">
            <p className="text-text-secondary dark:text-gray-400">Checking session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />;
  }

  if (role && user.role !== role) {
    return <Navigate to={roleHome[user.role] || '/'} replace />;
  }

  return children;
}
