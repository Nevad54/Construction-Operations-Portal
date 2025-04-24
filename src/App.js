import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
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
import PageAnimation from './components/PageAnimation';

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageAnimation><Home /></PageAnimation>} />
        <Route path="/about" element={<PageAnimation><About /></PageAnimation>} />
        <Route path="/services" element={<PageAnimation><Services /></PageAnimation>} />
        <Route path="/vision-mission" element={<PageAnimation><VisionMission /></PageAnimation>} />
        <Route path="/core-values" element={<PageAnimation><CoreValues /></PageAnimation>} />
        <Route path="/safety" element={<PageAnimation><Safety /></PageAnimation>} />
        <Route path="/projects" element={<PageAnimation><Projects /></PageAnimation>} />
        <Route path="/contact" element={<PageAnimation><Contact /></PageAnimation>} />
        <Route path="/admin" element={<PageAnimation><Admin /></PageAnimation>} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ProjectProvider>
      <Router>
        <AnimatedRoutes />
      </Router>
    </ProjectProvider>
  );
}

export default App;