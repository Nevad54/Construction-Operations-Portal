import React, { useState, useEffect, useRef } from 'react';
import './Projects.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faSort, faFilter, faTimes } from '@fortawesome/free-solid-svg-icons';
import Header from '../Header';
import Sidebar from '../Sidebar';
import Footer from '../Footer';

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
  const modalRef = useRef(null);

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

  const handleProjectClick = (project, event) => {
    setSelectedProject(project);
    // Log click position
    console.log('Click position:', {
      clickY: event.clientY,
      windowHeight: window.innerHeight,
      scrollPosition: window.scrollY
    });

    // After modal is rendered, log its position
    setTimeout(() => {
      if (modalRef.current) {
        const modalRect = modalRef.current.getBoundingClientRect();
        console.log('Modal position:', {
          top: modalRect.top,
          bottom: modalRect.bottom,
          height: modalRect.height,
          viewportHeight: window.innerHeight,
          isFullyVisible: 
            modalRect.top >= 0 &&
            modalRect.bottom <= window.innerHeight
        });
      }
    }, 0);
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
    <div className="animate-fade-in">
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
        <div className="controls-container animate-slide-in">
          <div className="search-box hover-lift">
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
            className="sort-button hover-lift"
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
          >
            <FontAwesomeIcon icon={faSort} />
            {` Sort ${sortOrder === 'desc' ? 'Oldest' : 'Newest'} First`}
          </button>
          
          <select
            className="filter-button hover-lift"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Projects</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="projects-sections">
          <div className="projects-section">
            <div className="section-header animate-slide-in stagger-1">
              <h2 className="section-title">Ongoing Projects</h2>
              <span className="section-count">{ongoingProjects.length}</span>
            </div>
            <div className="projects-grid">
              {ongoingProjects.map((project, index) => (
                <div
                  key={project._id}
                  className={`project-card hover-lift animate-scale-in stagger-${(index % 5) + 1}`}
                  onClick={(e) => handleProjectClick(project, e)}
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
              ))}
            </div>
          </div>

          <div className="projects-section">
            <div className="section-header animate-slide-in stagger-2">
              <h2 className="section-title">Completed Projects</h2>
              <span className="section-count">{completedProjects.length}</span>
            </div>
            <div className="projects-grid">
              {completedProjects.map((project, index) => (
                <div
                  key={project._id}
                  className={`project-card hover-lift animate-scale-in stagger-${(index % 5) + 1}`}
                  onClick={(e) => handleProjectClick(project, e)}
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
              ))}
            </div>
          </div>
        </div>

        {selectedProject && (
          <div className="project-modal animate-fade-in">
            <div 
              ref={modalRef}
              className="modal-content animate-scale-in"
            >
              <div className="modal-header">
                <h2>{selectedProject.title}</h2>
                <button
                  className="modal-close hover-rotate"
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
        )}
      </div>
      <Footer />
      <button
        id="backToTop"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
        style={{ display: showBackToTop ? 'block' : 'none' }}
        className="hover-lift"
      >
        ↑
      </button>
    </div>
  );
};

export default Projects;