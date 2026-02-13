import React, { useState, useEffect } from 'react';
import './Projects.css';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faSort } from '@fortawesome/free-solid-svg-icons';
import Header from '../Header';
import Sidebar from '../Sidebar';
import Footer from '../Footer';
import { useProjects } from '../context/ProjectContext';

const Projects = () => {
  const IMAGE_BASE_URL = process.env.REACT_APP_API_URL || '';
  const { projects, error, refreshProjects } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isSidebarActive, setIsSidebarActive] = useState(false);
  const [isNavLinksActive, setIsNavLinksActive] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    // Initialize AOS
    AOS.init({
      duration: 800,
      once: true,
      offset: 100,
      easing: 'ease-in-out'
    });
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

  if (error) {
    return (
      <div className="error-container">
        <h3>Error loading projects</h3>
        <p>{error}</p>
        <button className="retry-button" onClick={() => refreshProjects()}>
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
        <h1 data-aos="fade-up">Our Projects</h1>
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
            data-aos="fade-up"
            data-aos-delay="200"
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
          >
            <FontAwesomeIcon icon={faSort} />
            {` Sort ${sortOrder === 'desc' ? 'Oldest' : 'Newest'} First`}
          </button>
          
          <select
            className="filter-button hover-lift"
            data-aos="fade-up"
            data-aos-delay="300"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Projects</option>
            <option value="ongoing">Ongoing Projects</option>
            <option value="completed">Completed Projects</option>
          </select>
        </div>

        {(ongoingProjects.length === 0 && completedProjects.length === 0) && (
          <p className="projects-empty-message" data-aos="fade-up">
            No projects to show yet. Connect the database or add projects from the admin panel.
          </p>
        )}
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
                    {project.date && (
                      <p className="project-date">{new Date(project.date).toLocaleDateString()}</p>
                    )}
                    <p className="project-description">{project.description}</p>
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
                  data-aos="fade-up"
                  data-aos-delay={500 + (index * 100)}
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
                    {project.date && (
                      <p className="project-date">{new Date(project.date).toLocaleDateString()}</p>
                    )}
                    <p className="project-description">{project.description}</p>
                    <span className="status-badge status-completed">Completed</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
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
