import React from 'react';
import FileManager from './files/FileManager';

export default function ClientFiles() {
  return (
    <div className="min-h-screen bg-surface-page dark:bg-gray-950 text-text-primary dark:text-gray-100 px-3 sm:px-4 py-4 sm:py-8">
      <div className="max-w-6xl mx-auto">
        <FileManager expectedRole="client" title="Client Shared Files" />
      </div>
    </div>
  );
}
