import React from 'react';
import { Link } from 'react-router-dom';
import FileManager from './files/FileManager';
import { Card, CardContent } from './ui';

export default function ClientFiles() {
  return (
    <div className="min-h-screen bg-surface-page dark:bg-gray-950 text-text-primary dark:text-gray-100 px-3 sm:px-4 py-4 sm:py-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <Card variant="subtle">
          <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Client Files</p>
              <p className="text-sm text-text-secondary dark:text-gray-400">
                Use the workspace summary for current handoff context, then open the file library when you need the full document set.
              </p>
            </div>
            <Link
              to="/client/workspace"
              className="inline-flex items-center justify-center rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-text-primary transition-all hover:bg-surface-muted dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800"
            >
              Back to workspace summary
            </Link>
          </CardContent>
        </Card>
        <FileManager expectedRole="client" title="Client Shared Files" />
      </div>
    </div>
  );
}
