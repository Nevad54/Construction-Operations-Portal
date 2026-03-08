import React, { useState, useEffect } from 'react';
import './Projects.css';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faSort } from '@fortawesome/free-solid-svg-icons';
import PageLayout from './PageLayout';
import { useProjects } from '../context/ProjectContext';

const FALLBACK_DESCRIPTION = 'Project summary is being prepared. Full delivery details are available on request.';
const FALLBACK_LOCATION = 'Location shared during project review';
const FALLBACK_DATE = 'Schedule available on request';

const formatProjectDate = (value) => {
  if (!value) return FALLBACK_DATE;
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return FALLBACK_DATE;
  return parsedDate.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const normalizeStatus = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'completed') {
    return {
      key: 'completed',
      label: 'Completed',
      badgeClass: 'status-completed',
      section: 'completed',
    };
  }

  if (normalized === 'ongoing') {
    return {
      key: 'ongoing',
      label: 'Ongoing',
      badgeClass: 'status-ongoing',
      section: 'ongoing',
    };
  }

  return {
    key: normalized || 'active',
    label: normalized ? normalized.replace(/\b\w/g, (char) => char.toUpperCase()) : 'Active',
    badgeClass: 'status-ongoing',
    section: 'ongoing',
  };
};

const normalizeProject = (project) => {
  const status = normalizeStatus(project.status);
  const rawTitle = String(project.title || '').trim();
  const title = rawTitle || 'Untitled Project';

  return {
    ...project,
    title,
    titleInitial: title.charAt(0).toUpperCase(),
    description: String(project.description || '').trim() || FALLBACK_DESCRIPTION,
    location: String(project.location || '').trim() || FALLBACK_LOCATION,
    formattedDate: formatProjectDate(project.date),
    statusMeta: status,
    hasImage: Boolean(project.image),
  };
};

const Projects = () => {
  const { projects, error, loading, refreshProjects, assetBaseUrl } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    // Initialize AOS
    AOS.init({
      duration: 800,
      once: true,
      offset: 100,
      easing: 'ease-in-out'
    });
  }, []);

  const normalizedProjects = projects.map(normalizeProject);

  const filteredProjects = normalizedProjects
    .filter(project => {
      const matchesSearch = (
        project.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (filterStatus === 'all') return matchesSearch;
      return matchesSearch && (project.statusMeta.section === filterStatus);
    })
    .sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  const ongoingProjects = filteredProjects.filter((project) => project.statusMeta.section === 'ongoing');
  const completedProjects = filteredProjects.filter((project) => project.statusMeta.section === 'completed');
  const totalProjects = filteredProjects.length;
  const hasProjects = projects.length > 0;
  const hasActiveFilters = searchTerm.trim().length > 0 || filterStatus !== 'all';
  const hasFilteredResults = totalProjects > 0;

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setSortOrder('desc');
  };

  const projectSummary = [
    {
      label: 'In View',
      value: totalProjects,
      detail: hasActiveFilters
        ? totalProjects === 1 ? 'project matching filters' : 'projects matching filters'
        : totalProjects === 1 ? 'project in portfolio' : 'projects in portfolio',
    },
    {
      label: 'Ongoing',
      value: ongoingProjects.length,
      detail: 'active delivery work',
    },
    {
      label: 'Completed',
      value: completedProjects.length,
      detail: 'finished scopes',
    },
  ];

  return (
    <PageLayout
      meta={{
        title: 'Projects | Construction Operations Portal',
        description: 'Browse selected construction and industrial project work with searchable visibility into ongoing and completed delivery scopes.',
      }}
    >
      <div className="animate-fade-in">
      <div className="projects-container">
        <section className="projects-intro" data-aos="fade-up">
          <div className="projects-intro-copy">
            <p className="projects-story-eyebrow">Project Work</p>
            <h1>Selected project work</h1>
            <p>
              Recent construction and industrial delivery work with direct search and status filters.
            </p>
          </div>
        </section>
        <section className="projects-toolbar" data-aos="fade-up" data-aos-delay="80">
          <div className="projects-summary" aria-label="Project summary">
            {projectSummary.map((item) => (
              <div key={item.label} className="projects-summary-chip">
                <span className="projects-summary-label">{item.label}</span>
                <strong>{item.value}</strong>
                <span className="projects-summary-detail">{item.detail}</span>
              </div>
            ))}
          </div>
          <div className="controls-container">
            <label className="search-box hover-lift" aria-label="Search projects">
            <FontAwesomeIcon icon={faSearch} />
            <input
              type="text"
              className="search-input"
              placeholder="Search by project, location, or scope"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            </label>
          
            <button
              className="sort-button hover-lift"
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              aria-label={`Sort projects ${sortOrder === 'desc' ? 'oldest first' : 'newest first'}`}
            >
              <FontAwesomeIcon icon={faSort} />
              {sortOrder === 'desc' ? 'Oldest first' : 'Newest first'}
            </button>
          
            <label className="projects-filter" aria-label="Filter projects by status">
              <span>Status</span>
              <select
                className="filter-button hover-lift"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All projects</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </label>
          </div>
        </section>

        {loading && (
          <div className="projects-inline-status projects-inline-status--loading" data-aos="fade-up" role="status" aria-live="polite">
            <div className="loading-spinner" aria-hidden="true"></div>
            <div>
              <h3>Loading project data</h3>
              <p>Checking the configured project source and local backend fallbacks.</p>
            </div>
          </div>
        )}

        {!loading && error && (
          <section className="projects-inline-status projects-inline-status--error" data-aos="fade-up">
            <div className="projects-inline-status-copy">
              <p className="projects-story-eyebrow">Project Data Unavailable</p>
              <h3>Project cards could not be loaded right now</h3>
              <p>{error}</p>
            </div>
            <div className="projects-inline-status-actions">
              <button className="retry-button" onClick={() => refreshProjects().catch(() => {})}>
                Retry
              </button>
              <p>The project overview and filters remain available while the data connection is restored.</p>
            </div>
          </section>
        )}

        {!loading && !error && (ongoingProjects.length === 0 && completedProjects.length === 0) && (
          hasProjects ? (
            <section className="projects-inline-status projects-inline-status--empty" data-aos="fade-up" role="status" aria-live="polite">
              <div className="projects-inline-status-copy">
                <p className="projects-story-eyebrow">No Matching Projects</p>
                <h3>No project cards match the current search or status filter</h3>
                <p>Clear the filters to return to the full project list.</p>
              </div>
              <div className="projects-inline-status-actions">
                <button className="retry-button retry-button--neutral" onClick={clearFilters}>
                  Clear Filters
                </button>
                <p>Search, status, and sort will reset to the default portfolio view.</p>
              </div>
            </section>
          ) : (
            <p className="projects-empty-message" data-aos="fade-up">
              No projects to show yet. Connect the database or add projects from the admin panel.
            </p>
          )
        )}

        {!loading && !error && hasFilteredResults && (
        <div className="projects-sections">
          <div className="projects-section">
            <div className="section-header" data-aos="fade-up" data-aos-delay="200">
              <h2 className="section-title">Ongoing Projects</h2>
              <span className="section-count">{ongoingProjects.length}</span>
            </div>
            <div className="projects-grid">
              {ongoingProjects.map((project, index) => (
                <div
                  key={project._id}
                  className="project-card hover-lift"
                  data-aos="fade-up"
                  data-aos-delay={500 + (index * 100)}
                >
                  {project.hasImage ? (
                    <img 
                      src={`${assetBaseUrl}${project.image}`} 
                      alt={project.title} 
                      className="project-image"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="project-image project-image-fallback" aria-hidden="true">
                      <span>{project.titleInitial}</span>
                    </div>
                  )}
                  <div className="project-content">
                    <h3 className="project-title">{project.title}</h3>
                    <p className="project-location">{project.location}</p>
                    <p className="project-date">{project.formattedDate}</p>
                    <p className="project-description">{project.description}</p>
                    <span className={`status-badge ${project.statusMeta.badgeClass}`}>{project.statusMeta.label}</span>
                  </div>
                </div>
              ))}
            </div>
            {ongoingProjects.length === 0 && (
              <p className="projects-section-empty" data-aos="fade-up">
                No ongoing projects match the current view.
              </p>
            )}
          </div>

          <div className="projects-section">
            <div className="section-header" data-aos="fade-up" data-aos-delay="200">
              <h2 className="section-title">Completed Projects</h2>
              <span className="section-count">{completedProjects.length}</span>
            </div>
            <div className="projects-grid">
              {completedProjects.map((project, index) => (
                <div
                  key={project._id}
                  className="project-card hover-lift"
                  data-aos="fade-up"
                  data-aos-delay={500 + (index * 100)}
                >
                  {project.hasImage ? (
                    <img 
                      src={`${assetBaseUrl}${project.image}`} 
                      alt={project.title} 
                      className="project-image"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="project-image project-image-fallback" aria-hidden="true">
                      <span>{project.titleInitial}</span>
                    </div>
                  )}
                  <div className="project-content">
                    <h3 className="project-title">{project.title}</h3>
                    <p className="project-location">{project.location}</p>
                    <p className="project-date">{project.formattedDate}</p>
                    <p className="project-description">{project.description}</p>
                    <span className={`status-badge ${project.statusMeta.badgeClass}`}>{project.statusMeta.label}</span>
                  </div>
                </div>
              ))}
            </div>
            {completedProjects.length === 0 && (
              <p className="projects-section-empty" data-aos="fade-up">
                No completed projects match the current view.
              </p>
            )}
          </div>
        </div>
        )}
      </div>
      </div>
    </PageLayout>
  );
};

export default Projects;


