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

const STORAGE_KEY_ANALYZER_DATA = "tree-test-analyzer-data";

// Load from localStorage on mount
const loadDataFromStorage = (): UploadedData | null => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY_ANALYZER_DATA);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Convert date strings back to Date objects
            if (parsed.participants) {
                parsed.participants = parsed.participants.map((p: any) => ({
                    ...p,
                    startedAt: new Date(p.startedAt),
                    completedAt: p.completedAt ? new Date(p.completedAt) : null,
                }));
            }
            return parsed;
        }
    } catch (error) {
        console.error("Failed to load analyzer data from localStorage:", error);
    }
    return null;
};

function App() {
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

  return (
    <BrowserRouter>
      <ScrollToTop />
      {!hasSeenIntro ? (
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
    </BrowserRouter>
  );
}

export default App;
