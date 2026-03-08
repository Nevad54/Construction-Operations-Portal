import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Projects from './Projects';
import { useProjects } from '../context/ProjectContext';

vi.mock('aos', () => ({
  default: {
    init: vi.fn(),
  },
  init: vi.fn(),
}));

vi.mock('./PageLayout', () => ({
  __esModule: true,
  default: ({ children }) => <main>{children}</main>,
}));

vi.mock('../context/ProjectContext', () => ({
  useProjects: vi.fn(),
}));
const memoryRouterFutureFlags = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

const renderProjects = () => render(
  <MemoryRouter future={memoryRouterFutureFlags}>
    <Projects />
  </MemoryRouter>
);

describe('Projects route states', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('keeps the page shell visible when project data fails to load', () => {
    useProjects.mockReturnValue({
      projects: [],
      error: 'Could not reach project data.',
      loading: false,
      refreshProjects: vi.fn().mockResolvedValue([]),
      assetBaseUrl: '',
    });

    renderProjects();

    expect(screen.getByRole('heading', { name: /Selected project work/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Project cards could not be loaded right now/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Search projects/i)).toBeInTheDocument();
  });

  test('announces loading state as a live status region', () => {
    useProjects.mockReturnValue({
      projects: [],
      error: null,
      loading: true,
      refreshProjects: vi.fn().mockResolvedValue([]),
      assetBaseUrl: '',
    });

    renderProjects();

    expect(screen.getByRole('status')).toHaveTextContent(/Loading project data/i);
  });

  test('shows the empty state when the API returns no projects', () => {
    useProjects.mockReturnValue({
      projects: [],
      error: null,
      loading: false,
      refreshProjects: vi.fn().mockResolvedValue([]),
      assetBaseUrl: '',
    });

    renderProjects();

    const summary = screen.getByLabelText(/Project summary/i);
    expect(within(summary).getByText('In View')).toBeInTheDocument();
    expect(within(summary).getByText(/projects in portfolio/i)).toBeInTheDocument();
    expect(screen.getByText(/No projects to show yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Ongoing Projects' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Completed Projects' })).not.toBeInTheDocument();
  });

  test('shows a clear filtered no-results state and allows resetting the view', async () => {
    useProjects.mockReturnValue({
      projects: [
        {
          _id: '1',
          title: 'Plant Retrofit',
          location: 'Laguna',
          description: 'Shutdown coordination package',
          status: 'ongoing',
          date: '2026-02-01',
        },
      ],
      error: null,
      loading: false,
      refreshProjects: vi.fn().mockResolvedValue([]),
      assetBaseUrl: '',
    });

    renderProjects();

    await userEvent.type(screen.getByPlaceholderText(/Search by project, location, or scope/i), 'residential');

    expect(screen.getByRole('heading', { name: /No project cards match the current search or status filter/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Clear Filters/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Ongoing Projects' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Clear Filters/i }));

    expect(screen.getByRole('heading', { name: 'Ongoing Projects' })).toBeInTheDocument();
    expect(screen.getByText(/Plant Retrofit/i)).toBeInTheDocument();
  });

  test('shows section-level empty messaging when only one status bucket has projects', () => {
    useProjects.mockReturnValue({
      projects: [
        {
          _id: '1',
          title: 'Campus Fit-Out',
          location: 'Makati',
          description: 'Commercial turnover scope',
          status: 'completed',
          date: '2025-12-12',
        },
      ],
      error: null,
      loading: false,
      refreshProjects: vi.fn().mockResolvedValue([]),
      assetBaseUrl: '',
    });

    renderProjects();

    expect(screen.getByRole('heading', { name: 'Ongoing Projects' })).toBeInTheDocument();
    expect(screen.getByText(/No ongoing projects match the current view/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Completed Projects' })).toBeInTheDocument();
    expect(screen.getByText(/Campus Fit-Out/i)).toBeInTheDocument();
  });

  test('normalizes missing project fields into stable card copy', () => {
    useProjects.mockReturnValue({
      projects: [
        {
          _id: '1',
          title: '',
          location: '',
          description: '',
          status: '',
          date: null,
        },
      ],
      error: null,
      loading: false,
      refreshProjects: vi.fn().mockResolvedValue([]),
      assetBaseUrl: '',
    });

    renderProjects();

    expect(screen.getByText('Untitled Project')).toBeInTheDocument();
    expect(screen.getByText(/Location shared during project review/i)).toBeInTheDocument();
    expect(screen.getByText(/Project summary is being prepared/i)).toBeInTheDocument();
    expect(screen.getByText(/Schedule available on request/i)).toBeInTheDocument();
    expect(screen.getByText(/^Active$/i)).toBeInTheDocument();
  });

  test('treats non-standard active statuses as ongoing section entries', () => {
    useProjects.mockReturnValue({
      projects: [
        {
          _id: '1',
          title: 'Warehouse Upgrade',
          location: 'Cavite',
          description: 'Fit-out and systems scope',
          status: 'in progress',
          date: '2026-01-15',
        },
      ],
      error: null,
      loading: false,
      refreshProjects: vi.fn().mockResolvedValue([]),
      assetBaseUrl: '',
    });

    renderProjects();

    const ongoingSection = screen.getByRole('heading', { name: 'Ongoing Projects' }).closest('.projects-section');
    expect(within(ongoingSection).getByText(/Warehouse Upgrade/i)).toBeInTheDocument();
    expect(within(ongoingSection).getByText(/^In Progress$/i)).toBeInTheDocument();
  });
});
