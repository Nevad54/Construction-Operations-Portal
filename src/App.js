import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import About from './About';
import Services from './Services';
import VisionMission from './VisionMission';
import CoreValues from './CoreValues';
import Safety from './Safety';
import Projects from './Projects';
import Contact from './Contact';

function App() {
  return (
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
      </Routes>
    </Router>
  );
}

export default App;