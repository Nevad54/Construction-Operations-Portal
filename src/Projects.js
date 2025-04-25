import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import './styles.css';

const Projects = () => {
  const [isSidebarActive, setIsSidebarActive] = useState(false);
  const [isNavLinksActive, setIsNavLinksActive] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [error, setError] = useState(null);

  // Add Project Schema
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Our Projects",
      "description": "View our portfolio of construction and engineering projects in Silang Cavite",
      "publisher": {
        "@type": "Organization",
        "name": "Mastertech Intergrouppe Inc.",
        "url": "https://mastertech-app.vercel.app"
      },
      "mainEntity": {
        "@type": "ItemList",
        "itemListElement": projects.map((project, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "CreativeWork",
            "name": project.title,
            "description": project.description,
            "image": project.image,
            "datePublished": project.date,
            "location": {
              "@type": "Place",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Silang",
                "addressRegion": "Cavite",
                "addressCountry": "PH"
              }
            }
          }
        }))
      }
    });
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [projects]);

  // ... existing code ...

  return (
    <div>
      <Sidebar
        isSidebarActive={isSidebarActive}
        setIsSidebarActive={setIsSidebarActive}
        setIsNavLinksActive={setIsNavLinksActive}
        activePage={activePage}
      />
      <Header
        isSidebarActive={isSidebarActive}
        setIsSidebarActive={setIsSidebarActive}
        isNavLinksActive={isNavLinksActive}
        setIsNavLinksActive={setIsNavLinksActive}
        activePage={activePage}
      />
      <main>
        <section className="projects" role="main">
          <div className="container">
            <h1>Our Projects in Silang Cavite</h1>
            <div className="project-filters">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search projects"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort projects by"
              >
                <option value="date">Date</option>
                <option value="title">Title</option>
                <option value="category">Category</option>
              </select>
            </div>
            <div className="project-grid">
              {filteredProjects.map((project, index) => (
                <div key={index} className="project-card">
                  <img
                    src={project.image}
                    alt={`${project.title} - Construction Project by Mastertech Intergrouppe Inc.`}
                    loading="lazy"
                  />
                  <div className="project-info">
                    <h2>{project.title}</h2>
                    <p>{project.description}</p>
                    <span className="project-category">{project.category}</span>
                    <span className="project-date">{project.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
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