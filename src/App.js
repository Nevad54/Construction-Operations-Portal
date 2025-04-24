import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ProjectProvider } from './context/ProjectContext';
import SmoothScroll from './components/SmoothScroll';
import Home from './Home';
import About from './About';
import Services from './Services';
import VisionMission from './VisionMission';
import CoreValues from './CoreValues';
import Safety from './Safety';
import Projects from './components/Projects';
import Contact from './Contact';
import Admin from './components/Admin';

function App() {
  return (
    <ProjectProvider>
      <Router>
        <SmoothScroll>
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
        </SmoothScroll>
      </Router>
    </ProjectProvider>
  );
}

export default App;