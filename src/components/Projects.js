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
const DEFAULT_PROOF_LINE = 'A clearer project record people can trust quickly.';

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
  const location = String(project.location || '').trim() || FALLBACK_LOCATION;
  const description = String(project.description || '').trim() || FALLBACK_DESCRIPTION;
  const titleLower = title.toLowerCase();
  const locationLower = location.toLowerCase();
  const descriptionLower = description.toLowerCase();
  const projectFingerprint = `${titleLower} ${locationLower} ${descriptionLower}`;
  const looksIndustrial = /plant|fabrication|industrial|shutdown|process|maintenance/.test(projectFingerprint);
  const looksCommercial = /office|retail|commercial|fit-out|tenant|campus/.test(projectFingerprint);
  const looksRenovation = /renovation|retrofit|upgrade|interior|existing/.test(projectFingerprint);
  const looksResidential = /residential|homeowner|home|villa|condo|kitchen|bath|apartment/.test(projectFingerprint);

  let sector = 'Operations Delivery';
  if (looksIndustrial) sector = 'Industrial Retrofit';
  else if (looksResidential) sector = 'Residential Fit-Out';
  else if (looksCommercial) sector = 'Commercial Fit-Out';
  else if (looksRenovation) sector = 'Renovation / Upgrade';

  const clientVisibilityNote = looksResidential
    ? (status.section === 'completed'
      ? 'The portal-backed handoff gave homeowners one closeout record for punch items, warranty files, and final finish follow-ups.'
      : 'The portal-backed workflow keeps owner approvals, current files, and room-by-room next actions visible while the home is still active.')
    : status.section === 'completed'
      ? 'The portal-backed handoff gave clients and operators one final record for closeout, proof files, and remaining follow-ups.'
      : 'The portal-backed workflow keeps active files, status context, and next actions visible while work is still moving.';

  const missingCoreFields = [
    !rawTitle,
    !String(project.location || '').trim(),
    !String(project.description || '').trim(),
    !project.date,
  ].filter(Boolean).length;

  const needsReview = missingCoreFields > 0;
  const ownerNextStep = needsReview
    ? 'Fill the missing details before using this as proof.'
    : status.section === 'completed'
      ? 'Use this when you need a finished handoff example.'
      : 'Use this when you need a live delivery example.';

  const proofLine = looksIndustrial
    ? 'Clear handoffs for plant-facing work.'
    : looksResidential
      ? 'Cleaner homeowner updates and closeout.'
      : looksCommercial
        ? 'Progress visibility without extra chasing.'
        : looksRenovation
          ? 'A clearer record for live upgrade work.'
          : DEFAULT_PROOF_LINE;

  const quickFacts = [
    status.section === 'completed' ? 'Finished-work proof' : 'Active-work proof',
    needsReview ? 'Needs cleanup' : 'Ready to present',
  ];

  return {
    ...project,
    title,
    titleInitial: title.charAt(0).toUpperCase(),
    description,
    location,
    formattedDate: formatProjectDate(project.date),
    statusMeta: status,
    hasImage: Boolean(project.image),
    sector,
    clientVisibilityNote,
    proofLine,
    quickFacts,
    searchableText: `${title} ${location} ${description} ${sector}`.toLowerCase(),
    needsReview,
    ownerNextStep,
    missingCoreFields,
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
      const matchesSearch = project.searchableText.includes(searchTerm.toLowerCase());
      
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
  const needsReviewProjects = filteredProjects.filter((project) => project.needsReview);
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
      label: 'Projects in View',
      value: totalProjects,
      detail: hasActiveFilters
        ? totalProjects === 1 ? 'project matching the current filters' : 'projects matching the current filters'
        : totalProjects === 1 ? 'project ready for review' : 'projects ready for review',
    },
    {
      label: 'Ongoing',
      value: ongoingProjects.length,
      detail: ongoingProjects.length ? 'active delivery records' : 'no active delivery records',
    },
    {
      label: 'Completed',
      value: completedProjects.length,
      detail: completedProjects.length ? 'closeout-ready records' : 'no completed records in view',
    },
    {
      label: 'Needs Review',
      value: needsReviewProjects.length,
      detail: needsReviewProjects.length
        ? 'records missing one or more core details'
        : 'no project cards are missing core details',
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
            <p className="projects-story-eyebrow">Project Proof</p>
            <h1>Selected work visitors can scan fast.</h1>
            <p>Type, place, status, and a quick use case.</p>
          </div>
        </section>
        <section className="projects-toolbar" data-aos="fade-up" data-aos-delay="40">
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
              <h3>Case study cards could not be loaded right now</h3>
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
                <h3>No projects match the current search or status filter</h3>
                <p>Clear the filters to get back to the full project review list.</p>
              </div>
              <div className="projects-inline-status-actions">
                <button className="retry-button retry-button--neutral" onClick={clearFilters}>
                  Clear Filters
                </button>
                <p>Search, status, and sort will reset to the default projects view.</p>
              </div>
            </section>
          ) : (
            <p className="projects-empty-message" data-aos="fade-up">
              No projects to show yet. Add the first real project from the admin side before using this page as proof.
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
                    <div className="project-card-meta">
                      <p className="project-sector">{project.sector}</p>
                      <span className={`status-badge ${project.statusMeta.badgeClass}`}>{project.statusMeta.label}</span>
                    </div>
                    <h3 className="project-title">{project.title}</h3>
                    <div className="project-facts" aria-label={`${project.title} project facts`}>
                      <p className="project-location">{project.location}</p>
                      <p className="project-date">{project.formattedDate}</p>
                    </div>
                    <p className="project-description">{project.description}</p>
                    <ul className="project-quick-facts" aria-label={`${project.title} proof highlights`}>
                      {project.quickFacts.map((fact) => (
                        <li key={fact}>{fact}</li>
                      ))}
                    </ul>
                    <div className="project-proof-line">
                      <strong>Why it helps</strong>
                      <p>{project.proofLine}</p>
                    </div>
                    <div className={`project-next-step ${project.needsReview ? 'project-next-step--warning' : ''}`}>
                      <strong>{project.needsReview ? 'Needs review' : 'Best use'}</strong>
                      <p>{project.ownerNextStep}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {ongoingProjects.length === 0 && (
              <p className="projects-section-empty" data-aos="fade-up">
                No ongoing projects match the current view. Clear filters or switch the status filter to review completed work.
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
                    <div className="project-card-meta">
                      <p className="project-sector">{project.sector}</p>
                      <span className={`status-badge ${project.statusMeta.badgeClass}`}>{project.statusMeta.label}</span>
                    </div>
                    <h3 className="project-title">{project.title}</h3>
                    <div className="project-facts" aria-label={`${project.title} project facts`}>
                      <p className="project-location">{project.location}</p>
                      <p className="project-date">{project.formattedDate}</p>
                    </div>
                    <p className="project-description">{project.description}</p>
                    <ul className="project-quick-facts" aria-label={`${project.title} proof highlights`}>
                      {project.quickFacts.map((fact) => (
                        <li key={fact}>{fact}</li>
                      ))}
                    </ul>
                    <div className="project-proof-line">
                      <strong>Why it helps</strong>
                      <p>{project.proofLine}</p>
                    </div>
                    <div className={`project-next-step ${project.needsReview ? 'project-next-step--warning' : ''}`}>
                      <strong>{project.needsReview ? 'Needs review' : 'Best use'}</strong>
                      <p>{project.ownerNextStep}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {completedProjects.length === 0 && (
              <p className="projects-section-empty" data-aos="fade-up">
                No completed projects match the current view. Clear filters or switch back to ongoing work.
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


