import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import FileManager from './FileManager';
import { api } from '../../services/api';

vi.mock('../../services/api', () => ({
  api: {
    me: vi.fn(),
    login: vi.fn(),
    getFiles: vi.fn(),
    getFolders: vi.fn(),
    getProjects: vi.fn(),
    getActivityLogs: vi.fn(),
    uploadFile: vi.fn(),
    updateFile: vi.fn(),
    deleteFile: vi.fn(),
    getFilePreview: vi.fn(),
    createFolder: vi.fn(),
    moveFilesBulk: vi.fn(),
    copyFilesBulk: vi.fn(),
    moveFolder: vi.fn(),
    copyFolder: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

const renderFileManager = (props = {}) =>
  render(<FileManager expectedRole="admin" title="Admin File Management" {...props} />);

describe('FileManager admin integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.innerWidth = 1440;
    window.localStorage.clear();
    window.sessionStorage.clear();

    mockedApi.me.mockResolvedValue({
      user: { id: 'admin-1', username: 'admin', role: 'admin', projectIds: [] },
    });
    mockedApi.login.mockResolvedValue({});
    mockedApi.getFiles.mockResolvedValue([]);
    mockedApi.getFolders.mockResolvedValue([]);
    mockedApi.getProjects.mockResolvedValue([
      { _id: 'project-1', title: 'Tower Refresh' },
      { _id: 'project-2', title: 'Plant Upgrade' },
    ]);
    mockedApi.getActivityLogs.mockResolvedValue([
      {
        _id: 'log-1',
        actorRole: 'admin',
        action: 'file.upload',
        details: 'Uploaded turnover binder',
        createdAt: '2026-03-08T10:00:00.000Z',
      },
    ]);
    mockedApi.uploadFile.mockResolvedValue({ ok: true });
  });

  test('shows admin activity controls and loads recent file activity', async () => {
    renderFileManager();

    expect(await screen.findByText(/Signed in as/i)).toBeInTheDocument();
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View all' })).toBeInTheDocument();

    await waitFor(() => {
      expect(mockedApi.getActivityLogs).toHaveBeenCalledWith({ limit: 40 });
    });
    expect(screen.getByText(/Uploaded turnover binder/)).toBeInTheDocument();
  });

  test('blocks client-shared upload when no project is assigned', async () => {
    renderFileManager();

    expect(await screen.findByRole('button', { name: 'Upload' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).not.toBeNull();
    const uploadFile = new File(['permit'], 'permit.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [uploadFile] } });
    fireEvent.change(screen.getByLabelText('Visibility'), { target: { value: 'client' } });
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Upload' }));

    await waitFor(() => {
      expect(screen.getAllByText('Client shared files must be assigned to a project.').length).toBeGreaterThanOrEqual(1);
    });
    expect(mockedApi.uploadFile).not.toHaveBeenCalled();
  });

  test('shows a role mismatch message when a non-admin session lands on the admin file route', async () => {
    mockedApi.me.mockResolvedValueOnce({
      user: { id: 'user-1', username: 'employee', role: 'user', projectIds: ['project-1'] },
    });

    renderFileManager();

    expect(await screen.findByText('Role Mismatch')).toBeInTheDocument();
    expect(screen.getByText(/Logged in as/)).toHaveTextContent('Logged in as employee (user). This page requires admin.');
    expect(mockedApi.getFiles).toHaveBeenCalledTimes(1);
    expect(mockedApi.getActivityLogs).not.toHaveBeenCalledWith({ limit: 40 });
    expect(screen.queryByText('Recent Activity')).not.toBeInTheDocument();
  });
});
