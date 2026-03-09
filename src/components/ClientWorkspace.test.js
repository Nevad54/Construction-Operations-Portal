import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ClientWorkspace from './ClientWorkspace';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    me: vi.fn(),
    getFiles: vi.fn(),
    getProjects: vi.fn(),
    getClientFollowUps: vi.fn(),
  },
}));

const memoryRouterFutureFlags = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

describe('ClientWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders a client workspace summary with status, files, and next actions', async () => {
    api.me.mockResolvedValueOnce({
      user: { id: 'client-1', username: 'client', role: 'client' },
    });
    api.getFiles.mockResolvedValueOnce([
      {
        _id: 'file-1',
        originalName: 'Permit Set A.pdf',
        projectId: 'project-1',
        visibility: 'client',
        createdAt: '2026-03-06T09:00:00.000Z',
        updatedAt: '2026-03-07T10:30:00.000Z',
      },
      {
        _id: 'file-2',
        originalName: 'Closeout Checklist.xlsx',
        projectId: 'project-2',
        visibility: 'client',
        createdAt: '2026-03-05T09:00:00.000Z',
        updatedAt: '2026-03-06T08:15:00.000Z',
      },
    ]);
    api.getProjects.mockResolvedValueOnce([
      { _id: 'project-1', title: 'North Plant Retrofit', status: 'ongoing' },
      { _id: 'project-2', title: 'South Tower Closeout', status: 'completed' },
    ]);
    api.getClientFollowUps.mockResolvedValueOnce({
      items: [
        {
          id: 'inq-1',
          projectType: 'Industrial Retrofit',
          message: 'Need confirmation on permit sequencing.',
          status: 'in_progress',
          owner: 'project-controls',
          nextFollowUpAt: '2026-03-09T09:00:00.000Z',
          createdAt: '2026-03-07T10:00:00.000Z',
          updatedAt: '2026-03-08T11:00:00.000Z',
        },
      ],
    });

    render(
      <MemoryRouter future={memoryRouterFutureFlags}>
        <ClientWorkspace />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /keep project visibility, shared files, and next actions in one place/i })).toBeInTheDocument();
    expect(screen.getByText('North Plant Retrofit')).toBeInTheDocument();
    expect(screen.getAllByText('South Tower Closeout').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Permit Set A.pdf').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'Client Review Queue' })).toBeInTheDocument();
    expect(screen.getByText('Approval review')).toBeInTheDocument();
    expect(screen.getByText('Closeout review')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Follow-Up Status' })).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText(/Need confirmation on permit sequencing/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Next Actions' })).toBeInTheDocument();
    expect(screen.getByText(/review the latest shared document/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open shared files/i })).toHaveAttribute('href', '/client/files');
    expect(screen.getAllByRole('link', { name: /request follow-up/i })[0]).toHaveAttribute(
      'href',
      expect.stringContaining('/contact?')
    );
    expect(screen.getAllByRole('link', { name: /request follow-up/i })[0]).toHaveAttribute(
      'href',
      expect.stringContaining('source=client-workspace')
    );
    expect(screen.getAllByRole('link', { name: /approve item/i })[0]).toHaveAttribute(
      'href',
      expect.stringContaining('context=approval-approved')
    );
    expect(screen.getAllByRole('link', { name: /request changes/i })[0]).toHaveAttribute(
      'href',
      expect.stringContaining('context=approval-changes')
    );
  });

  test('keeps the shell useful when project metadata fails to load', async () => {
    api.me.mockResolvedValueOnce({
      user: { id: 'client-1', username: 'client', role: 'client' },
    });
    api.getFiles.mockResolvedValueOnce([
      {
        _id: 'file-1',
        originalName: 'Updated Site Photo.jpg',
        visibility: 'client',
        createdAt: '2026-03-07T12:00:00.000Z',
        updatedAt: '2026-03-07T12:00:00.000Z',
      },
    ]);
    api.getProjects.mockRejectedValueOnce(new Error('Projects unavailable'));
    api.getClientFollowUps.mockRejectedValueOnce(new Error('Follow-ups unavailable'));

    render(
      <MemoryRouter future={memoryRouterFutureFlags}>
        <ClientWorkspace />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Current Project Status' })).toBeInTheDocument();
    expect(screen.getByText(/project labels could not be loaded/i)).toBeInTheDocument();
    expect(screen.getByText(/follow-up status is temporarily unavailable/i)).toBeInTheDocument();
    expect(screen.getAllByText('Updated Site Photo.jpg').length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /review portal overview/i })).toHaveAttribute('href', '/client-portal');
  });

  test('surfaces a residential handoff spotlight when homeowner-facing closeout files exist', async () => {
    api.me.mockResolvedValueOnce({
      user: { id: 'client-1', username: 'client', role: 'client' },
    });
    api.getFiles.mockResolvedValueOnce([
      {
        _id: 'file-12',
        originalName: 'homeowner-closeout-package.pdf',
        projectId: 'project-12',
        visibility: 'client',
        createdAt: '2026-03-07T12:00:00.000Z',
        updatedAt: '2026-03-07T12:00:00.000Z',
      },
    ]);
    api.getProjects.mockResolvedValueOnce([
      { _id: 'project-12', title: 'Homeowner Condo Fit-Out', status: 'completed' },
    ]);
    api.getClientFollowUps.mockResolvedValueOnce({ items: [] });

    render(
      <MemoryRouter future={memoryRouterFutureFlags}>
        <ClientWorkspace />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Residential Handoff Spotlight/i)).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: 'Homeowner Condo Fit-Out' }).length).toBeGreaterThan(0);
    expect(screen.getByText(/Closeout material is ready for homeowner review/i)).toBeInTheDocument();
    expect(screen.getAllByText(/homeowner-closeout-package\.pdf/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Closeout review')).toBeInTheDocument();
    expect(screen.getByText('Ready for handoff')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /review residential files/i })).toHaveAttribute('href', '/client/files');
  });

  test('surfaces approval decisions distinctly in follow-up status when workspace requests are tracked', async () => {
    api.me.mockResolvedValueOnce({
      user: { id: 'client-1', username: 'client', role: 'client' },
    });
    api.getFiles.mockResolvedValueOnce([]);
    api.getProjects.mockResolvedValueOnce([]);
    api.getClientFollowUps.mockResolvedValueOnce({
      items: [
        {
          id: 'inq-approved',
          projectType: 'Commercial Fit-Out',
          message: 'Approving "Tenant Finish Schedule.pdf" for Lobby Refresh.',
          source: 'client-workspace',
          notes: 'Context: approval-approved',
          status: 'new',
          owner: '',
          nextFollowUpAt: '',
          createdAt: '2026-03-08T10:00:00.000Z',
          updatedAt: '2026-03-08T10:00:00.000Z',
        },
        {
          id: 'inq-changes',
          projectType: 'Residential Renovation',
          message: 'Requesting changes on "homeowner-closeout-package.pdf" for Homeowner Condo Fit-Out.',
          source: 'client-workspace',
          notes: 'Context: approval-changes',
          status: 'new',
          owner: '',
          nextFollowUpAt: '',
          createdAt: '2026-03-08T11:00:00.000Z',
          updatedAt: '2026-03-08T11:00:00.000Z',
        },
      ],
    });

    render(
      <MemoryRouter future={memoryRouterFutureFlags}>
        <ClientWorkspace />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Follow-Up Status' })).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Changes Requested')).toBeInTheDocument();
    expect(screen.getByText(/Tracking note: approval-approved/i)).toBeInTheDocument();
    expect(screen.getByText(/Tracking note: approval-changes/i)).toBeInTheDocument();
  });
});
