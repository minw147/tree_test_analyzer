import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Landing } from "@/pages/Landing";
import { Analyzer } from "@/pages/Analyzer";
import { Creator } from "@/pages/Creator";
import { Help } from "@/pages/Help";
import { ParticipantView } from "@/pages/ParticipantView";
import { Preview } from "@/pages/Preview";
import { Layout } from "@/components/layout/Layout";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/analyze" element={<Analyzer />} />
          <Route path="/analyze/:studyId" element={<Analyzer />} />
          <Route path="/create" element={<Creator />} />
          <Route path="/create/:studyId" element={<Creator />} />
          <Route path="/help" element={<Help />} />
        </Route>
        <Route path="/test/:studyId" element={<ParticipantView />} />
        <Route path="/preview" element={<Preview />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
