import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Landing } from "@/pages/Landing";
import { Analyzer } from "@/pages/Analyzer";
import { Creator } from "@/pages/Creator";
import { Help } from "@/pages/Help";
import { Settings } from "@/pages/Settings";
import { ParticipantView } from "@/pages/ParticipantView";
import { Preview } from "@/pages/Preview";
import { Layout } from "@/components/layout/Layout";
import { IntroScreen } from "@/components/intro/IntroScreen";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function AppContent() {
  const location = useLocation();
  const isParticipantRoute = location.pathname.startsWith('/test/') || location.pathname === '/preview';
  
  const [hasSeenIntro, setHasSeenIntro] = useState(() => {
    try {
      return localStorage.getItem('hasSeenIntro') === 'true';
    } catch {
      return false;
    }
  });

  const handleIntroComplete = () => {
    try {
      localStorage.setItem('hasSeenIntro', 'true');
      setHasSeenIntro(true);
    } catch (error) {
      console.error('Failed to save intro completion:', error);
      setHasSeenIntro(true);
    }
  };

  // Skip intro screen for participant routes
  const shouldShowIntro = !hasSeenIntro && !isParticipantRoute;

  return (
    <>
      <ScrollToTop />
      {shouldShowIntro ? (
        <IntroScreen onComplete={handleIntroComplete} />
      ) : (
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/analyze" element={<Analyzer />} />
            <Route path="/analyze/:studyId" element={<Analyzer />} />
            <Route path="/create" element={<Creator />} />
            <Route path="/create/:studyId" element={<Creator />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/help" element={<Help />} />
          </Route>
          <Route path="/test/:studyId" element={<ParticipantView />} />
          <Route path="/preview" element={<Preview />} />
        </Routes>
      )}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
