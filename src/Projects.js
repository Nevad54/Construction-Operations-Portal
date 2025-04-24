  return (
    <div>
      {loading && (
        <div className="loading-spinner-container">
          <div className="loading-spinner"></div>
          <div className="loading-spinner-text">Loading Projects...</div>
        </div>
      )}
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
      <section className="projects" role="main">
        <div className="container">
          <h1>Our Projects</h1>
          <div className={`filter-buttons ${loading ? 'loading' : ''}`}>
            {loading ? (
              <>
                <div className="filter-skeleton"></div>
                <div className="filter-skeleton"></div>
                <div className="filter-skeleton"></div>
              </>
            ) : (
              <>
                <button
                  className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('all')}
                >
                  All
                </button>
                <button
                  className={`filter-btn ${activeFilter === 'ongoing' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('ongoing')}
                >
                  Ongoing
                </button>
                <button
                  className={`filter-btn ${activeFilter === 'completed' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('completed')}
                >
                  Completed
                </button>
              </>
            )}
          </div>
          <div className={`project-gallery ${loading ? 'loading' : ''}`}>
            {loading ? (
              <>
                {[1, 2, 3, 4, 5, 6].map((index) => (
                  <div key={index} className="project-skeleton">
                    <div className="project-skeleton-image"></div>
                    <div className="project-skeleton-content">
                      <div className="project-skeleton-title"></div>
                      <div className="project-skeleton-text"></div>
                      <div className="project-skeleton-text"></div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              filteredProjects.map((project) => (
                <div key={project._id} className="project-item">
                  <img
                    src={project.image ? `${API_BASE_URL}${project.image}` : '/placeholder.jpg'}
                    alt={project.title}
                    loading="lazy"
                  />
                  <div className="project-info">
                    <h3>{project.title}</h3>
                    <p>{project.description}</p>
                    <p><strong>Location:</strong> {project.location}</p>
                    <p><strong>Owner:</strong> {project.owner}</p>
                    <p><strong>Date:</strong> {new Date(project.date).toLocaleDateString()}</p>
                    <p><strong>Status:</strong> {project.status}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
      <button
        id="backToTop"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
        style={{ display: showBackToTop ? 'block' : 'none' }}
      >
        ↑
      </button>
      <Footer />
    </div>
  ); 