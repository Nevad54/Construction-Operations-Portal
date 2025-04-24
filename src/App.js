import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ProjectProvider } from './context/ProjectContext';
import Home from './Home';

// Lazy load components
const About = lazy(() => import('./About'));
const Services = lazy(() => import('./Services'));
const VisionMission = lazy(() => import('./VisionMission'));
const CoreValues = lazy(() => import('./CoreValues'));
const Safety = lazy(() => import('./Safety'));
const Projects = lazy(() => import('./components/Projects'));
const Contact = lazy(() => import('./Contact'));
const Admin = lazy(() => import('./components/Admin'));

// Loading component
const Loading = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
  </div>
);

function App() {
  return (
    <ProjectProvider>
      <Router>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/vision-mission" element={<VisionMission />} />
            <Route path="/core-values" element={<CoreValues />} />
            <Route path="/safety" element={<Safety />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </Suspense>
      </Router>
    </ProjectProvider>
  );
}

export default App;