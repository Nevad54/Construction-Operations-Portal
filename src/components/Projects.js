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
const DEFAULT_CASE_STUDY_PROBLEM = 'Stakeholders needed a clearer operating picture without relying on fragmented updates.';
const DEFAULT_CASE_STUDY_SOLUTION = 'The delivery workflow was reorganized around visible ownership, cleaner reporting, and a shared project record.';
const DEFAULT_CASE_STUDY_OUTCOME = 'Project visibility improved, follow-ups stayed accountable, and client communication became easier to repeat.';

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
    challenge: looksIndustrial
      ? 'Production-sensitive work needed cleaner coordination so shutdown windows and follow-ups did not drift.'
      : looksResidential
        ? 'Finish-sensitive residential work needed clearer owner decisions so approvals, selections, and room handoffs did not scatter.'
      : looksCommercial
        ? 'Multiple stakeholders needed one clearer view of status, approvals, and delivery sequencing.'
        : looksRenovation
          ? 'Existing conditions and live-site constraints created handoff risk unless progress stayed visible.'
          : DEFAULT_CASE_STUDY_PROBLEM,
    solution: looksIndustrial
      ? 'Execution was organized around field ownership, file visibility, and a steadier reporting rhythm for plant-facing work.'
      : looksResidential
        ? 'The team used a portal-backed update rhythm so homeowner files, finish approvals, and next decisions stayed visible through each phase.'
      : looksCommercial
        ? 'The workflow connected client communication, project files, and delivery checkpoints into one operating path.'
        : looksRenovation
          ? 'The team used a more explicit project record so phasing, files, and follow-up decisions stayed in view.'
          : DEFAULT_CASE_STUDY_SOLUTION,
    outcome: looksIndustrial
      ? 'Supervisors and clients could see the current job picture faster, which reduced coordination drag around active work.'
      : looksResidential
        ? 'Homeowners had a cleaner picture of progress and closeout because updates, files, and approvals stayed in one repeatable flow.'
      : looksCommercial
        ? 'Project communication became easier to repeat because the client-facing story and the internal operating view stayed aligned.'
        : looksRenovation
          ? 'The delivery team had a cleaner closeout path because changes, files, and next actions were easier to trace.'
          : DEFAULT_CASE_STUDY_OUTCOME,
    spotlightMetric: looksIndustrial
      ? 'Portal-backed field visibility'
      : looksResidential
        ? 'Homeowner-facing delivery clarity'
      : looksCommercial
        ? 'Client-facing delivery clarity'
        : looksRenovation
          ? 'Follow-up ownership through closeout'
          : 'Structured project visibility',
    searchableText: `${title} ${location} ${description} ${sector}`.toLowerCase(),
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
      label: 'Case Studies',
      value: totalProjects,
      detail: hasActiveFilters
        ? totalProjects === 1 ? 'case study matching filters' : 'case studies matching filters'
        : totalProjects === 1 ? 'case study in proof set' : 'case studies in proof set',
    },
    {
      label: 'Live Work',
      value: ongoingProjects.length,
      detail: 'active delivery stories',
    },
    {
      label: 'Closeout Proof',
      value: completedProjects.length,
      detail: 'completed delivery stories',
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
            <p className="projects-story-eyebrow">Case Studies</p>
            <h1>Project proof that sells both delivery capability and the client-facing portal.</h1>
            <p>
              These stories are framed around operating problems, execution response, and the visibility clients gained
              once project files, follow-ups, and status checkpoints stayed in one workflow.
            </p>
          </div>
        </section>
        <section className="projects-proof-band" data-aos="fade-up" data-aos-delay="40" aria-label="Why the case studies matter">
          <div className="projects-proof-band__copy">
            <p className="projects-story-eyebrow">Hybrid Positioning</p>
            <h2>This is not just a contractor gallery.</h2>
            <p>
              The route now shows where the portal improved accountability and client visibility, not just where work
              happened. The goal is to prove the hybrid offer with concrete operating outcomes.
            </p>
          </div>
          <div className="projects-proof-band__pillars">
            <span>Problem / solution / outcome framing</span>
            <span>Portal-backed client visibility notes</span>
            <span>Searchable by sector and delivery context</span>
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
                <p className="projects-story-eyebrow">No Matching Case Studies</p>
                <h3>No case studies match the current search or status filter</h3>
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
              <h2 className="section-title">Live Delivery Stories</h2>
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
                    <p className="project-sector">{project.sector}</p>
                    <h3 className="project-title">{project.title}</h3>
                    <p className="project-location">{project.location}</p>
                    <p className="project-date">{project.formattedDate}</p>
                    <p className="project-description">{project.description}</p>
                    <dl className="project-case-study">
                      <div>
                        <dt>Problem</dt>
                        <dd>{project.challenge}</dd>
                      </div>
                      <div>
                        <dt>Response</dt>
                        <dd>{project.solution}</dd>
                      </div>
                      <div>
                        <dt>Outcome</dt>
                        <dd>{project.outcome}</dd>
                      </div>
                    </dl>
                    <div className="project-visibility-note">
                      <strong>{project.spotlightMetric}</strong>
                      <p>{project.clientVisibilityNote}</p>
                    </div>
                    <span className={`status-badge ${project.statusMeta.badgeClass}`}>{project.statusMeta.label}</span>
                  </div>
                </div>
              ))}
            </div>
            {ongoingProjects.length === 0 && (
              <p className="projects-section-empty" data-aos="fade-up">
                No live delivery stories match the current view.
              </p>
            )}
          </div>

          <div className="projects-section">
            <div className="section-header" data-aos="fade-up" data-aos-delay="200">
              <h2 className="section-title">Completed Case Studies</h2>
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
                    <p className="project-sector">{project.sector}</p>
                    <h3 className="project-title">{project.title}</h3>
                    <p className="project-location">{project.location}</p>
                    <p className="project-date">{project.formattedDate}</p>
                    <p className="project-description">{project.description}</p>
                    <dl className="project-case-study">
                      <div>
                        <dt>Problem</dt>
                        <dd>{project.challenge}</dd>
                      </div>
                      <div>
                        <dt>Response</dt>
                        <dd>{project.solution}</dd>
                      </div>
                      <div>
                        <dt>Outcome</dt>
                        <dd>{project.outcome}</dd>
                      </div>
                    </dl>
                    <div className="project-visibility-note">
                      <strong>{project.spotlightMetric}</strong>
                      <p>{project.clientVisibilityNote}</p>
                    </div>
                    <span className={`status-badge ${project.statusMeta.badgeClass}`}>{project.statusMeta.label}</span>
                  </div>
                </div>
              ))}
            </div>
            {completedProjects.length === 0 && (
              <p className="projects-section-empty" data-aos="fade-up">
                No completed case studies match the current view.
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


