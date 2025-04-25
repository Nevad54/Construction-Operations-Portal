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
  const modalContainerRef = useRef(null);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && selectedProject) {
        handleCloseModal();
      }
    };

    const handleClickOutside = (event) => {
      if (modalContainerRef.current === event.target) {
        handleCloseModal();
      }
    };

    if (selectedProject) {
      document.addEventListener('keydown', handleEscKey);
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [selectedProject]);

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
    
    // Calculate the ideal position for the modal
    const clickY = event.clientY;
    const scrollY = window.scrollY;
    const viewportHeight = window.innerHeight;
    
    // After modal is rendered, position it appropriately
    setTimeout(() => {
      if (modalRef.current) {
        const modalHeight = modalRef.current.offsetHeight;
        let topPosition;

        // If clicked in the upper half of viewport
        if (clickY < viewportHeight / 2) {
          topPosition = scrollY + clickY;
        } else {
          // If clicked in the lower half, position modal above click
          topPosition = scrollY + clickY - modalHeight;
        }

        // Ensure modal stays within viewport
        const maxTop = scrollY + viewportHeight - modalHeight - 20; // 20px padding
        const minTop = scrollY + 20; // 20px padding
        topPosition = Math.min(Math.max(topPosition, minTop), maxTop);

        // Apply the position
        modalRef.current.style.top = `${topPosition}px`;
        
        console.log('Modal positioned at:', {
          clickY,
          scrollY,
          topPosition,
          modalHeight,
          viewportHeight,
          windowWidth: window.innerWidth
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
      <div className="projects-container" data-aos="fade-up">
        <div className="controls-container" data-aos="fade-up" data-aos-delay="100">
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
            <div className="section-header" data-aos="fade-up" data-aos-delay="200">
              <h2 className="section-title">Ongoing Projects</h2>
              <span className="section-count">{ongoingProjects.length}</span>
            </div>
            <div className="projects-grid">
              {ongoingProjects.map((project, index) => (
                <div
                  key={project._id}
                  className="project-card hover-lift"
                  onClick={(e) => handleProjectClick(project, e)}
                  data-aos="zoom-in"
                  data-aos-delay={300 + (index * 100)}
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
            <div className="section-header" data-aos="fade-up" data-aos-delay="200">
              <h2 className="section-title">Completed Projects</h2>
              <span className="section-count">{completedProjects.length}</span>
            </div>
            <div className="projects-grid">
              {completedProjects.map((project, index) => (
                <div
                  key={project._id}
                  className="project-card hover-lift"
                  onClick={(e) => handleProjectClick(project, e)}
                  data-aos="zoom-in"
                  data-aos-delay={300 + (index * 100)}
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
          <div 
            ref={modalContainerRef}
            className="project-modal"
            data-aos="fade-in"
          >
            <div 
              ref={modalRef}
              className="modal-content"
              data-aos="zoom-in"
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
        data-aos="fade-up"
      >
        ↑
      </button>
    </div>
  );
};

export default Projects;