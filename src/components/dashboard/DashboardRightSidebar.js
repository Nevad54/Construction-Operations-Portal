import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../../services/api';

function formatActivityActionLabel(action) {
  const normalized = String(action || '').trim();
  const labels = {
    'auth.login': 'Sign-in completed',
    'auth.login_failed': 'Sign-in failed',
    'auth.logout': 'Sign-out completed',
    'auth.register': 'Account created',
    'auth.bootstrap_admin': 'First admin bootstrap completed',
    'auth.forgot_password': 'Password reset requested',
    'auth.reset_password': 'Password reset completed',
    'auth.change_password': 'Password changed',
    'admin.user_create': 'User created',
    'admin.user_update': 'User updated',
    'admin.user_deactivate': 'User deactivated',
    'admin.user_reactivate': 'User reactivated',
    'admin.user_reset_password': 'Admin password reset',
    'admin.export_users': 'Users export completed',
    'admin.export_inquiries': 'Inquiries export completed',
    'admin.export_activity': 'Activity export completed',
    'admin.export_all': 'Full admin export completed',
  };
  return labels[normalized] || normalized || 'Activity';
}

function formatRelativeTime(value) {
  if (!value) return 'Just now';
  const parsed = new Date(value).getTime();
  if (!Number.isFinite(parsed)) return 'Recently';
  const diffMs = Date.now() - parsed;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diffMs < hour) {
    const minutes = Math.max(1, Math.round(diffMs / minute));
    return `${minutes}m ago`;
  }
  if (diffMs < day) {
    return `${Math.max(1, Math.round(diffMs / hour))}h ago`;
  }
  return `${Math.max(1, Math.round(diffMs / day))}d ago`;
}

function getActivityIcon(action) {
  const normalized = String(action || '');
  if (normalized.startsWith('auth.')) return 'AU';
  if (normalized.startsWith('admin.export_')) return 'EX';
  if (normalized.startsWith('admin.user_')) return 'US';
  if (normalized.startsWith('admin.inquiry_')) return 'IQ';
  return 'OK';
}

function buildAttentionItems({ isAdminRoute, systemStatus, projects }) {
  if (!isAdminRoute) {
    return [
      {
        id: 'workspace',
        label: 'Workspace ready',
        detail: 'Use the main navigation to move between projects, files, and requests.',
        tone: 'neutral',
        href: null,
      },
    ];
  }

  const items = [];
  if (systemStatus?.failedLoginCount > 0) {
    items.push({
      id: 'failed-logins',
      label: `${systemStatus.failedLoginCount} failed sign-in${systemStatus.failedLoginCount === 1 ? '' : 's'} this week`,
      detail: 'Review auth activity before handing the portal to another operator.',
      tone: 'warning',
      href: '/admin/dashboard/reports?activityCategory=auth',
    });
  }
  if (systemStatus?.inactiveUserCount > 0) {
    items.push({
      id: 'inactive-users',
      label: `${systemStatus.inactiveUserCount} inactive account${systemStatus.inactiveUserCount === 1 ? '' : 's'} waiting for review`,
      detail: 'Reactivate only the people who should regain access.',
      tone: 'warning',
      href: '/admin/dashboard/clients?userStatus=inactive',
    });
  }
  if (!systemStatus?.emailConfigured) {
    items.push({
      id: 'email-missing',
      label: 'Reset email is not configured',
      detail: 'Forgot-password will only log reset links locally until email delivery is configured.',
      tone: 'warning',
      href: '/admin/dashboard/settings',
    });
  }
  if (!systemStatus?.frontendUrlConfigured) {
    items.push({
      id: 'frontend-url',
      label: 'Frontend URL is missing',
      detail: 'Password reset links may point to the wrong host.',
      tone: 'warning',
      href: '/admin/dashboard/settings',
    });
  }
  if (!projects.length) {
    items.push({
      id: 'projects-empty',
      label: 'No projects are live yet',
      detail: 'Add the first real project before sharing the admin portal.',
      tone: 'neutral',
      href: '/admin/dashboard/projects',
    });
  }

  return items.length
    ? items
    : [
        {
          id: 'all-clear',
          label: 'No urgent admin cleanup signals',
          detail: 'Auth, access review, and project inventory are currently in a stable state.',
          tone: 'success',
          href: null,
        },
      ];
}

export default function DashboardRightSidebar() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin/dashboard');
  const [projects, setProjects] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);

  useEffect(() => {
    let active = true;
    const loadSidebarData = async () => {
      try {
        const requests = [api.getProjects(), api.getActivityLogs({ limit: 5 })];
        if (isAdminRoute) {
          requests.push(api.adminSystemStatus());
        }
        const [projectsResponse, activityResponse, statusResponse] = await Promise.all(requests);
        if (!active) return;
        setProjects(Array.isArray(projectsResponse) ? projectsResponse : []);
        setActivityLogs(Array.isArray(activityResponse?.logs) ? activityResponse.logs : []);
        setSystemStatus(isAdminRoute ? (statusResponse || null) : null);
      } catch (error) {
        if (!active) return;
        setProjects([]);
        setActivityLogs([]);
        setSystemStatus(null);
      }
    };
    loadSidebarData();
    return () => {
      active = false;
    };
  }, [isAdminRoute, location.pathname]);

  const projectSummary = useMemo(() => {
    const ongoing = projects.filter((project) => String(project?.status || '').toLowerCase() !== 'completed').length;
    const completed = projects.filter((project) => String(project?.status || '').toLowerCase() === 'completed').length;
    return {
      total: projects.length,
      ongoing,
      completed,
    };
  }, [projects]);

  const attentionItems = useMemo(
    () => buildAttentionItems({ isAdminRoute, systemStatus, projects }),
    [isAdminRoute, projects, systemStatus],
  );

  const snapshotItems = useMemo(() => {
    if (isAdminRoute) {
      return [
        { label: 'Total Projects', value: String(projectSummary.total), tone: 'text-text-primary dark:text-gray-100' },
        { label: 'Ongoing Work', value: String(projectSummary.ongoing), tone: 'text-brand dark:text-brand-400' },
        { label: 'Completed', value: String(projectSummary.completed), tone: 'text-feedback-success dark:text-green-400' },
        {
          label: 'Failed Sign-Ins',
          value: String(systemStatus?.failedLoginCount || 0),
          tone: systemStatus?.failedLoginCount ? 'text-feedback-warning dark:text-yellow-400' : 'text-text-primary dark:text-gray-100',
        },
      ];
    }

    return [
      { label: 'Projects', value: String(projectSummary.total), tone: 'text-text-primary dark:text-gray-100' },
      { label: 'Active Work', value: String(projectSummary.ongoing), tone: 'text-brand dark:text-brand-400' },
      { label: 'Completed', value: String(projectSummary.completed), tone: 'text-feedback-success dark:text-green-400' },
    ];
  }, [isAdminRoute, projectSummary, systemStatus]);

  return (
    <aside className="hidden xl:flex xl:flex-col w-72 2xl:w-80 flex-shrink-0 px-3 2xl:px-4 py-6 2xl:py-8">
      <div className="sticky top-24 space-y-4">
        <div id="dashboard-right-sidebar-slot" className="space-y-4" />

        <div className="bg-surface-card dark:bg-gray-900 rounded-lg shadow-sm border border-stroke dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-text-primary dark:text-gray-100 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-brand dark:text-brand-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V5a1 1 0 00-1-1h3a1 1 0 000-2 2 2 0 00-2 2V5zM9 9a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
            </svg>
            Workspace Snapshot
          </h3>
          <dl className="space-y-3">
            {snapshotItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3">
                <dt className="text-sm text-text-secondary dark:text-gray-400">{item.label}</dt>
                <dd className={`text-lg font-semibold ${item.tone}`}>{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="bg-surface-card dark:bg-gray-900 rounded-lg shadow-sm border border-stroke dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-text-primary dark:text-gray-100 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-brand dark:text-brand-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3a1 1 0 102 0V7zm-1 7a1.25 1.25 0 100-2.5A1.25 1.25 0 0010 14z" clipRule="evenodd" />
            </svg>
            Needs Attention
          </h3>
          <div className="space-y-3">
            {attentionItems.map((item) => {
              const toneClass = item.tone === 'warning'
                ? 'border-yellow-500/30 bg-yellow-500/5 dark:border-yellow-600/40 dark:bg-yellow-500/10'
                : item.tone === 'success'
                  ? 'border-green-500/30 bg-green-500/5 dark:border-green-600/30 dark:bg-green-500/10'
                  : 'border-stroke dark:border-gray-700 bg-surface-page/70 dark:bg-gray-950/40';
              const content = (
                <div className={`rounded-lg border p-3 transition-colors ${toneClass}`}>
                  <p className="text-sm font-medium text-text-primary dark:text-gray-100">{item.label}</p>
                  <p className="text-xs text-text-secondary dark:text-gray-400 mt-1">{item.detail}</p>
                </div>
              );
              return item.href ? (
                <Link key={item.id} to={item.href} className="block">
                  {content}
                </Link>
              ) : (
                <div key={item.id}>{content}</div>
              );
            })}
          </div>
        </div>

        <div className="bg-surface-card dark:bg-gray-900 rounded-lg shadow-sm border border-stroke dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-text-primary dark:text-gray-100 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-brand dark:text-brand-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 2a1 1 0 011-1h8a1 1 0 011 1v1H5V2zm0 4v10a2 2 0 002 2h6a2 2 0 002-2V6H5z" clipRule="evenodd" />
            </svg>
            Recent Activity
          </h3>
          {activityLogs.length === 0 ? (
            <p className="text-sm text-text-muted dark:text-gray-500">
              Live activity will appear here after sign-ins, exports, user updates, or inquiry work.
            </p>
          ) : (
            <ul className="space-y-3">
              {activityLogs.slice(0, 5).map((item, index) => (
                <li key={item._id || `${item.action}-${item.createdAt}-${index}`} className="flex gap-3 pb-3 border-b border-stroke/50 dark:border-gray-700/50 last:border-0 last:pb-0">
                  <div className="flex-shrink-0 w-7 h-7 rounded-md bg-brand-subtle dark:bg-brand-600/20 text-brand dark:text-brand-400 text-[10px] flex items-center justify-center font-semibold">
                    {getActivityIcon(item.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary dark:text-gray-100 leading-snug">{formatActivityActionLabel(item.action)}</p>
                    <p className="text-xs text-text-secondary dark:text-gray-400 mt-1 line-clamp-2">{item.details || 'No details recorded.'}</p>
                    <p className="text-xs text-text-muted dark:text-gray-500 mt-1">{formatRelativeTime(item.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}
