import React, { useState, useEffect } from 'react';
import './Projects.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faSort, faFilter, faTimes } from '@fortawesome/free-solid-svg-icons';
import Header from '../Header';
import Sidebar from '../Sidebar';
import Footer from '../Footer';
import FadeIn from './FadeIn';

const Projects = () => {
  const IMAGE_BASE_URL = process.env.REACT_APP_API_URL || '';
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isSidebarActive, setIsSidebarActive] = useState(false);
  const [isNavLinksActive, setIsNavLinksActive] = useState(false);
  const [exitingProject, setExitingProject] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const handleScroll = () => {
    setShowBackToTop(window.scrollY > 200);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const loadProjects = async () => {
    try {
      setError(null);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/projects`);
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredProjects = projects
    .filter(project => {
      const matchesSearch = (
        project.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (filterStatus === 'all') return matchesSearch;
      return matchesSearch && (project.status === filterStatus);
    })
    .sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  const ongoingProjects = filteredProjects.filter(p => p.status === 'ongoing');
  const completedProjects = filteredProjects.filter(p => p.status === 'completed');

  const handleProjectClick = (project) => {
    setSelectedProject(project);
  };

  const handleCloseModal = () => {
    setExitingProject(selectedProject);
    setTimeout(() => {
      setSelectedProject(null);
      setExitingProject(null);
    }, 300);
  };

  if (error) {
    return (
      <div className="error-container">
        <h3>Error loading projects</h3>
        <p>{error}</p>
        <button className="retry-button" onClick={loadProjects}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <Sidebar
        isSidebarActive={isSidebarActive}
        setIsSidebarActive={setIsSidebarActive}
        setIsNavLinksActive={setIsNavLinksActive}
        activePage="projects"
      />
      <Header
        isSidebarActive={isSidebarActive}
        setIsSidebarActive={setIsSidebarActive}
        isNavLinksActive={isNavLinksActive}
        setIsNavLinksActive={setIsNavLinksActive}
        activePage="projects"
      />
      <div className="projects-container">
        <FadeIn direction="up" delay={0.2}>
          <div className="controls-container">
            <div className="search-box">
              <FontAwesomeIcon icon={faSearch} />
              <input
                type="text"
                className="search-input"
                placeholder="Search projects by name, location, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <button
              className="sort-button"
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            >
              <FontAwesomeIcon icon={faSort} />
              {` Sort ${sortOrder === 'desc' ? 'Oldest' : 'Newest'} First`}
            </button>
            
            <select
              className="filter-button"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Projects</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </FadeIn>

        <div className="projects-sections">
          <FadeIn direction="up" delay={0.4}>
            <div className="projects-section">
              <div className="section-header">
                <h2 className="section-title">Ongoing Projects</h2>
                <span className="section-count">{ongoingProjects.length}</span>
              </div>
              <div className="projects-grid">
                {ongoingProjects.map((project, index) => (
                  <FadeIn key={project._id} direction="up" delay={0.2 + (index * 0.1)}>
                    <div
                      className={`project-card ${exitingProject === project ? 'exit' : ''}`}
                      onClick={() => handleProjectClick(project)}
                    >
                      {project.image && (
                        <img 
                          src={`${IMAGE_BASE_URL}${project.image}`} 
                          alt={project.title} 
                          className="project-image"
                        />
                      )}
                      <div className="project-content">
                        <h3 className="project-title">{project.title}</h3>
                        <p className="project-location">{project.location}</p>
                        <span className="status-badge status-ongoing">Ongoing</span>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </FadeIn>

          <FadeIn direction="up" delay={0.6}>
            <div className="projects-section">
              <div className="section-header">
                <h2 className="section-title">Completed Projects</h2>
                <span className="section-count">{completedProjects.length}</span>
              </div>
              <div className="projects-grid">
                {completedProjects.map((project, index) => (
                  <FadeIn key={project._id} direction="up" delay={0.2 + (index * 0.1)}>
                    <div
                      className={`project-card ${exitingProject === project ? 'exit' : ''}`}
                      onClick={() => handleProjectClick(project)}
                    >
                      {project.image && (
                        <img 
                          src={`${IMAGE_BASE_URL}${project.image}`} 
                          alt={project.title} 
                          className="project-image"
                        />
                      )}
                      <div className="project-content">
                        <h3 className="project-title">{project.title}</h3>
                        <p className="project-location">{project.location}</p>
                        <span className="status-badge status-completed">Completed</span>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>

        {selectedProject && (
          <FadeIn duration={0.3}>
            <div className="project-modal" onClick={handleCloseModal}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>{selectedProject.title}</h2>
                  <button
                    className="modal-close"
                    onClick={handleCloseModal}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                {selectedProject.image && (
                  <img 
                    src={`${IMAGE_BASE_URL}${selectedProject.image}`} 
                    alt={selectedProject.title} 
                    className="modal-image"
                  />
                )}
                <div className="modal-details">
                  <p><strong>Location:</strong> {selectedProject.location || 'N/A'}</p>
                  <p><strong>Status:</strong> 
                    <span className={`modal-status ${selectedProject.status}`}>
                      {selectedProject.status === 'completed' ? 'Completed' : 'Ongoing'}
                    </span>
                  </p>
                  {selectedProject.date && (
                    <p><strong>Date:</strong> {new Date(selectedProject.date).toLocaleDateString()}</p>
                  )}
                  <p><strong>Description:</strong> {selectedProject.description}</p>
                </div>
              </div>
            </div>
          </FadeIn>
        )}
      </div>
      <Footer />
      <button
        id="backToTop"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
        style={{ display: showBackToTop ? 'block' : 'none' }}
      >
        ↑
      </button>
    </div>
  );
};

export default Projects;