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

    expect(screen.getByRole('heading', { name: /Project proof that sells both delivery capability/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Case study cards could not be loaded right now/i })).toBeInTheDocument();
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
    expect(within(summary).getByText('Case Studies')).toBeInTheDocument();
    expect(within(summary).getByText(/case studies in proof set/i)).toBeInTheDocument();
    expect(screen.getByText(/No projects to show yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Live Delivery Stories' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Completed Case Studies' })).not.toBeInTheDocument();
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

    expect(screen.getByRole('heading', { name: /No case studies match the current search or status filter/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Clear Filters/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Live Delivery Stories' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Clear Filters/i }));

    expect(screen.getByRole('heading', { name: 'Live Delivery Stories' })).toBeInTheDocument();
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

    expect(screen.getByRole('heading', { name: 'Live Delivery Stories' })).toBeInTheDocument();
    expect(screen.getByText(/No live delivery stories match the current view/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Completed Case Studies' })).toBeInTheDocument();
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

  test('treats non-standard active statuses as live delivery section entries', () => {
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

    const ongoingSection = screen.getByRole('heading', { name: 'Live Delivery Stories' }).closest('.projects-section');
    expect(within(ongoingSection).getByText(/Warehouse Upgrade/i)).toBeInTheDocument();
    expect(within(ongoingSection).getByText(/^In Progress$/i)).toBeInTheDocument();
  });

  test('renders case-study framing and client visibility proof inside project cards', () => {
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

    expect(screen.getByRole('heading', { name: /This is not just a contractor gallery/i })).toBeInTheDocument();
    expect(screen.getByText(/^Industrial Retrofit$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Problem$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Response$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Outcome$/i)).toBeInTheDocument();
    expect(screen.getByText(/portal-backed workflow keeps active files/i)).toBeInTheDocument();
  });

  test('renders a residential case study with homeowner-facing delivery proof', () => {
    useProjects.mockReturnValue({
      projects: [
        {
          _id: 'res-1',
          title: 'Homeowner Interior Upgrade',
          location: 'Taguig',
          description: 'Premium condo kitchen and living-room fit-out with owner approvals and phased turnover.',
          status: 'completed',
          date: '2026-02-14',
        },
      ],
      error: null,
      loading: false,
      refreshProjects: vi.fn().mockResolvedValue([]),
      assetBaseUrl: '',
    });

    renderProjects();

    expect(screen.getByText(/^Residential Fit-Out$/i)).toBeInTheDocument();
    expect(screen.getByText(/finish-sensitive residential work needed clearer owner decisions/i)).toBeInTheDocument();
    expect(screen.getByText(/portal-backed update rhythm so homeowner files, finish approvals, and next decisions stayed visible/i)).toBeInTheDocument();
    expect(screen.getByText(/Homeowners had a cleaner picture of progress and closeout/i)).toBeInTheDocument();
    expect(screen.getByText(/Homeowner-facing delivery clarity/i)).toBeInTheDocument();
    expect(screen.getByText(/The portal-backed handoff gave homeowners one closeout record/i)).toBeInTheDocument();
  });
});
