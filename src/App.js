import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
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
import withFadeIn from './hooks/withFadeIn';

// Wrap each component with the fade-in animation
const FadeInHome = withFadeIn(Home);
const FadeInAbout = withFadeIn(About);
const FadeInServices = withFadeIn(Services);
const FadeInVisionMission = withFadeIn(VisionMission);
const FadeInCoreValues = withFadeIn(CoreValues);
const FadeInSafety = withFadeIn(Safety);
const FadeInProjects = withFadeIn(Projects);
const FadeInContact = withFadeIn(Contact);
const FadeInAdmin = withFadeIn(Admin);

function App() {
  return (
    <ProjectProvider>
      <Router>
        <Routes>
          <Route path="/" element={<FadeInHome />} />
          <Route path="/about" element={<FadeInAbout />} />
          <Route path="/services" element={<FadeInServices />} />
          <Route path="/vision-mission" element={<FadeInVisionMission />} />
          <Route path="/core-values" element={<FadeInCoreValues />} />
          <Route path="/safety" element={<FadeInSafety />} />
          <Route path="/projects" element={<FadeInProjects />} />
          <Route path="/contact" element={<FadeInContact />} />
          <Route path="/admin" element={<FadeInAdmin />} />
        </Routes>
      </Router>
    </ProjectProvider>
  );
}

export default App;