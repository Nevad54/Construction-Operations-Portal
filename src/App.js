import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProjectProvider } from './context/ProjectContext';
import Home from './Home';
import About from './About';
import Services from './Services';
import VisionMission from './VisionMission';
import CoreValues from './CoreValues';
import Safety from './Safety';
import Projects from './components/Projects';
import Contact from './Contact';
import Admin from './components/Admin';
import { initFadeInAnimations } from './utils/fadeInAnimation';
import './styles.css';

function App() {
  useEffect(() => {
    // Initialize fade-in animations
    const cleanup = initFadeInAnimations();
    
    // Re-initialize animations when route changes
    const handleRouteChange = () => {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        initFadeInAnimations();
      }, 100);
    };
    
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      cleanup();
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  return (
    <ProjectProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pages/about" element={<About />} />
          <Route path="/pages/services" element={<Services />} />
          <Route path="/pages/vision-mission" element={<VisionMission />} />
          <Route path="/pages/core-values" element={<CoreValues />} />
          <Route path="/pages/safety" element={<Safety />} />
          <Route path="/pages/projects" element={<Projects />} />
          <Route path="/pages/contact" element={<Contact />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Router>
    </ProjectProvider>
  );
}

export default App;