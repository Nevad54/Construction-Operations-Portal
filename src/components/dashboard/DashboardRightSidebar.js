import React from 'react';

const recentActivity = [
  { id: 1, text: 'Project "Site A" marked completed', time: '2h ago', icon: 'OK' },
  { id: 2, text: 'New project "Renovation B" added', time: '5h ago', icon: '+' },
  { id: 3, text: 'Image updated for "Commercial C"', time: '1d ago', icon: '*' },
];

export default function DashboardRightSidebar() {
  return (
    <aside className="hidden xl:flex xl:flex-col w-72 2xl:w-80 flex-shrink-0 px-3 2xl:px-4 py-6 2xl:py-8">
      <div className="sticky top-24 space-y-4">
        {/* Slot for FileManager's inspector preview (portal target). */}
        <div id="dashboard-right-sidebar-slot" className="space-y-4" />

        <div className="bg-surface-card dark:bg-gray-900 rounded-lg shadow-sm border border-stroke dark:border-gray-700 p-5 hover:shadow-md dark:hover:shadow-lg transition-shadow duration-fast">
          <h3 className="text-sm font-semibold text-text-primary dark:text-gray-100 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-brand dark:text-brand-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V5a1 1 0 00-1-1h3a1 1 0 000-2 2 2 0 00-2 2V5zM9 9a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
            </svg>
            Quick Summary
          </h3>
          <dl className="space-y-3">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-text-secondary dark:text-gray-400">Ongoing Projects</dt>
              <dd className="text-lg font-semibold text-brand dark:text-brand-400">-</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-text-secondary dark:text-gray-400">Completed</dt>
              <dd className="text-lg font-semibold text-feedback-success dark:text-green-400">-</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-text-secondary dark:text-gray-400">Total Projects</dt>
              <dd className="text-lg font-semibold text-text-primary dark:text-gray-100">-</dd>
            </div>
          </dl>
        </div>

        <div className="bg-surface-card dark:bg-gray-900 rounded-lg shadow-sm border border-stroke dark:border-gray-700 p-5 hover:shadow-md dark:hover:shadow-lg transition-shadow duration-fast">
          <h3 className="text-sm font-semibold text-text-primary dark:text-gray-100 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-brand dark:text-brand-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 2a1 1 0 011-1h8a1 1 0 011 1v1H5V2zm0 4v10a2 2 0 002 2h6a2 2 0 002-2V6H5z" clipRule="evenodd" />
            </svg>
            Recent Activity
          </h3>
          <ul className="space-y-3">
            {recentActivity.map((item) => (
              <li key={item.id} className="flex gap-3 pb-3 border-b border-stroke/50 dark:border-gray-700/50 last:border-0 last:pb-0">
                <div className="flex-shrink-0 w-6 h-6 rounded-md bg-brand-subtle dark:bg-brand-600/20 text-brand dark:text-brand-400 text-xs flex items-center justify-center font-semibold">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-secondary dark:text-gray-400 leading-snug">{item.text}</p>
                  <p className="text-xs text-text-muted dark:text-gray-500 mt-1">{item.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-surface-card dark:bg-gray-900 rounded-lg shadow-sm border border-stroke dark:border-gray-700 p-5 hover:shadow-md dark:hover:shadow-lg transition-shadow duration-fast">
          <h3 className="text-sm font-semibold text-text-primary dark:text-gray-100 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-brand dark:text-brand-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 110-6 3 3 0 010 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM15 8a2 2 0 11-4 0 2 2 0 014 0z" />
              <path fillRule="evenodd" d="M0 14.5A4.5 4.5 0 014.5 10h11A4.5 4.5 0 0120 14.5v1a2 2 0 01-2 2H2a2 2 0 01-2-2v-1z" clipRule="evenodd" />
            </svg>
            Team
          </h3>
          <div className="space-y-3">
            <p className="text-sm text-text-muted dark:text-gray-500">No one else online</p>
            <button className="w-full px-3 py-2 rounded-lg bg-brand-subtle dark:bg-brand-600/20 text-brand dark:text-brand-400 text-sm font-medium hover:bg-brand-subtle/80 dark:hover:bg-brand-600/30 transition-colors duration-fast">
              Invite Team Members
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
